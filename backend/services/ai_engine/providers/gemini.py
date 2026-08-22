import time
import json
from typing import Dict, Any, List, Optional
from core.http_client import AIHttpClient
from .base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    """
    Native Gemini Provider using Google's Generative Language API via httpx.
    Includes multi-model fallback resilience against 503/404 errors.
    """
    
    FALLBACK_MODELS = [
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash"
    ]

    def _get_url(self, endpoint: str, model_override: str = None, api_version: str = "v1beta", stream: bool = False) -> str:
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        model = model_override or self.model or "gemini-3.6-flash"
        if model in ["gemini-flash-latest", "gemini-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
            model = "gemini-3.6-flash"
        elif model in ["gemini-pro-latest", "gemini-pro", "gemini-1.5-pro", "gemini-2.0-pro"]:
            model = "gemini-2.5-pro"
            
        clean_key = str(self.api_key or "").strip()
        if stream:
            return f"{base}/{api_version}/models/{model}:streamGenerateContent?key={clean_key}"
        return f"{base}/{api_version}/models/{model}:generateContent?key={clean_key}"

    def _build_payload(self, task: str, prompt: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        system_content = f"You are a helpful AI assistant performing the following task: {task}"
        if context:
            system_content += f"\nContext:\n{json.dumps(context, indent=2)}"
            
        return {
            "system_instruction": {
                "parts": {"text": system_content}
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": float(self.kwargs.get("temperature", 0.7)),
                "maxOutputTokens": int(self.kwargs.get("max_tokens", 2048)),
            }
        }

    async def generate(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = self._build_payload(task, prompt, context)
        headers = {"Content-Type": "application/json"}
        
        target_model = self.model or "gemini-1.5-flash"
        if target_model in ["gemini-flash-latest", "gemini-flash"]:
            target_model = "gemini-1.5-flash"
            
        models_to_try = [target_model]
        for fb in self.FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)
                
        last_error = None
        for ver in ["v1beta", "v1"]:
            for m in models_to_try:
                url = self._get_url("", model_override=m, api_version=ver, stream=False)
                try:
                    response = await AIHttpClient.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = ""
                        if data.get("candidates") and data["candidates"][0].get("content", {}).get("parts"):
                            content = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {
                            "content": content,
                            "raw": data,
                            "model": m
                        }
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text}"
                except Exception as e:
                    last_error = str(e)
                
        raise RuntimeError(f"Gemini API Error (Tried models: {', '.join(models_to_try)}): {last_error}")

    async def generate_stream(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None):
        payload = self._build_payload(task, prompt, context)
        headers = {"Content-Type": "application/json"}
        
        target_model = self.model or "gemini-1.5-flash"
        if target_model in ["gemini-flash-latest", "gemini-flash"]:
            target_model = "gemini-1.5-flash"
            
        models_to_try = [target_model]
        for fb in self.FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        for m in models_to_try:
            url = self._get_url("", model_override=m, stream=True)
            try:
                async for chunk in AIHttpClient.stream_post(url, headers=headers, json=payload):
                    if chunk.status_code == 200:
                        async for line in chunk.aiter_lines():
                            if line.startswith("data: "):
                                try:
                                    data = json.loads(line[6:])
                                    if data.get("candidates") and data["candidates"][0].get("content", {}).get("parts"):
                                        yield data["candidates"][0]["content"]["parts"][0]["text"]
                                except json.JSONDecodeError:
                                    continue
                        return
            except Exception:
                continue

    async def test_connection(self) -> Dict[str, Any]:
        start_time = time.time()
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        models_url = f"{base}/v1beta/models?key={self.api_key}"
        
        result = {
            "provider": "Gemini",
            "model": self.model or "gemini-1.5-flash",
            "endpoint": models_url,
            "latency_ms": 0,
            "authentication": "Unknown",
            "error": None,
            "success": False
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            response = await AIHttpClient.get(models_url, headers=headers)
            result["latency_ms"] = round((time.time() - start_time) * 1000)
            if response.status_code == 200:
                result["authentication"] = "Valid"
                result["success"] = True
            elif response.status_code in (400, 403):
                result["authentication"] = "Invalid credentials or request"
                result["error"] = response.text
            else:
                result["error"] = f"HTTP {response.status_code}: {response.text}"
        except Exception as e:
            result["latency_ms"] = round((time.time() - start_time) * 1000)
            result["error"] = str(e)
            result["authentication"] = "Failed to connect"
            
        return result

    async def get_models(self) -> List[str]:
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        url = f"{base}/v1beta/models?key={self.api_key}"
        try:
            response = await AIHttpClient.get(url, headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                data = response.json()
                valid = [m["name"].replace("models/", "") for m in data.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
                if valid:
                    return valid
            return self.FALLBACK_MODELS
        except Exception:
            return self.FALLBACK_MODELS

    @property
    def capabilities(self) -> List[str]:
        return [
            "metadata", 
            "seo", 
            "tags", 
            "streaming", 
            "models", 
            "vision"
        ]

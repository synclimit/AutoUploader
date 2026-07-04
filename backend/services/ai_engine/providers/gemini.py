import time
import json
from typing import Dict, Any, List, Optional
from core.http_client import AIHttpClient
from .base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    """
    Native Gemini Provider using Google's Generative Language API via httpx.
    """
    
    def _get_url(self, endpoint: str, stream: bool = False) -> str:
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        model = self.model or "gemini-flash-latest"
        if stream:
            return f"{base}/v1beta/models/{model}:streamGenerateContent?key={self.api_key}"
        return f"{base}/v1beta/models/{model}:generateContent?key={self.api_key}"

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
        url = self._get_url("", stream=False)
        payload = self._build_payload(task, prompt, context)
        headers = {"Content-Type": "application/json"}
        
        response = await AIHttpClient.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        content = ""
        if data.get("candidates") and data["candidates"][0].get("content", {}).get("parts"):
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            
        return {
            "content": content,
            "raw": data
        }

    async def generate_stream(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None):
        url = self._get_url("", stream=True)
        payload = self._build_payload(task, prompt, context)
        headers = {"Content-Type": "application/json"}
        
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

    async def test_connection(self) -> Dict[str, Any]:
        start_time = time.time()
        url = self._get_url("").replace(":generateContent", "").replace(":streamGenerateContent", "")
        # Since _get_url returns a model-specific endpoint, let's just build the models endpoint directly
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        models_url = f"{base}/v1beta/models?key={self.api_key}"
        
        result = {
            "provider": "Gemini",
            "model": self.model,
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
        # Gemini model list endpoint
        base = self.base_url.rstrip("/") if self.base_url else "https://generativelanguage.googleapis.com"
        url = f"{base}/v1beta/models?key={self.api_key}"
        try:
            response = await AIHttpClient.get(url, headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                data = response.json()
                return [model["name"].replace("models/", "") for model in data.get("models", [])]
            return []
        except Exception:
            return []

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

import time
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from core.http_client import AIHttpClient
from .base import BaseAIProvider

class OpenAICompatibleProvider(BaseAIProvider):
    """
    Unified provider for any OpenAI-compatible API.
    Supports: OpenCode, LM Studio, Ollama, LocalAI, vLLM, OpenRouter, Atomesus, etc.
    """
    
    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _get_url(self, endpoint: str) -> str:
        base = self.base_url.strip().rstrip("/") if self.base_url else "https://api.openai.com/v1"
        
        if self.base_url:
            parsed = urlparse(base)
            if parsed.path == "" or parsed.path == "/":
                base += "/v1"
                
        return f"{base}{endpoint}"

    def _build_messages(self, task: str, prompt: str, context: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
        system_content = f"You are a helpful AI assistant performing the following task: {task}"
        if context:
            system_content += f"\nContext:\n{json.dumps(context, indent=2)}"
        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ]

    async def generate(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = self._get_url("/chat/completions")
        payload = {
            "model": self.model or "gpt-3.5-turbo",
            "messages": self._build_messages(task, prompt, context),
            "temperature": float(self.kwargs.get("temperature", 0.7)),
            "max_tokens": int(self.kwargs.get("max_tokens", 2048))
        }
        
        response = await AIHttpClient.post(url, headers=self._get_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
        
        return {
            "content": data["choices"][0]["message"]["content"],
            "raw": data
        }

    async def generate_stream(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None):
        url = self._get_url("/chat/completions")
        payload = {
            "model": self.model or "gpt-3.5-turbo",
            "messages": self._build_messages(task, prompt, context),
            "temperature": float(self.kwargs.get("temperature", 0.7)),
            "max_tokens": int(self.kwargs.get("max_tokens", 2048)),
            "stream": True
        }
        
        async for chunk in AIHttpClient.stream_post(url, headers=self._get_headers(), json=payload):
            if chunk.status_code == 200:
                async for line in chunk.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            data = json.loads(line[6:])
                            if data.get("choices") and data["choices"][0].get("delta", {}).get("content"):
                                yield data["choices"][0]["delta"]["content"]
                        except json.JSONDecodeError:
                            continue

    async def test_connection(self) -> Dict[str, Any]:
        start_time = time.time()
        url = self._get_url("/models")
        result = {
            "provider": getattr(self, "provider_name", "OpenAICompatible"),
            "model": self.model,
            "endpoint": url,
            "latency_ms": 0,
            "authentication": "Unknown",
            "error": None,
            "success": False
        }
        
        try:
            response = await AIHttpClient.get(url, headers=self._get_headers())
            result["latency_ms"] = round((time.time() - start_time) * 1000)
            if response.status_code == 200:
                result["authentication"] = "Valid"
                result["success"] = True
            elif response.status_code in (401, 403):
                result["authentication"] = "Invalid credentials"
                result["error"] = response.text
            else:
                result["error"] = f"HTTP {response.status_code}: {response.text}"
        except Exception as e:
            result["latency_ms"] = round((time.time() - start_time) * 1000)
            result["error"] = str(e)
            result["authentication"] = "Failed to connect"
            
        return result

    async def get_models(self) -> List[str]:
        url = self._get_url("/models")
        try:
            response = await AIHttpClient.get(url, headers=self._get_headers())
            if response.status_code == 200:
                data = response.json()
                return [model["id"] for model in data.get("data", [])]
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
            "json_mode"
        ]

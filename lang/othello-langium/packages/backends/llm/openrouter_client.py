import os
import json
import time
import requests
from dotenv import load_dotenv
from llm_logger import log_interaction

load_dotenv()

class OpenRouterClient:
    def __init__(self, 
                 model="openai/gpt-4o",
                 temperature=0, # La température par défaut est 0 pour des réponses déterministes
                 top_p=1,
                 max_tokens=500,
                 seed=None):

        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY missing in .env")

        self.url = "https://openrouter.ai/api/v1/chat/completions"

        self.params = {
            "model": model,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens
        }

        if seed is not None:
            self.params["seed"] = seed

    def chat(self, messages):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = self.params | {"messages": messages}

        start = time.time()
        response = requests.post(self.url, headers=headers, json=payload)
        latency = time.time() - start

        response.raise_for_status()
        data = response.json()

        raw_text = data["choices"][0]["message"]["content"]

        # essayer de parser en JSON (optionnel)
        try:
            final_json = json.loads(raw_text)
        except Exception:
            final_json = None

        log_path = log_interaction(
            prompt=payload,
            raw_response=raw_text,
            final_json=final_json,
            params=self.params,
            latency=latency
        )

        return raw_text, final_json, log_path

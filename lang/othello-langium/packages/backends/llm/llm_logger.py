import os
import json
from datetime import datetime

LOG_DIR = "data/eval/logs"

os.makedirs(LOG_DIR, exist_ok=True)

def log_interaction(prompt, raw_response, final_json, params, latency):
    """
    prompt : dict/messages envoyés au modèle
    raw_response : texte brut renvoyé par OpenRouter
    final_json : JSON parsé (ou None si erreur)
    params : dict contenant model, temperature, top_p, max_tokens, seed
    latency : float en secondes
    """
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

    log_data = {
        "timestamp": timestamp,
        "prompt": prompt,
        "raw_response": raw_response,
        "final_json": final_json,
        "latency_seconds": latency,
        "parameters": params
    }

    path = os.path.join(LOG_DIR, f"log_{timestamp}.json")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)

    return path

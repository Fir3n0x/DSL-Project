import os
import json
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
LOG_DIR = PROJECT_ROOT / "data" / "eval" / "logs"

# Créer le dossier de logs s'il n'existe pas
os.makedirs(LOG_DIR, exist_ok=True)

# Variable globale pour stocker la session de jeu actuelle
_current_game_session = None

class GameSession:
    """Représente une partie complète avec tous ses logs"""
    
    def __init__(self):
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")  # Ajout des microsecondes pour unicité
        self.start_time = datetime.now().isoformat()
        self.interactions = []
        self.game_metadata = {
            "game_mode": None,
            "winner": None,
            "final_scores": None,
            "total_moves": 0
        }
        self.file_path = LOG_DIR / f"game_{self.session_id}.json"
        
        # Créer le fichier immédiatement avec les données initiales
        self._save_initial()
        
    def _save_initial(self):
        """Crée le fichier de log initial"""
        log_data = {
            "session_id": self.session_id,
            "start_time": self.start_time,
            "end_time": None,
            "game_metadata": self.game_metadata,
            "total_interactions": 0,
            "interactions": []
        }
        
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        print(f"🎮 Nouvelle session créée : {self.file_path}")
        
    def add_interaction(self, prompt, raw_response, final_json, params, latency):
        """Ajoute une interaction (un coup du LLM) à la session"""
        interaction = {
            "move_number": len(self.interactions) + 1,
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "raw_response": raw_response,
            "final_json": final_json,
            "latency_seconds": round(latency, 3),
            "parameters": params
        }
        self.interactions.append(interaction)
        
        # Sauvegarder immédiatement après chaque coup
        self.save()
        
    def set_metadata(self, **kwargs):
        """Met à jour les métadonnées de la partie"""
        self.game_metadata.update(kwargs)
        
    def save(self):
        """Sauvegarde la session complète dans un fichier JSON"""
        log_data = {
            "session_id": self.session_id,
            "start_time": self.start_time,
            "end_time": datetime.now().isoformat(),
            "game_metadata": self.game_metadata,
            "total_interactions": len(self.interactions),
            "interactions": self.interactions
        }
        
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        return str(self.file_path)
    
    def finalize(self):
        """Finalise la session (appelé à la fin de la partie)"""
        self.game_metadata["total_moves"] = len(self.interactions)
        file_path = self.save()
        print(f"📊 Session de jeu terminée et sauvegardée : {file_path}")
        return file_path


def start_game_session(game_mode=None):
    """
    Démarre une nouvelle session de jeu
    
    Args:
        game_mode (str, optionnel): Mode de jeu ("human_vs_llm", "llm_vs_llm", etc.)
    
    Returns:
        GameSession: La nouvelle session créée
    """
    global _current_game_session
    
    # Si une session est déjà active, la terminer proprement
    if _current_game_session is not None:
        print("⚠️  Session précédente détectée, fermeture automatique...")
        end_game_session()
    
    # Créer la nouvelle session
    _current_game_session = GameSession()
    
    # Définir le mode de jeu si fourni
    if game_mode:
        _current_game_session.set_metadata(game_mode=game_mode)
        _current_game_session.save()
    
    print(f"🎮 Nouvelle session démarrée : {_current_game_session.session_id}")
    return _current_game_session


def end_game_session(winner=None, final_scores=None):
    """
    Termine la session de jeu actuelle et sauvegarde les logs
    
    Args:
        winner (str, optionnel): "black", "white", ou "draw"
        final_scores (dict, optionnel): {"black": 28, "white": 36}
    
    Returns:
        str: Chemin du fichier de log sauvegardé (ou None si pas de session)
    """
    global _current_game_session
    
    if _current_game_session is None:
        print("⚠️  Aucune session de jeu en cours")
        return None
    
    # Mettre à jour les métadonnées finales
    if winner:
        _current_game_session.set_metadata(winner=winner)
    if final_scores:
        _current_game_session.set_metadata(final_scores=final_scores)
    
    # Finaliser et sauvegarder
    log_path = _current_game_session.finalize()
    
    # Réinitialiser la session globale
    _current_game_session = None
    
    return log_path


def log_interaction(prompt, raw_response, final_json, params, latency):
    """
    Ajoute une interaction à la session de jeu en cours
    
    Args:
        prompt: dict/messages envoyés au modèle
        raw_response: texte brut renvoyé par OpenRouter
        final_json: JSON parsé (ou None si erreur)
        params: dict contenant model, temperature, top_p, max_tokens, seed
        latency: float en secondes
    
    Returns:
        str: Chemin du fichier de log
    """
    global _current_game_session
    
    # Si aucune session n'est active, en créer une automatiquement
    if _current_game_session is None:
        print("⚠️  Aucune session active, création automatique d'une nouvelle session")
        start_game_session()
    
    # Ajouter l'interaction (la sauvegarde est automatique)
    _current_game_session.add_interaction(prompt, raw_response, final_json, params, latency)
    
    return str(_current_game_session.file_path)


def get_current_session():
    """Retourne la session de jeu actuelle"""
    return _current_game_session


def set_game_mode(mode):
    """
    Définit le mode de jeu pour la session actuelle
    
    Args:
        mode (str): Mode de jeu ("human_vs_llm", "llm_vs_llm", "human_vs_human", etc.)
    """
    global _current_game_session
    if _current_game_session:
        _current_game_session.set_metadata(game_mode=mode)
        _current_game_session.save()
        print(f"🎯 Mode de jeu défini : {mode}")


def reset_game():
    """
    Réinitialise la session actuelle (équivalent à terminer et en créer une nouvelle)
    Utile lors d'un changement de mode de jeu ou reset du plateau
    
    Returns:
        GameSession: La nouvelle session créée
    """
    global _current_game_session
    
    # Sauvegarder le mode de jeu actuel si existant
    old_mode = None
    if _current_game_session:
        old_mode = _current_game_session.game_metadata.get("game_mode")
    
    # Terminer la session actuelle
    if _current_game_session is not None:
        print("🔄 Réinitialisation de la partie...")
        end_game_session()
    
    # Créer une nouvelle session avec le même mode
    new_session = start_game_session(game_mode=old_mode)
    
    return new_session
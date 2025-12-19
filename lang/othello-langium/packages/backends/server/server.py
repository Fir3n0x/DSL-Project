from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys
from ai import get_minimax_move, get_llm_move
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '../llm'))

try:
    from llm_logger import start_game_session, end_game_session, get_current_session, reset_game
    LOGGING_ENABLED = True
except ImportError:
    LOGGING_ENABLED = False

load_dotenv()

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.abspath(os.path.join(BASE_DIR, "../html"))

app = Flask(__name__,
            template_folder="../../../../../examples",
            static_folder=STATIC_DIR,
            static_url_path="/static")

CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/game/<int:variant>", methods=["GET"])
def game(variant):
    template_path = f"variant{variant}/variant{variant}.html"
    return render_template(template_path)

@app.route('/static/<path:filename>', methods=["GET"])
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/start_game", methods=["POST"])
def start_game():
    """
    Endpoint appelé au début d'une nouvelle partie.
    Démarre une nouvelle session de logging pour le mode LLM.
    """
    if not LOGGING_ENABLED:
        return jsonify({
            'status': 'disabled',
            'message': 'Logging non disponible'
        })
    
    try:
        data = request.json or {}
        game_mode = data.get('game_mode', 'human_vs_llm')
        
        # Réinitialiser la session (termine l'ancienne si elle existe et en crée une nouvelle)
        new_session = reset_game()
        
        print(f"Nouvelle session démarrée : {new_session.session_id} (mode: {game_mode})")
        
        return jsonify({
            'status': 'success',
            'session_id': new_session.session_id,
            'message': f'Nouvelle partie démarrée (mode: {game_mode})'
        })
    except Exception as e:
        print(f"Erreur start_game: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route("/end_game", methods=["POST"])
def end_game():
    """
    Endpoint appelé à la fin d'une partie.
    Finalise la session de logging avec les scores finaux.
    """
    if not LOGGING_ENABLED:
        return jsonify({
            'status': 'disabled',
            'message': 'Logging non disponible'
        })
    
    try:
        data = request.json or {}
        winner = data.get('winner')  # 'black', 'white', ou 'draw'
        final_scores = data.get('final_scores')  # {'black': 28, 'white': 36}
        
        log_path = end_game_session(winner=winner, final_scores=final_scores)
        
        if log_path:
            print(f"Partie terminée et sauvegardée : {log_path}")
            return jsonify({
                'status': 'success',
                'log_path': log_path,
                'message': 'Partie terminée et sauvegardée'
            })
        else:
            return jsonify({
                'status': 'warning',
                'message': 'Aucune session active à terminer'
            })
            
    except Exception as e:
        print(f"Erreur end_game: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route("/move", methods=["POST"])
def move():
    """
    Endpoint pour demander un coup à l'IA (Minimax ou LLM).
    Pour le mode LLM, vérifie qu'une session est active.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Récupération des données envoyées par le frontend
        board = data.get("board")
        player = data.get("player")
        ai_type = data.get("aiType", "minimax")
        config = data.get("config", {})

        print(f"Demande de coup : {player} | Mode : {ai_type} | Config : {config}")

        # Si c'est un coup du LLM et qu'aucune session n'est active, en créer une
        if ai_type == "llm" and LOGGING_ENABLED:
            if get_current_session() is None:
                print("Aucune session active, création automatique d'une nouvelle session")
                start_game_session(game_mode="human_vs_llm")

        best_move = None

        # --- Choix de l'intelligence ---
        if ai_type == "llm":
            # On essaie d'obtenir un coup via le LLM
            best_move = get_llm_move(board, player, config)
            
            # Si le LLM échoue (erreur API ou réponse invalide), on se replie sur Minimax
            if best_move is None:
                print("Le LLM n'a pas renvoyé de coup valide. Repli sur Minimax.")
                best_move = get_minimax_move(board, player)
        else:
            best_move = get_minimax_move(board, player)
        
        return jsonify({"move": best_move})

    except Exception as e:
        print(f"ERREUR SERVEUR : {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Démarrage du serveur Flask...")
    if LOGGING_ENABLED:
        print("Logging LLM activé")
    else:
        print("Logging LLM désactivé")
    app.run(debug=True)
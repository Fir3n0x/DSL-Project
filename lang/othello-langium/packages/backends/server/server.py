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
            'message': 'Logging not available'
        })
    
    try:
        data = request.json or {}
        game_mode = data.get('game_mode', 'human_vs_llm')
        
        # Réinitialiser la session (termine l'ancienne si elle existe et en crée une nouvelle)
        new_session = reset_game()
        
        print(f"New session started: {new_session.session_id} (mode: {game_mode})") 

        return jsonify({
            'status': 'success',
            'session_id': new_session.session_id,
            'message': f'New game started (mode: {game_mode})'
        })
    except Exception as e:
        print(f"Error start_game: {e}")
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
            'message': 'Logging not available'
        })
    
    try:
        data = request.json or {}
        winner = data.get('winner')  # 'black', 'white', ou 'draw'
        final_scores = data.get('final_scores')  # {'black': 28, 'white': 36}
        
        log_path = end_game_session(winner=winner, final_scores=final_scores)
        
        if log_path:
            print(f"Game finished and saved: {log_path}")
            return jsonify({
                'status': 'success',
                'log_path': log_path,
                'message': 'Game finished and saved'
            })
        else:
            return jsonify({
                'status': 'warning',
                'message': 'No active session to end'
            })

    except Exception as e:
        print(f"Error end_game: {e}")
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
        depth = data.get("depth", 3)
        config = data.get("config", {})

        print(f"Move request: {player} | Mode: {ai_type} | Depth: {depth} | Config: {config}")

        # Si c'est un coup du LLM et qu'aucune session n'est active, en créer une
        if ai_type == "llm" and LOGGING_ENABLED:
            if get_current_session() is None:
                print("No active session, automatically creating a new session")
                start_game_session(game_mode="human_vs_llm")

        best_move = None

        # --- Choix de l'intelligence ---
        if ai_type == "llm":
            # On essaie d'obtenir un coup via le LLM
            best_move = get_llm_move(board, player, config)
            
            # Si le LLM échoue (erreur API ou réponse invalide), on se replie sur Minimax
            if best_move is None:
                print("LLM did not return a valid move. Fallback to Minimax.")
                best_move = get_minimax_move(board, player, depth)
        else:
            best_move = get_minimax_move(board, player, depth)
        
        # Vérifier si le joueur peut jouer
        can_play = best_move is not None
        
        return jsonify({
            "move": best_move,
            "canPlay": can_play,
            "message": "No valid moves" if not can_play else None
        })

    except Exception as e:
        print(f"SERVER ERROR: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting Flask server...")
    if LOGGING_ENABLED:
        print("LLM Logging enabled")
    else:
        print("LLM Logging disabled")
    app.run(debug=True)
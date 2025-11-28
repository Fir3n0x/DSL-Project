from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
from ai import get_minimax_move, get_llm_move
from dotenv import load_dotenv

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

@app.route("/move", methods=["POST"])
def move():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Récupération des données envoyées par le frontend
        board = data.get("board")
        player = data.get("player")
        ai_type = data.get("aiType", "minimax") # Par défaut : Minimax
        config = data.get("config", {})         # Infos de la variante (taille, règles...)

        print(f"Demande de coup : {player} | Mode : {ai_type} | Config : {config}")

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
    app.run(debug=True)
# server.py
from flask import Flask, request, jsonify, render_template, redirect, url_for
from ai import get_best_move

# point template_folder to the parent examples directory so subfolders for variants are accessible
app = Flask(__name__, template_folder="../../../../../examples")

@app.route("/", methods=["GET"])
def home():
    # render a simple index page with links to each variant
    return render_template("index.html")

@app.route("/game/<int:variant>", methods=["GET"])
def game(variant):
    # render the variant page located in examples/variantX/variantX.html
    template_path = f"variant{variant}/variant{variant}.html"
    return render_template(template_path)

@app.route("/move", methods=["POST"])
def move():
    data = request.json
    board = data.get("board")
    player = data.get("player")
    depth = data.get("depth", 3)  # Profondeur par défaut à 3 si non fournie
    
    best_move = get_best_move(board, player, depth)
    return jsonify({"move": best_move})

if __name__ == "__main__":
    app.run(debug=True)
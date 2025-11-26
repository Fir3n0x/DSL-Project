# server.py
from flask import Flask, request, jsonify, render_template, redirect, url_for, send_from_directory
import os
from ai import get_best_move

# point template_folder to the parent examples directory so subfolders for variants are accessible
BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.abspath(os.path.join(BASE_DIR, "../html"))

app = Flask(__name__,
            template_folder="../../../../../examples",
            static_folder=STATIC_DIR,
            static_url_path="/static")

@app.route("/", methods=["GET"])
def home():
    # render a simple index page with links to each variant
    return render_template("index.html")

@app.route("/game/<int:variant>", methods=["GET"])
def game(variant):
    # render the variant page located in examples/variantX/variantX.html
    template_path = f"variant{variant}/variant{variant}.html"
    return render_template(template_path)

@app.route('/static/<path:filename>', methods=["GET"])
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/move", methods=["POST"])
def move():
    data = request.json
    board = data.get("board")
    player = data.get("player")
    
    best_move = get_best_move(board, player)
    return jsonify({"move": best_move})

if __name__ == "__main__":
    app.run(debug=True)
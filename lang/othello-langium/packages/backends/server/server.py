# server.py
from flask import Flask, request, jsonify, render_template
from ai import get_best_move

app = Flask(__name__, template_folder="../../../../../examples/variant1")

@app.route("/", methods=["GET"])
def home():
    return render_template("variant1.html")

@app.route("/move", methods=["POST"])
def move():
    data = request.json
    board = data.get("board")
    player = data.get("player")
    
    best_move = get_best_move(board, player)
    return jsonify({"move": best_move})

if __name__ == "__main__":
    app.run(debug=True)
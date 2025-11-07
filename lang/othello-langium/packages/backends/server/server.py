# server.py
from flask import Flask, request, jsonify
from ai import get_best_move

app = Flask(__name__)

@app.route("/move", methods=["POST"])
def move():
    data = request.json
    board = data.get("board")
    player = data.get("player")
    
    best_move = get_best_move(board, player)
    return jsonify({"move": best_move})

if __name__ == "__main__":
    app.run(debug=True)
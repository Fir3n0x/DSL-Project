# ai.py
import copy

DIRECTIONS = [(-1, -1), (-1, 0), (-1, 1),
              (0, -1),          (0, 1),
              (1, -1),  (1, 0), (1, 1)]

def get_valid_moves(board, player):
    opponent = "white" if player == "black" else "black"
    valid_moves = []

    for r in range(8):
        for c in range(8):
            if board[r][c] is not None:
                continue
            flips = []
            for dr, dc in DIRECTIONS:
                rr, cc = r + dr, c + dc
                line = []
                while 0 <= rr < 8 and 0 <= cc < 8 and board[rr][cc] == opponent:
                    line.append((rr, cc))
                    rr += dr
                    cc += dc
                if line and 0 <= rr < 8 and 0 <= cc < 8 and board[rr][cc] == player:
                    flips.extend(line)
            if flips:
                valid_moves.append((r, c))
    return valid_moves

def apply_move(board, move, player):
    opponent = "white" if player == "black" else "black"
    new_board = copy.deepcopy(board)
    r, c = move
    new_board[r][c] = player

    for dr, dc in DIRECTIONS:
        rr, cc = r + dr, c + dc
        line = []
        while 0 <= rr < 8 and 0 <= cc < 8 and new_board[rr][cc] == opponent:
            line.append((rr, cc))
            rr += dr
            cc += dc
        if line and 0 <= rr < 8 and 0 <= cc < 8 and new_board[rr][cc] == player:
            for flip_r, flip_c in line:
                new_board[flip_r][flip_c] = player
    return new_board

def evaluate(board, player):
    # Simple heuristic: difference in piece count
    player_count = sum(row.count(player) for row in board)
    opponent = "white" if player == "black" else "black"
    opponent_count = sum(row.count(opponent) for row in board)
    return player_count - opponent_count

def minimax(board, depth, player, maximizing):
    valid_moves = get_valid_moves(board, player)
    if depth == 0 or not valid_moves:
        return evaluate(board, player), None

    best_move = None
    if maximizing:
        max_eval = float("-inf")
        for move in valid_moves:
            new_board = apply_move(board, move, player)
            eval_score, _ = minimax(new_board, depth - 1, "white" if player == "black" else "black", False)
            if eval_score > max_eval:
                max_eval = eval_score
                best_move = move
        return max_eval, best_move
    else:
        min_eval = float("inf")
        for move in valid_moves:
            new_board = apply_move(board, move, player)
            eval_score, _ = minimax(new_board, depth - 1, "white" if player == "black" else "black", True)
            if eval_score < min_eval:
                min_eval = eval_score
                best_move = move
        return min_eval, best_move

def get_best_move(board, player):
    _, move = minimax(board, depth=3, player=player, maximizing=True)
    return move if move else None


# def get_best_move(board, player):
#     # Ici tu implémentes ton algorithme Minimax pour Othello
#     # Pour l'instant, on renvoie un coup fictif
#     return [2, 3]  # Exemple : ligne 2, colonne 3
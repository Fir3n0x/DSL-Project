import copy
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../llm'))
try:
    from openrouter_client import OpenRouterClient
except ImportError:
    print("Warning: 'openrouter_client.py' not found. LLM mode will not work.")
    OpenRouterClient = None

# =================
# MINIMAX (VS IA)
# =================

DIRECTIONS = [(-1, -1), (-1, 0), (-1, 1),
              (0, -1),          (0, 1),
              (1, -1),  (1, 0), (1, 1)]

def get_valid_moves(board, player):
    opponent = "white" if player == "black" else "black"
    valid_moves = []
    
    rows = len(board)
    cols = len(board[0]) if rows > 0 else 0

    for r in range(rows):
        for c in range(cols):
            if board[r][c] is not None:
                continue
            flips = []
            for dr, dc in DIRECTIONS:
                rr, cc = r + dr, c + dc
                line = []
                while 0 <= rr < rows and 0 <= cc < cols and board[rr][cc] == opponent:
                    line.append((rr, cc))
                    rr += dr
                    cc += dc
                if line and 0 <= rr < rows and 0 <= cc < cols and board[rr][cc] == player:
                    flips.extend(line)
            if flips:
                valid_moves.append((r, c))
    return valid_moves

def apply_move(board, move, player):
    opponent = "white" if player == "black" else "black"
    new_board = copy.deepcopy(board)
    r, c = move
    new_board[r][c] = player
    
    rows = len(board)
    cols = len(board[0])

    for dr, dc in DIRECTIONS:
        rr, cc = r + dr, c + dc
        line = []
        while 0 <= rr < rows and 0 <= cc < cols and new_board[rr][cc] == opponent:
            line.append((rr, cc))
            rr += dr
            cc += dc
        if line and 0 <= rr < rows and 0 <= cc < cols and new_board[rr][cc] == player:
            for flip_r, flip_c in line:
                new_board[flip_r][flip_c] = player
    return new_board

def evaluate(board, player):
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

def get_minimax_move(board, player, depth=None):
    if depth is None:
        depth = 3
        if len(board) * len(board[0]) > 100:
            depth = 2
    
    # Limiter la profondeur maximale pour éviter les calculs trop longs
    depth = min(depth, 6)
        
    _, move = minimax(board, depth=depth, player=player, maximizing=True)
    return move

# =================
# LLM
# =================

# Convertit le plateau en texte pour le prompt LLM
def board_to_string(board):
    if not board: return ""
    rows = len(board)
    cols = len(board[0])
    
    header = "  " + " ".join([chr(ord('A') + i) for i in range(cols)])
    result = [header]
    
    for r in range(rows):
        row_str = f"{r+1} "
        for c in range(cols):
            cell = board[r][c]
            if cell == 'black': char = 'B'
            elif cell == 'white': char = 'W'
            else: char = '.'
            row_str += char + " "
        result.append(row_str)
    return "\n".join(result)

def parse_llm_move(move_str):
    # Convertit 'C3' en [2, 2]
    if not move_str or len(move_str) < 2: return None
    try:
        move_str = move_str.strip().replace('.', '')
        col_char = move_str[0].upper()
        row_char = move_str[1:]
        
        c = ord(col_char) - ord('A')
        r = int(row_char) - 1
        return [r, c]
    except:
        return None

def to_algebraic(r, c):
    return f"{chr(ord('A') + c)}{r + 1}"

# Interroge le LLM
def get_llm_move(board, player, config):
    if not OpenRouterClient:
        print("Error: OpenRouterClient not available.")
        return None

    # Calculer les coups valides pour guider le LLM
    valid_moves = get_valid_moves(board, player)
    if not valid_moves:
        return None
    
    valid_moves_str = ", ".join([to_algebraic(r, c) for r, c in valid_moves])

    client = OpenRouterClient(model="openai/gpt-4o", temperature=0.2)
    
    board_str = board_to_string(board)
    player_name = "NOIR (B)" if player == "black" else "BLANC (W)"
    
    system_prompt = f"""
    You are an expert Othello player. You are playing as {player_name}.
    
    RULES:
    - Board: {config.get('rows')} rows x {config.get('cols')} columns.
    - You must capture opponent pieces by flanking them.
    - IMPORTANT: You can only play on one of the following squares: [{valid_moves_str}].
    
    RESPONSE FORMAT (STRICT JSON):
    {{
        "reasoning": "Short explanation of your strategy...",
        "move": "C3"
    }}
    Choose the best move from the provided list.
    """
    
    user_prompt = f"""
    Current state:
    {board_str}
    
    Possible legal moves: {valid_moves_str}
    What is the best move?
    """

    print(f"--- [LLM] Thinking for {player} (Choices: {valid_moves_str}) ---")
    try:
        _, json_resp, _ = client.chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        if json_resp and 'move' in json_resp:
            move_str = json_resp['move']
            parsed_move = parse_llm_move(move_str)
            
            # Vérification stricte côté serveur
            if parsed_move:
                move_tuple = (parsed_move[0], parsed_move[1])
                if move_tuple in valid_moves:
                    print(f"--- [LLM] Move validated: {move_str} ({json_resp.get('reasoning')}) ---")
                    return parsed_move
                else:
                    print(f"--- [LLM] Illegal move rejected: {move_str}. Falling back to Minimax. ---")
            
    except Exception as e:
        print(f"--- [LLM] Error: {e} ---")
        
    return None
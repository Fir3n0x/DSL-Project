from openrouter_client import OpenRouterClient

SYSTEM_PROMPT = """
Tu es un grand maître du jeu Othello (aussi appelé Reversi).
Ton objectif est de jouer le meilleur coup possible pour gagner la partie.

RÈGLES ET FORMAT :
1. Le plateau est une grille 8x8. Les colonnes sont A-H, les lignes 1-8.
2. Les joueurs sont Noir (B) et Blanc (W).
3. Un coup est valide s'il prend en tenaille une ou plusieurs pièces adverses.
4. Tu dois répondre UNIQUEMENT au format JSON strict, sans texte autour.

Format de réponse attendu :
{
  "reasoning": "Explication courte de ta stratégie ici (ex: contrôle du centre, mobilité...)",
  "move": "C3" 
}
Si aucun coup n'est possible, "move" doit être null.
"""

BOARD_STATE = """
  A B C D E F G H
1 . . . . . . . .
2 . . . . . . . .
3 . . . . . . . .
4 . . . W B . . .
5 . . . B W . . .
6 . . . . . . . .
7 . . . . . . . .
8 . . . . . . . .
"""

USER_PROMPT = f"""
C'est au tour de : NOIR (B)

Voici l'état actuel du plateau :
{BOARD_STATE}

Quel est ton coup ?
"""

if __name__ == "__main__":
    client = OpenRouterClient(
        model="openai/gpt-4o",
        temperature=0,
        top_p=1,
        max_tokens=100,
        seed=1234
    )

    print(f"Envoi du prompt pour Othello...")

    raw, json_resp, log_file = client.chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT}
    ])

    print("\n--- Résultat ---")
    if json_resp:
        print(f"Raisonnement : {json_resp.get('reasoning')}")
        print(f"Coup joué    : {json_resp.get('move')}")
    else:
        print("Erreur : Pas de JSON valide reçu.")
        print("Brut :", raw)
    
    print(f"\nLog sauvegardé : {log_file}")

# Game Project Plan: Checkers (Phase 1 Deliverable)

## 1\. GAME CHOICE

**Game Chosen:** Checkers (Player vs. Player)

  * **AI Requirement:** No AI is required for the initial implementation (Player vs. Player is sufficient).

-----

## 2\. INITIAL DATA STRUCTURE (Game State)

The game state will be represented by a **2D array** (list of lists) where each element represents a square on the 8x8 checkerboard.

### DATA STRUCTURE: `Board[8][8]`

| Value | Meaning |
| :---: | :--- |
| `0` | Empty square |
| `1` | Player 1 regular piece (e.g., Red) |
| `2` | Player 2 regular piece (e.g., Black) |
| `3` | Player 1 King piece |
| `4` | Player 2 King piece |

**Example Initialization (Partial):**

A standard 8x8 board starts with pieces on rows 0, 1, 2 for one player and 5, 6, 7 for the other.

```python
# Pseudo-structure for Board[8][8]
Board = [
    [0, 2, 0, 2, 0, 2, 0, 2],  # Row 0 (Player 2)
    [2, 0, 2, 0, 2, 0, 2, 0],  # Row 1 (Player 2)
    [0, 2, 0, 2, 0, 2, 0, 2],  # Row 2 (Player 2)
    [0, 0, 0, 0, 0, 0, 0, 0],  # Row 3 (Empty)
    [0, 0, 0, 0, 0, 0, 0, 0],  # Row 4 (Empty)
    [1, 0, 1, 0, 1, 0, 1, 0],  # Row 5 (Player 1)
    [0, 1, 0, 1, 0, 1, 0, 1],  # Row 6 (Player 1)
    [1, 0, 1, 0, 1, 0, 1, 0]   # Row 7 (Player 1)
]
```

### Additional Variables

  * `CurrentPlayer`: (Integer, 1 or 2) Tracks whose turn it is.
  * `GameOver`: (Boolean) True when a player has no more pieces or cannot move.
  * `P1_Piece_Count`: (Integer) Number of pieces remaining for Player 1.
  * `P2_Piece_Count`: (Integer) Number of pieces remaining for Player 2.

-----

## 3\. PSEUDOCODE FOR OVERALL GAMEPLAY

This pseudocode outlines the main game loop and the flow of a single turn, highlighting the complex logic required (movement, jumps, and kinging).

```pseudocode
FUNCTION MainGameLoop()
    InitializeBoard()
    CurrentPlayer = 1
    GameOver = FALSE

    WHILE NOT GameOver DO
        DisplayBoard()
        DisplayMessage("Player " + CurrentPlayer + "'s Turn")

        // Challenge: Must check for mandatory jumps first
        mandatory_jumps = FindMandatoryJumps(CurrentPlayer)

        IF mandatory_jumps IS NOT Empty THEN
            DisplayMessage("You must take a jump!")
            Move_Is_Valid = FALSE
            WHILE NOT Move_Is_Valid DO
                GetPlayerInput(StartPos, EndPos)
                Move_Is_Valid = CheckValidJump(StartPos, EndPos, mandatory_jumps)
            END WHILE
            ExecuteMove(StartPos, EndPos)
            CheckForKing(EndPos)

            // Challenge: Must check for *further* jumps by the same piece
            WHILE CheckForDoubleJump(EndPos) DO
                DisplayMessage("Double jump available!")
                GetPlayerInput(EndPos, NextPos)
                IF IsValidJump(EndPos, NextPos) THEN
                    ExecuteMove(EndPos, NextPos)
                    EndPos = NextPos // Update position for next check
                ELSE
                    BREAK
                END IF
            END WHILE

        ELSE // No mandatory jumps, allow simple moves
            Move_Is_Valid = FALSE
            WHILE NOT Move_Is_Valid DO
                GetPlayerInput(StartPos, EndPos)
                Move_Is_Valid = CheckValidStandardMove(StartPos, EndPos)
            END WHILE
            ExecuteMove(StartPos, EndPos)
            CheckForKing(EndPos)
        END IF

        CheckForWin() // Update GameOver status
        CurrentPlayer = SwitchPlayer(CurrentPlayer)

    END WHILE
    DisplayWinner()
END FUNCTION

FUNCTION CheckForKing(Position)
    IF piece at Position is a regular piece AND it has reached the opponent's back row THEN
        Change piece at Position to a King piece (Value 3 or 4)
    END IF
END FUNCTION
```

-----

## 4\. PROJECT PLANNING REQUIREMENTS (Checkers Specific)

### **UNIQUE CHALLANGES AND REQUIREMENTS:**

  * **Mandatory Jump Rule:** The game must enforce the rule that if a jump is available, the player **must** take it. If multiple jumps are available, the player may choose any one of them.
  * **Sequential Jumps (Double Jumps):** After a jump is completed, the same piece must continue jumping if an immediate subsequent jump is available (in a single turn).
  * **King Promotion:** The logic must correctly identify when a piece reaches the opposite side of the board and promote it to a King. Kings can move and jump both forward and backward.

-----

## 5\. LEVEL UP - IF TIME ALLOWS!!! LOL

  * **Goal:** Implement a basic AI opponent.
  * **Approach:** The AI will use a simple heuristic, such as:
    1.  Always prioritize mandatory jumps.
    2.  If no jumps, choose a random valid standard move.
    3.  *If more time:* Implement simple look-ahead (1 or 2 moves) to maximize jumps or move pieces towards the kinging row.

-----

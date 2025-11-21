/*
 * CHECKERS GAME - Main Application Logic
 *
 * A complete implementation of American/English Checkers
 *
 * Features:
 * - 8x8 board with alternating squares
 * - Two players (red and black)
 * - Regular pieces and kings
 * - Simple moves and jump captures
 * - Mandatory jump rule
 * - Multi-jump sequences
 * - King promotion at opposite end
 * - Win condition detection (no pieces or no valid moves)
 * - 40-move draw rule (no captures)
 *
 *
 * Version: 1.0.0
 */

/* CONSTANTS & CONFIGURATION */

/*
 * Size of the checkerboard (8x8)
 * Constant: number
 */
const BOARD_SIZE = 8;

/*
 * Maximum consecutive moves without capture before draw
 * Constant: number
 */
const MAX_MOVES_WITHOUT_CAPTURE = 40;

/*
 * Board value for empty square
 * Constant: number
 */
const PIECE_EMPTY = 0;

/*
 * Board value for Player 1 regular piece
 * Constant: number
 */
const PIECE_PLAYER_1 = 1;

/*
 * Board value for Player 2 regular piece
 * Constant: number
 */
const PIECE_PLAYER_2 = 2;

/*
 * Board value for Player 1 king
 * Constant: number
 */
const PIECE_PLAYER_1_KING = 3;

/*
 * Board value for Player 2 king
 * Constant: number
 */
const PIECE_PLAYER_2_KING = 4;

/*
 * Player identifier for Player 1
 * Constant: number
 */
const PLAYER_ONE = 1;

/*
 * Player identifier for Player 2
 * Constant: number
 */
const PLAYER_TWO = 2;

/*
 * Jump move distance in rows/columns
 * Constant: number
 */
const JUMP_DISTANCE = 2;

/*
 * Simple move distance in rows/columns
 * Constant: number
 */
const SIMPLE_MOVE_DISTANCE = 1;

/* STATE VARIABLES */

/*
 * The game board represented as an 8x8 2D array
 *
 * Board values:
 * - 0: Empty square
 * - 1: Player 1 regular piece
 * - 2: Player 2 regular piece
 * - 3: Player 1 king
 * - 4: Player 2 king
 *
 * Row 0 is the top of the board (Player 1's target for king promotion)
 * Row 7 is the bottom of the board (Player 2's target for king promotion)
 *
 * Type: Array of numbers
 */
let board = [
  [0, 2, 0, 2, 0, 2, 0, 2], // Row 0
  [2, 0, 2, 0, 2, 0, 2, 0], // Row 1
  [0, 2, 0, 2, 0, 2, 0, 2], // Row 2
  [0, 0, 0, 0, 0, 0, 0, 0], // Row 3
  [0, 0, 0, 0, 0, 0, 0, 0], // Row 4
  [1, 0, 1, 0, 1, 0, 1, 0], // Row 5
  [0, 1, 0, 1, 0, 1, 0, 1], // Row 6
  [1, 0, 1, 0, 1, 0, 1, 0]  // Row 7
];

/*
 * The current active player
 * Type: number - 1 for Player 1, 2 for Player 2
 */
let currentPlayer = PLAYER_ONE;

/*
 * The currently selected piece coordinates
 * Null values indicate no piece is selected
 * Type: {row: number|null, col: number|null}
 */
let selectedPiece = {row: null, col: null};

/*
 * Flag indicating whether the game has ended
 * Type: boolean
 */
let gameOver = false;

/*
 * Array of pieces that have mandatory jumps available
 * Used to enforce the mandatory jump rule
 * Type: Array<{row: number, col: number, jumps: Array}>
 */
let mandatoryJumps = [];

/*
 * Flag indicating a multi-jump sequence is in progress
 * When true, the same piece must continue jumping
 * Type: boolean
 */
let isMultiJumping = false;

/*
 * Coordinates of the piece currently performing a multi-jump
 * Type: {row: number|null, col: number|null}
 */
let multiJumpPiece = {row: null, col: null};

/*
 * Counter for moves made without any captures
 * Used to implement the 40-move draw rule
 * Resets to 0 when a capture occurs
 * Type: number
 */
let movesSinceCapture = 0;

/*
 * which player is controlled by AI (1 or 2)
 */
let aiPlayer = PLAYER_TWO;

/*
 * Flag to enable/disable "AI" opponent.
 */
let isAIEnabled = true;

/*
 * delay in milliseconds before the AI makes its move.
 * makes the AI feel more natual, gives player time to see the board.
 */
let aiMoveDelay = 1000;

/*
 * Array of valid moves for the currently selected piece
 * Format: [[toRow, toCol], ...] for simple moves
 *         [[toRow, toCol, captureRow, captureCol], ...] for jumps
 * Type: Array<Array<number>>
 */
let validMoves = [];

/* CACHED DOM ELEMENTS */

const gameBoard = document.getElementById('game-board');
const turnIndicator = document.getElementById('player-turn');
const errorMessage = document.getElementById('error-message');
const gameOverMessageDiv = document.getElementById('game-over-message');
const gameResultText = document.getElementById('game-result-text');
const resetButton = document.getElementById('reset-button');
const instructionsButton = document.getElementById('instructions-button');
const instructionsSection = document.getElementById('instructions-section');
const aiToggleButton = document.getElementById('ai-toggle-button');

/* UTILITY FUNCTIONS
   General-purpose helper functions used throughout the application */

/*
 * Gets a cell element at specific board coordinates
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: HTMLElement|null - The cell element or null
 */
const getCellElement = (row, col) => {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
};

/*
 * Gets a piece element at specific board coordinates
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: HTMLElement|null - The piece element or null
 */
const getPieceElement = (row, col) => {
  return document.querySelector(`.piece[data-row="${row}"][data-col="${col}"]`);
};

/*
 * Displays error message with auto-disappearing timeout
 *
 * Parameters:
 *   message - string - The error message to display
 *   duration - number - Duration in milliseconds before message disappears (default: 3000)
 *
 * Returns: void
 */
const showErrorMessage = (message, duration = 3000) => {
  errorMessage.innerText = message;
  setTimeout(() => {
    errorMessage.innerText = '';
  }, duration);
};

/* BOARD VALIDATION
   Functions for validating board positions and piece placement */

/*
 * Checks if coordinates are within valid board bounds (0-7)
 *
 * Parameters:
 *   row - number - The row coordinate to check
 *   col - number - The column coordinate to check
 *
 * Returns: boolean - True if coordinates are valid, false otherwise
 */
const isRowAndColValid = (row, col) => {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
};

/*
 * Checks if a square is empty
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: boolean - True if square is empty, false otherwise
 */
const isSquareEmpty = (row, col) => {
  return board[row][col] === PIECE_EMPTY;
};

/*
 * Checks if click target is a valid cell element
 *
 * Parameters:
 *   element - HTMLElement - The element to check
 *
 * Returns: boolean - True if element is a valid cell, false otherwise
 */
const isValidCell = (element) => {
  return element && element.classList.contains('cell');
};

/* PIECE LOGIC
   Functions for piece identification and properties */

/*
 * Gets the owner of a piece at given coordinates
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: number|null - Player number (1 or 2) or null if empty
 */
const getPieceOwner = (row, col) => {
  const pieceValue = board[row][col];

  if (pieceValue === PIECE_PLAYER_1 || pieceValue === PIECE_PLAYER_1_KING) {
    return PLAYER_ONE;
  } else if (pieceValue === PIECE_PLAYER_2 || pieceValue === PIECE_PLAYER_2_KING) {
    return PLAYER_TWO;
  }

  return null; // Empty square
};

/*
 * Checks if a piece is a king
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: boolean - True if piece is a king, false otherwise
 */
const isKing = (row, col) => {
  const pieceValue = board[row][col];
  return pieceValue === PIECE_PLAYER_1_KING || pieceValue === PIECE_PLAYER_2_KING;
};

/*
 * Checks if a piece at coordinates belongs to the opponent
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *   player - number - Current player number
 *
 * Returns: boolean - True if piece belongs to opponent, false otherwise
 */
const isOpponent = (row, col, player) => {
  const pieceOwner = getPieceOwner(row, col);

  // If there is no piece (null) or it's current player's piece, return false
  if (pieceOwner === null || pieceOwner === player) {
    return false;
  }

  return true; // It's the opponent's piece
};

/*
 * Checks if a piece is clickable by the current player
 *
 * Parameters:
 *   pieceElement - HTMLElement - The piece DOM element to check
 *
 * Returns: boolean - True if piece belongs to current player, false otherwise
 */
const isPieceClickable = (pieceElement) => {
  return pieceElement.classList.contains(`player-${currentPlayer}`);
};

/*
 * Gets valid movement directions for a piece based on its type
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: Array<Array<number>> - Array of [rowDelta, colDelta] directions
 */
const getDirectionsForPiece = (row, col) => {
  const pieceOwner = getPieceOwner(row, col);
  const pieceIsKing = isKing(row, col);

  // Kings can move in all 4 diagonal directions
  if (pieceIsKing) {
    return [
      [-1, -1], // up-left
      [-1, +1], // up-right
      [+1, -1], // down-left
      [+1, +1] // down-right
    ];
  }

  // Player 1 regular pieces move UP (toward row 0)
  if (pieceOwner === PLAYER_ONE) {
    return [
      [-1, -1], // up-left
      [-1, +1] // up-right
    ];
  }

  // Player 2 regular pieces move DOWN (toward row 7)
  if (pieceOwner === PLAYER_TWO) {
    return [
      [+1, -1], // down-left
      [+1, +1] // down-right
    ];
  }

  return [];
};

/*
 * Checks for king promotion and promotes piece if applicable
 *
 * A piece is promoted when:
 * - Player 1 piece reaches row 0 (top)
 * - Player 2 piece reaches row 7 (bottom)
 *
 * Parameters:
 *   row - number - Board row (0-7)
 *   col - number - Board column (0-7)
 *
 * Returns: boolean - True if piece was promoted, false otherwise
 */
const checkForKingPromotion = (row, col) => {
  const pieceValue = board[row][col];

  // Player 1 reaches top row (row 0)
  if (pieceValue === PIECE_PLAYER_1 && row === 0) {
    board[row][col] = PIECE_PLAYER_1_KING;
    return true;
  }

  // Player 2 reaches bottom row (row 7)
  if (pieceValue === PIECE_PLAYER_2 && row === 7) {
    board[row][col] = PIECE_PLAYER_2_KING;
    return true;
  }

  return false;
};

/*
 * Counts the number of pieces a player has on the board
 * Includes both regular pieces and kings
 *
 * Parameters:
 *   player - number - Player number (1 or 2)
 *
 * Returns: number - Total count of player's pieces
 */
const countPieces = (player) => {
  let count = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pieceOwner = getPieceOwner(row, col);

      if (pieceOwner === player) {
        count++;
      }
    }
  }

  return count;
};

/* MOVEMENT VALIDATION
   Functions for calculating valid moves and jumps */

/*
 * Gets a valid diagonal square for simple movement
 * Checks one diagonal direction from a given position
 *
 * Parameters:
 *   row - number - Starting row
 *   col - number - Starting column
 *   rowDelta - number - Row direction (-1 or +1)
 *   colDelta - number - Column direction (-1 or +1)
 *
 * Returns: Array of number | null - [newRow, newCol] if valid, null otherwise
 */
const getValidDiagonalSquare = (row, col, rowDelta, colDelta) => {
  const newRow = row + rowDelta;
  const newCol = col + colDelta;

  if (isRowAndColValid(newRow, newCol) && isSquareEmpty(newRow, newCol)) {
    return [newRow, newCol];
  }

  return null;
};

/*
 * Calculates all valid jump moves for a piece
 *
 * A jump is valid when:
 * 1. Adjacent diagonal square has an opponent piece
 * 2. Square beyond opponent is empty and in bounds
 *
 * Parameters:
 *   row - number - Current row of the piece
 *   col - number - Current column of the piece
 *
 * Returns: Array<Array<number>> - Array of jump moves in format:
 *   [[toRow, toCol, captureRow, captureCol], ...]
 *   Returns empty array if no jumps available
 */
const getValidJumps = (row, col) => {
  const validJumps = [];

  if (!isRowAndColValid(row, col)) {
    return [];
  }

  const pieceOwner = getPieceOwner(row, col);

  // If no piece at this location, return empty
  if (pieceOwner === null) {
    return [];
  }

  // Get valid directions for this piece
  const directions = getDirectionsForPiece(row, col);

  // Check each direction for valid jumps
  directions.forEach(([rowDelta, colDelta]) => {
    // Position of adjacent square (potential opponent)
    const adjRow = row + rowDelta;
    const adjCol = col + colDelta;

    // Position of landing square (2 squares away)
    const landRow = row + (rowDelta * JUMP_DISTANCE);
    const landCol = col + (colDelta * JUMP_DISTANCE);

    // Valid jump requires: opponent adjacent, empty landing square
    if (
      isRowAndColValid(adjRow, adjCol) &&
      isOpponent(adjRow, adjCol, pieceOwner) &&
      isRowAndColValid(landRow, landCol) &&
      isSquareEmpty(landRow, landCol)
    ) {
      // Store jump as [destinationRow, destinationCol, capturedRow, capturedCol]
      validJumps.push([landRow, landCol, adjRow, adjCol]);
    }
  });

  return validJumps;
};

/*
 * Gets all valid moves (simple or jumps) for a piece
 *
 * If jumps are available, ONLY returns jumps (mandatory jump rule)
 * Otherwise returns simple diagonal moves
 *
 * Parameters:
 *   row - number - Current row of the piece
 *   col - number - Current column of the piece
 *
 * Returns: Array<Array<number>> - Array of valid moves
 *   Format: [[toRow, toCol], ...] for simple moves
 *           [[toRow, toCol, captureRow, captureCol], ...] for jumps
 */
const getValidMoves = (row, col) => {
  const validMoves = [];

  if (!isRowAndColValid(row, col)) {
    return [];
  }

  // PRIORITY 1: Check for jumps (mandatory)
  const jumps = getValidJumps(row, col);

  if (jumps.length > 0) {
    // Return only jumps - mandatory jump rule
    return jumps;
  }

  // PRIORITY 2: Simple moves (only if no jumps available)
  const directions = getDirectionsForPiece(row, col);

  // Check each direction for valid simple moves
  directions.forEach((direction) => {
    const result = getValidDiagonalSquare(row, col, direction[0], direction[1]);

    if (result !== null) {
      validMoves.push(result);
    }
  });

  return validMoves;
};

/*
 * Finds all pieces that have jumps available for a given player
 * Used to enforce the mandatory jump rule
 *
 * Parameters:
 *   player - number - Player number (1 or 2)
 *
 * Returns: Array<{row: number, col: number, jumps: Array}> - Array of pieces with available jumps
 */
const findAllJumpsForPlayer = (player) => {
  const piecesWithJumps = [];

  // Iterate through entire board
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pieceOwner = getPieceOwner(row, col);

      // Check if current square has a piece belonging to current player
      if (pieceOwner === player) {
        // Get all valid jumps for this piece
        const jumps = getValidJumps(row, col);

        // If this piece has any jumps available, store it
        if (jumps.length > 0) {
          piecesWithJumps.push({
            row: row,
            col: col,
            jumps: jumps
          });
        }
      }
    }
  }

  return piecesWithJumps;
};

/*
 * Gets all possible moves for all pieces belonging to a player
 * Respects mandatory jump rule - if any piece can jump, only returns jumps
 *
 * Parameters:
 *   player - number - Player number (1 or 2)
 *
 * Returns: Array<{fromRow: number, fromCol: number, toRow: number, toCol: number, isJump: boolean}>
 *   Array of move objects with source and destination coordinates
 */
const getAllMovesForPlayer = (player) => {
  const allMoves = [];

  // First, check if this player has any mandatory jumps
  const piecesWithJumps = findAllJumpsForPlayer(player);

  // If there are mandatory jumps, ONLY return those jump moves
  if (piecesWithJumps.length > 0) {
    for (let pieceWithJump of piecesWithJumps) {
      for (let jump of pieceWithJump.jumps) {
        const moveObject = {
          fromRow: pieceWithJump.row,
          fromCol: pieceWithJump.col,
          toRow: jump[0],
          toCol: jump[1],
          isJump: true
        };
        allMoves.push(moveObject);
      }
    }
    return allMoves;
  }

  // No mandatory jumps - get all simple moves
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Check piece value directly
      const pieceValue = board[row][col];

      // Check if this piece belongs to the requested player
      let isPlayerPiece = false;
      if (player === PLAYER_ONE) {
        isPlayerPiece = (pieceValue === PIECE_PLAYER_1 || pieceValue === PIECE_PLAYER_1_KING);
      } else if (player === PLAYER_TWO) {
        isPlayerPiece = (pieceValue === PIECE_PLAYER_2 || pieceValue === PIECE_PLAYER_2_KING);
      }

      if (isPlayerPiece) {
        // Get all valid moves for this piece (already handles mandatory jumps internally)
        const moves = getValidMoves(row, col);

        // Convert each move to our standardized format
        for (let move of moves) {
          const moveObject = {
            fromRow: row,
            fromCol: col,
            toRow: move[0],
            toCol: move[1],
            isJump: move.length === 4 // Jump moves have 4 elements
          };
          allMoves.push(moveObject);
        }
      }
    }
  }

  return allMoves;
};

/*
 * Checks if the current player has any valid moves available
 * Used for stalemate detection
 *
 * Parameters:
 *   player - number - Player number (1 or 2)
 *
 * Returns: boolean - True if player has at least one valid move, false otherwise
 */
const hasValidMoves = (player) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pieceOwner = getPieceOwner(row, col);

      if (pieceOwner === player) {
        const moves = getValidMoves(row, col);

        if (moves.length > 0) {
          return true;
        }
      }
    }
  }

  return false;
};

/*
 * Checks for consecutive jump opportunities after a jump
 * Used for multi-jump sequences
 *
 * Parameters:
 *   row - number - Current row of the piece
 *   col - number - Current column of the piece
 *
 * Returns: Array<Array<number>> - Array of consecutive jump moves, empty if none available
 */
const checkForConsecutiveJump = (row, col) => {
  return getValidJumps(row, col);
};

/*
 * Checks if a destination square is in the list of valid moves
 *
 * Parameters:
 *   row - number - Destination row
 *   col - number - Destination column
 *
 * Returns: boolean - True if destination is valid, false otherwise
 */
const isValidDestination = (row, col) => {
  for (let move of validMoves) {
    if (move[0] === row && move[1] === col) {
      return true;
    }
  }

  return false;
};

/* AI LOGIC
   Functions for computer opponent decision-making */

/*
 * Selects a random move from an array of possible moves.
 * Simple "AI" strategy - no evaluation, just random selection
 *
 * Parameters:
 *   moves - Array<Object> - Array of move objects from getAllMovesForPlayer()
 *
 * Returns: Object|null - Random move object, or null if no moves are available
 */
const selectRandomMove = (moves) => {
    if (moves.length === 0){
      return null;
    }

    // generate random index between 0 and moves.length - 1
    const randomIndex = Math.floor(Math.random() * moves.length);

    // return the randomly selected move
    return moves[randomIndex];
  }

/*
 * Main AI decision function
 * Gets all possible moves, selects one randomly and executes it.
 *
 * Returns: void
 */
const makeAIMove = () => {
    // safety check, dont move if game is over
    if(gameOver) {
      return;
    }

    // safety check, dont move if its not AIs turn
    if(currentPlayer !== aiPlayer) {
      return;
    }

    //Get all possible moves for the AI player
    const allMoves = getAllMovesForPlayer(aiPlayer);

    // If no moves available, game should be over
    // just to sleep well at night
    if(allMoves.length === 0) {
      return;
    }

    //Select a random move from the available options
    const selectedMove = selectRandomMove(allMoves);

    // another sanity check.
    if(!selectedMove) {
      return;
    }

    // Execute the selected move using executeMove function
    executeMove(
      selectedMove.fromRow,
      selectedMove.fromCol,
      selectedMove.toRow,
      selectedMove.toCol
    );
  }

/* RENDERING
   Functions for updating the DOM and visual display */

/*
 * Renders the 8x8 checkerboard grid
 *
 * Clears any existing board cells and creates 64 new cell divs
 * with appropriate dark/light styling based on position
 *
 * Parameters:
 *   gameBoardElement - HTMLElement - The container element for the board
 *
 * Returns: void
 */
const renderBoard = (gameBoardElement) => {
  // Clear existing board cells before rendering
  gameBoardElement.innerHTML = '';

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Create a new cell element and set its row, col, and class values
      const cell = document.createElement('div');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.className = 'cell';

      // Alternate cell color based on row + column parity
      if ((row + col) % 2 === 0) {
        cell.classList.add('light');
      } else {
        cell.classList.add('dark');
      }

      // Append the new cell to the gameBoard element
      gameBoardElement.appendChild(cell);
    }
  }
};

/*
 * Clears all piece elements from the board
 * Helper function for re-rendering pieces
 *
 * Returns: void
 */
const clearBoard = () => {
  const squarePieces = document.querySelectorAll('.piece');
  squarePieces.forEach((piece) => {
    piece.remove();
  });
};

/*
 * Renders all pieces on the board based on current board state
 *
 * Clears existing pieces and creates new piece elements for each
 * non-empty square. Applies appropriate styling for player and king status.
 *
 * Returns: void
 */
const renderPieces = () => {
  // Clear existing pieces
  clearBoard();

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pieceValue = board[row][col];

      if (pieceValue !== PIECE_EMPTY) {
        // Create a new piece element
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';

        // Determine player class (1 or 2)
        if (pieceValue === PIECE_PLAYER_1 || pieceValue === PIECE_PLAYER_1_KING) {
          pieceElement.classList.add('player-1');
        } else if (pieceValue === PIECE_PLAYER_2 || pieceValue === PIECE_PLAYER_2_KING) {
          pieceElement.classList.add('player-2');
        }

        // Add 'king' class for king pieces
        if (pieceValue === PIECE_PLAYER_1_KING || pieceValue === PIECE_PLAYER_2_KING) {
          pieceElement.classList.add('king');
        }

        // Set data attributes for game logic
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;
        pieceElement.dataset.player = (pieceValue === PIECE_PLAYER_1 || pieceValue === PIECE_PLAYER_1_KING) ? '1' : '2';

        // Get the cell and append the piece
        const squareDiv = getCellElement(row, col);
        squareDiv.appendChild(pieceElement);
      }
    }
  }
};

/*
 * Updates the turn indicator display
 * Shows current player, mandatory jump warning, or multi-jump status
 *
 * Returns: void
 */
const renderTurnIndicator = () => {
  // Show multi-jumping status
  if (isMultiJumping) {
    turnIndicator.innerText = `Player ${currentPlayer} - MULTI-JUMP IN PROGRESS!`;
    turnIndicator.style.color = '#ff6b6b';
    turnIndicator.style.fontWeight = 'bold';
    turnIndicator.style.fontSize = '1.2em';
  }
  // Show mandatory jump warning
  else if (mandatoryJumps.length > 0) {
    turnIndicator.innerText = `Player ${currentPlayer} turn - MUST JUMP!`;
    turnIndicator.style.color = '#ff6b6b'; // Red color
    turnIndicator.style.fontWeight = 'bold';
    turnIndicator.style.fontSize = '';
  }
  // Normal turn display
  else {
    turnIndicator.innerText = `Player ${currentPlayer} turn`;
    turnIndicator.style.color = '';
    turnIndicator.style.fontWeight = '';
    turnIndicator.style.fontSize = '';
  }
};

/*
 * Highlights valid move destinations on the board
 *
 * Parameters:
 *   moves - Array<Array<number>> - Array of valid moves to highlight
 *
 * Returns: void
 */
const highlightValidMoves = (moves) => {
  for (const move of moves) {
    const row = move[0];
    const col = move[1];

    const element = getCellElement(row, col);

    if (element) {
      // Check if it's a jump (4 elements) or simple move (2 elements)
      if (move.length === 4) {
        element.classList.add('valid-jump');
      } else {
        element.classList.add('valid-move');
      }

      validMoves.push(move);
    }
  }
};

/*
 * Clears all move highlight indicators from the board
 *
 * Returns: void
 */
const clearHighlights = () => {
  const highlightedCells = document.querySelectorAll('.valid-move, .valid-jump');

  for (const cell of highlightedCells) {
    cell.classList.remove('valid-move');
    cell.classList.remove('valid-jump');
  }

  validMoves = [];
};

/*
 * Removes yellow highlight from all pieces
 *
 * Returns: void
 */
const clearSelectedPieceHighlight = () => {
  const highlightedElements = document.querySelectorAll('.selected-piece');
  highlightedElements.forEach((element) => {
    element.classList.remove('selected-piece');
  });
};

/*
 * Adds yellow highlight to the selected piece
 *
 * Parameters:
 *   row - number - Piece row
 *   col - number - Piece column
 *
 * Returns: void
 */
const addSelectedPieceHighlight = (row, col) => {
  const selectedPieceElement = getPieceElement(row, col);

  if (selectedPieceElement) {
    selectedPieceElement.classList.add('selected-piece');
  }
};

/* GAME LOGIC
   Core game mechanics: moves, captures, win conditions */

/*
 * Updates mandatory jumps list for the current player
 * Must be called at the start of each turn
 *
 * Returns: void
 */
const checkMandatoryJumps = () => {
  mandatoryJumps = findAllJumpsForPlayer(currentPlayer);
};

/*
 * Checks if the game has been won by either player
 *
 * A player wins if their opponent either:
 * 1. Has no pieces remaining, or
 * 2. Has no valid moves available (stalemate)
 *
 * Returns: number|null - Winning player number (1 or 2), or null if game continues
 */
const checkWinCondition = () => {
  // Get the opponent (the player who will move next)
  const opponent = currentPlayer;

  // Win condition 1: Opponent has no pieces left
  const opponentPieceCount = countPieces(opponent);

  if (opponentPieceCount === 0) {
    // Opponent has no pieces, previous player wins
    const winner = (opponent === PLAYER_ONE) ? PLAYER_TWO : PLAYER_ONE;
    return winner;
  }

  // Win condition 2: Opponent has no valid moves (stalemate)
  const opponentHasMoves = hasValidMoves(opponent);

  if (!opponentHasMoves) {
    // Opponent cannot move, previous player wins
    const winner = (opponent === PLAYER_ONE) ? PLAYER_TWO : PLAYER_ONE;
    return winner;
  }

  // No win condition met - game continues
  return null;
};

/*
 * Checks if the game should end in a draw
 * Draw occurs after 40 consecutive moves without any captures
 *
 * Returns: boolean - True if draw condition met, false otherwise
 */
const checkDrawCondition = () => {
  return movesSinceCapture >= MAX_MOVES_WITHOUT_CAPTURE;
};

/*
 * Displays the game over message with winner or draw information
 *
 * Parameters:
 *   result - number|string - Winner player number (1 or 2) or 'draw'
 *
 * Returns: void
 */
const displayGameOver = (result) => {
  gameOver = true;

  if (result === 'draw') {
    gameResultText.innerText = "Game Drawn - 40 moves without capture! 🤝";
    gameOverMessageDiv.classList.remove('hidden');
  } else {
    // We have a winner
    gameResultText.innerText = `Player ${result} wins! 🎉`;
    gameOverMessageDiv.classList.remove('hidden');
  }
};

/*
 * Toggles the instructions section visibility
 *
 * Returns: void
 */
const toggleInstructions = () => {
  instructionsSection.classList.toggle('hidden');
};

/*
 * Toggles AI opponent on/off
 *
 * Returns: void
 */
const toggleAI = () => {
  isAIEnabled = !isAIEnabled;
  aiToggleButton.innerText = isAIEnabled ? 'AI: ON' : 'AI: OFF';
};

/*
 * Resets the game to initial state
 * Clears all state variables and re-renders the board
 *
 * Returns: void
 */
const resetGame = () => {
  // Reset all state variables
  currentPlayer = PLAYER_ONE;
  selectedPiece = {row: null, col: null};
  gameOver = false;
  mandatoryJumps = [];
  isMultiJumping = false;
  multiJumpPiece = {row: null, col: null};
  validMoves = [];
  movesSinceCapture = 0;

  // Reset board to starting position
  board = [
    [0, 2, 0, 2, 0, 2, 0, 2], // Row 0
    [2, 0, 2, 0, 2, 0, 2, 0], // Row 1
    [0, 2, 0, 2, 0, 2, 0, 2], // Row 2
    [0, 0, 0, 0, 0, 0, 0, 0], // Row 3
    [0, 0, 0, 0, 0, 0, 0, 0], // Row 4
    [1, 0, 1, 0, 1, 0, 1, 0], // Row 5
    [0, 1, 0, 1, 0, 1, 0, 1], // Row 6
    [1, 0, 1, 0, 1, 0, 1, 0]  // Row 7
  ];

  // Hide game over message
  gameOverMessageDiv.classList.add('hidden');

  // Clear any highlights
  clearHighlights();
  clearSelectedPieceHighlight();

  // Re-render the board
  renderPieces();
  renderTurnIndicator();

  // Check for mandatory jumps
  checkMandatoryJumps();

  // If AI is player 1, make the first move after reset.
  if (isAIEnabled && currentPlayer === aiPlayer) {
    setTimeout(() => {
      makeAIMove();
    }, aiMoveDelay)
  }
};

/*
 * Executes a move from one position to another
 *
 * Handles both simple moves and jumps, including:
 * - Capturing jumped pieces
 * - King promotion
 * - Multi-jump detection and continuation
 * - Turn switching
 * - Win/draw condition checking
 *
 * Parameters:
 *   fromRow - number - Starting row (0-7)
 *   fromCol - number - Starting column (0-7)
 *   toRow - number - Destination row (0-7)
 *   toCol - number - Destination column (0-7)
 *
 * Returns: void
 */
const executeMove = (fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];

  // Calculate move distance to detect jumps
  // Simple moves: distance = 1, Jumps: distance = 2
  const rowDistance = Math.abs(toRow - fromRow);
  const colDistance = Math.abs(toCol - fromCol);
  const isJump = (rowDistance === JUMP_DISTANCE && colDistance === JUMP_DISTANCE);

  if (isJump) {
    // Find and remove the jumped piece
    // Jumped piece is always at the midpoint between start and end
    const capturedRow = (fromRow + toRow) / 2;
    const capturedCol = (fromCol + toCol) / 2;
    board[capturedRow][capturedCol] = PIECE_EMPTY;

    // Reset draw counter since a capture occurred
    movesSinceCapture = 0;
  }

  // Execute the actual move
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = PIECE_EMPTY;

  // Check if piece should be promoted to king
  checkForKingPromotion(toRow, toCol);

  // Update UI
  selectedPiece = {row: null, col: null};
  clearSelectedPieceHighlight();
  clearHighlights();
  renderPieces();

  // Increment draw counter for non-capture moves
  // This happens AFTER the jump check resets it
  movesSinceCapture++;

  // Handle multi-jump logic
  if (isJump) {
    const consecutiveJumps = checkForConsecutiveJump(toRow, toCol);

    // Reset counter again after checking consecutive jumps
    movesSinceCapture = 0;

    if (consecutiveJumps.length > 0) {
      // Multi-jump continues - don't switch turns
      isMultiJumping = true;
      multiJumpPiece = {row: toRow, col: toCol};
      selectedPiece = {row: toRow, col: toCol};

      addSelectedPieceHighlight(toRow, toCol);
      highlightValidMoves(consecutiveJumps);
      renderTurnIndicator();

      // If AI is playing and has a multi-jump, automatically continue
      if (isAIEnabled && currentPlayer === aiPlayer) {
        setTimeout(() => {
          // Select the first available jump move for the AI
          if (consecutiveJumps.length > 0 && isMultiJumping) {
            const nextJump = consecutiveJumps[0]; // Take the first available jump
            executeMove(toRow, toCol, nextJump[0], nextJump[1]);
          }
        }, aiMoveDelay);
      }

      // Exit early to prevent turn switch
      return;
    } else {
      // No more jumps - end multi-jump mode
      isMultiJumping = false;
      multiJumpPiece = {row: null, col: null};
    }
  }

  // Normal turn end - switch players
  selectedPiece = {row: null, col: null};
  currentPlayer = (currentPlayer === PLAYER_ONE) ? PLAYER_TWO : PLAYER_ONE;
  renderTurnIndicator();

  // Check game end conditions
  checkMandatoryJumps();

  const winner = checkWinCondition();
  const draw = checkDrawCondition();

  if (winner !== null) {
    displayGameOver(winner);
    return;
  }

  if (draw) {
    displayGameOver('draw');
    return;
  }

  //Trigger AI move if it's now AIs turn
  if(isAIEnabled && currentPlayer == aiPlayer) {
    // use setTimeout to add a delay to look more "human"
    setTimeout(() => {
      makeAIMove();
    }, aiMoveDelay);
  }
};

/* USER INTERACTION
   Event handlers and user input processing */

/*
 * Attempts to select a piece at the clicked square
 *
 * Parameters:
 *   clickedSquare - HTMLElement - The cell element that was clicked
 *
 * Returns: boolean - True if selection successful, false otherwise
 */
const selectPiece = (clickedSquare) => {
  if (!clickedSquare) {
    return false;
  }

  const row = Number(clickedSquare.getAttribute('data-row'));
  const col = Number(clickedSquare.getAttribute('data-col'));

  errorMessage.innerText = '';

  // Validate coordinates are numbers
  if (isNaN(row) || isNaN(col)) {
    errorMessage.innerText = 'Invalid coordinates';
    return false;
  }

  const piece = clickedSquare.children[0];

  // Check if square has a clickable piece
  if (piece && isPieceClickable(piece)) {
    // Check for mandatory jumps - only allow selecting pieces that can jump
    if (mandatoryJumps.length > 0) {
      const canThisPieceJump = mandatoryJumps.some((jumpPiece) => {
        return jumpPiece.row === row && jumpPiece.col === col;
      });

      if (!canThisPieceJump) {
        showErrorMessage('You must make a jump! Select a piece that can jump.', 3000);
        return false;
      }
    }

    selectedPiece = {row: row, col: col};
    return true;
  } else {
    if (!piece) {
      showErrorMessage('That square is empty. Please select one of your pieces.');
    } else if (!isPieceClickable(piece)) {
      showErrorMessage(`That's Player ${currentPlayer === PLAYER_ONE ? '2' : '1'}'s piece. Select your own piece.`);
    }
    return false;
  }
};

/*
 * Handles click events on the game board
 * Manages piece selection, movement, and multi-jump sequences
 *
 * Parameters:
 *   event - Event - The click event
 *
 * Returns: void
 */
const handleGameBoardClick = (event) => {
  // Prevent interaction if game is over
  if (gameOver) {
    return;
  }

  let clickedSquare = event.target;

  // If clicked on a piece, get its parent cell
  if (clickedSquare.classList.contains('piece')) {
    clickedSquare = clickedSquare.parentElement;
  }

  // Validate it's a cell
  if (!isValidCell(clickedSquare)) {
    return;
  }

  const row = Number(clickedSquare.getAttribute('data-row'));
  const col = Number(clickedSquare.getAttribute('data-col'));

  // MULTI-JUMP MODE - Special handling
  if (isMultiJumping) {
    // Only allow clicking valid jump destinations
    if (isValidDestination(row, col)) {
      executeMove(multiJumpPiece.row, multiJumpPiece.col, row, col);
    } else {
      showErrorMessage('You must complete the multi-jump! Click a highlighted square.', 3000);
    }
    return; // Exit early
  }

  // NORMAL GAME STATE - No piece selected
  if (selectedPiece.row === null || selectedPiece.col === null) {
    clearSelectedPieceHighlight();
    const success = selectPiece(clickedSquare);

    if (success) {
      addSelectedPieceHighlight(selectedPiece.row, selectedPiece.col);
      clearHighlights();
      const moves = getValidMoves(selectedPiece.row, selectedPiece.col);
      highlightValidMoves(moves);
    }
  }
  // NORMAL GAME STATE - Piece already selected
  else {
    // Check if clicked square is valid destination
    if (isValidDestination(row, col)) {
      executeMove(selectedPiece.row, selectedPiece.col, row, col);
    }
    // Check if clicking a different piece of the same player
    else if (getPieceOwner(row, col) === currentPlayer) {
      // Switch selection to new piece
      clearHighlights();
      clearSelectedPieceHighlight();
      selectPiece(clickedSquare);
      addSelectedPieceHighlight(selectedPiece.row, selectedPiece.col);

      if (selectedPiece.row !== null) {
        const moves = getValidMoves(selectedPiece.row, selectedPiece.col);
        highlightValidMoves(moves);
      }
    }
    // Clicked somewhere invalid - deselect piece
    else {
      selectedPiece = {row: null, col: null};
      clearHighlights();
      clearSelectedPieceHighlight();
    }
  }
};

/* INITIALIZATION
   Game setup and startup routines */

/*
 * Initializes the game
 * Sets initial state, renders board and pieces, and checks for mandatory jumps
 *
 * Returns: void
 */
function init() {
  // Set the initial game state
  currentPlayer = PLAYER_ONE;
  selectedPiece = {row: null, col: null};
  gameOver = false;
  mandatoryJumps = [];
  isMultiJumping = false;
  multiJumpPiece = {row: null, col: null};
  movesSinceCapture = 0;

  // Render the board and pieces
  renderBoard(gameBoard);
  renderPieces();
  renderTurnIndicator();

  // Check for mandatory jumps at game start
  checkMandatoryJumps();

  // if AI is player 1 make the first move
  if(isAIEnabled && currentPlayer === aiPlayer) {
    setTimeout(() => {
      makeAIMove();
    }, aiMoveDelay);
  }
}

/* EVENT LISTENERS */

gameBoard.addEventListener('click', handleGameBoardClick);
resetButton.addEventListener('click', resetGame);
instructionsButton.addEventListener('click', toggleInstructions);
aiToggleButton.addEventListener('click', toggleAI);

document.addEventListener('DOMContentLoaded', init);

//Verify JavaScript is loading
console.log('app.js loaded');
//Constants

//State variables
let board = [
  // 0 = empty, 1 = player 1, 2 = player 2, 3 = player 1 king, 4 = player 2 king.
  [0, 2, 0, 2, 0, 2, 0, 2], // Row 0
  [2, 0, 2, 0, 2, 0, 2, 0], // Row 1
  [0, 2, 0, 2, 0, 2, 0, 2],  // Row 2
  [0, 0, 0, 0, 0, 0, 0, 0],  // Row 3
  [0, 0, 0, 0, 0, 0, 0, 0],  // Row 4
  [1, 0, 1, 0, 1, 0, 1, 0],  // Row 5
  [0, 1, 0, 1, 0, 1, 0, 1],  // Row 6
  [1, 0, 1, 0, 1, 0, 1, 0]   // Row 7
]
//Cached elements references
const gameBoard = document.getElementById('game-board');

//Event listeners

//Functions

const renderBoard = (gameBoard) => {
  for(let row = 0; row < 8; row ++) {
    for(let col = 0; col < 8; col++) {
      // Creates a new cell element and sets its row, col, and class values
      const cell = document.createElement('div')
      cell.dataset.row = row
      cell.dataset.col = col;
      cell.className = 'cell';

      // Alternate cell color based on row + column parity
      if((row + col) % 2 === 0) {
        cell.classList.add('light');
      } else {
        cell.classList.add('dark')
      }
      // append the new cell to the gameBoard element.
      gameBoard.appendChild(cell);
    }
  }
}

//renders the pieces (for player 1 and player 2) on the board
const renderPieces = () => {
  // Board values: 0 = empty, 1 = player 1, 2 = player 2, 3 = player 1 king, 4 = player 2 king

  //clear existing pieces (if any)
  clearBoard();

  let squareDiv;
  let pieceElement;
  for(let row = 0; row < 8; row ++) {
    for(let col = 0; col < 8; col++) {
      const pieceValue = board[row][col];

      if(pieceValue !== 0) {
        // Creates a new piece element
        pieceElement = document.createElement('div');
        pieceElement.className = 'piece';

        // Use board value (1,2,3,4) to determine player
        // Values 1 or 3 = player 1, Values 2 or 4 = player 2
        if(pieceValue === 1 || pieceValue === 3) {
          pieceElement.classList.add('player-1');
        } else if(pieceValue === 2 || pieceValue === 4) {
          pieceElement.classList.add('player-2');
        }

        // Add 'king' class for values 3 and 4
        if(pieceValue === 3 || pieceValue === 4) {
          pieceElement.classList.add('king');
        }

        // Data attributes for game logic (move validation, piece selection)
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;
        pieceElement.dataset.player = (pieceValue === 1 || pieceValue === 3) ? '1' : '2';

        // Selecting square for positioning the piece
        squareDiv = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        squareDiv.appendChild(pieceElement);
      }
    }
  }
}

const clearBoard = () => {
  let squarePieces = document.querySelectorAll('.piece');
  squarePieces.forEach((piece) => {
      piece.remove();
  })
}

// init() initializes the game.
function init() {
  renderBoard(gameBoard);
  renderPieces();
  console.log("Checker's game initialized");
}

// Call init when the dom is ready
document.addEventListener('DOMContentLoaded', init);

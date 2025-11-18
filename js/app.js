//Verify JavaScript is loading
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

let currentPlayer = 1; // 1-> player-1, 2 -> player-2
let selectedPiece = {row: null, col: null};
let gameOver = false;

//Cached elements references
const gameBoard = document.getElementById('game-board');
const turnIndicator = document.getElementById('player-turn');
const errorMessage = document.getElementById('error-message');

//Functions

const renderBoard = (gameBoard) => {
  //Clears existing board cells before rendering (for re-initialization)
  gameBoard.innerHTML = '';

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

const renderTurnIndicator = () => {
  turnIndicator.innerText = `Player ${currentPlayer} turn`;
}

//identifies which square was clicked
// extracts row and col for clicked square
const handleGameBoardClick = (event) => {
  if(gameOver) return;
  let clickedSquare = (event.target);

  if(clickedSquare.classList.contains('piece')) {
    clickedSquare = clickedSquare.parentElement;
  }
  if(isValidCell(clickedSquare)){
    selectPiece(clickedSquare);
  }
}
const selectPiece = (clickedSquare) => {
  if(clickedSquare === null || clickedSquare === undefined) {
    return;
  }
  let row = Number(clickedSquare.getAttribute('data-row'));
  let col = Number(clickedSquare.getAttribute('data-col'));

  errorMessage.innerText = '';

  if(isNaN(row) || isNaN(col)) {
    errorMessage.innerText = 'row and col are not valid numbers';
    return;
  }

  const childSquare = clickedSquare.children[0]

  if(selectedPiece.row === row && selectedPiece.col === col) {
    toggleHighlight(selectedPiece);
    selectedPiece = {row: null, col: null};
    return;
  }
  if(selectedPiece.row !== null && selectedPiece.col !== null) {
    toggleHighlight(selectedPiece);
  }

  if(childSquare && isPieceClickable(childSquare)) {
    selectedPiece = {row: row, col: col}
    toggleHighlight(selectedPiece)
  } else {
    if(!childSquare) {
      showErrorMessage('That square is empty. Please select one of your pieces.')
    } else if(!isPieceClickable(childSquare)) {
      showErrorMessage(`That's Player ${currentPlayer === 1 ? '2' : '1'}'s piece. Select your own piece.`);
    }
  }
}


const isPieceClickable = (square) => {
  if(square.classList.contains(`player-${currentPlayer}`)) {
    return true;
  } else {
    return false;
  }
}

const toggleHighlight = ((selectedPiece) => {
  if(selectedPiece.row === null || selectedPiece.col === null) {return;}
    const pieceElement = document.querySelector(`.piece[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`)
    if(pieceElement) {
      console.log(getValidMoves(selectedPiece.row, selectedPiece.col))
      pieceElement.classList.toggle('selected-piece')
      return;
    }
})

// checks if click target is a valid cell (in case user clicks outside)
const isValidCell = (element) => {
  return element && element.classList.contains('cell');
}

// displays error message with timeout (auto-disappearing messages)
const showErrorMessage = (message, duration = 3000) => {
  errorMessage.innerText = message;
  setTimeout(() => {
    errorMessage.innerText = '';
  }, duration);
}
// checks if square is empty
const isSquareEmpty = (row, col) => {
  console.log(row, col)
  console.log(board[row][col] === 0)
  return board[row][col] === 0;
}

//simple movement - no jump

const getValidMoves = (row, col) => {
  let validMoves = [];
  let rightMove = checkRight(row, col);
  let leftMove = checkLeft(row, col);
  //player 1 -> moves up
  //player 2 -> moves down
  if (rightMove) validMoves.push(rightMove)
  if (leftMove) validMoves.push(leftMove)

  return validMoves;
}

const checkRight = (row, col) => {
  let newRow;
  let newCol;
  //player 1 -> check up right
  if(getPieceOwner(row, col) === 1) {
    newRow = row - 1 //getting adjacent row
    newCol = col + 1 //getting adjacent col
    console.log(newRow, newCol)
  if(isRowAndColValid(newRow, newCol)) {
  if(isSquareEmpty(newRow, newCol)) {
      return [newRow, newCol];
    }
  }
  return null;
  }else if(getPieceOwner(row, col) === 2) { // player 2 -> check down right
    newRow = row + 1;
    newCol = col + 1;
    if(isRowAndColValid(newRow, newCol)) {
      if(isSquareEmpty(newRow, newRow)) {
        return [newRow, newCol]
      }
    }
    return null;
  }
}

const checkLeft = (row, col) => {
  let newRow;
  let newCol;
  if(getPieceOwner(row, col) === 1) {
    newRow = row - 1;
    newCol = col - 1;
    if(isRowAndColValid(newRow, newCol)) {
      if(isSquareEmpty(newRow, newCol)) {
        return [newRow, newCol];
      }
    }
    return null;
  } else if(getPieceOwner(row, col) === 2) {
    newRow = row+1;
    newCol = col - 1;
    if(isRowAndColValid(newRow, newCol)) {
      if(isSquareEmpty(newRow, newCol)) {
        return [newRow, newCol]
      }
    }
    return null;
  }
}

const getPieceOwner = (row, col) => {
  if(board[row][col] === 1) {
    return 1;
  } else if(board[row][col] === 2) {
    return 2;
  }
}

const isRowAndColValid = (row, col) => {
  if(row >= 0 && row <= 7 && col >= 0 && col <= 7) {
    return true;
  } else {
    return false;
  }
}


//Event listeners
gameBoard.addEventListener("click", handleGameBoardClick)

// init() initializes the game.
function init() {
  // sets the inital game state
  currentPlayer = 1;
  selectedPiece = {row: null, col: null};
  gameOver = false;

  renderBoard(gameBoard);
  renderPieces();

  renderTurnIndicator()
}

// Call init when the dom is ready
document.addEventListener('DOMContentLoaded', init);

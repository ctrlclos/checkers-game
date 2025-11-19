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
let validMoves = [];//stores current valid moves for a selected piece
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

  // gets parent cell
  if(clickedSquare.classList.contains('piece')) {
    clickedSquare = clickedSquare.parentElement;
  }
  // makes sure its a valid cell
  if(!isValidCell(clickedSquare)) return;

  const row = Number(clickedSquare.getAttribute('data-row'));
  const col = Number(clickedSquare.getAttribute('data-col'));

  // game state 1 - when no piece is selected
  if(selectedPiece.row === null || selectedPiece.col === null) {
    clearSelectedPieceHighlight(); // Clear any leftover highlights
    const success = selectPiece(clickedSquare);

    // checks if selection was successfull
    if(success) {
      addSelectedPieceHighlight(selectedPiece.row, selectedPiece.col);
      clearHighlights();
      const moves = getValidMoves(selectedPiece.row, selectedPiece.col);
      highlightValidMoves(moves);
    }
  }
  // game state 2 - piece already selected
  else {
    // checks if clicked square is valid destination
    if(isValidDestination(row, col)) {
      // executes the move
      executeMove(selectedPiece.row, selectedPiece.col, row, col)
    }
    else if(board[row][col] === currentPlayer) { // checks if clicking a different piece of the same player
      // switches selection to new piece
      clearHighlights();
      clearSelectedPieceHighlight()
      selectPiece(clickedSquare);
      addSelectedPieceHighlight(selectedPiece.row, selectedPiece.col)
      if(selectedPiece.row !== null) {
        const moves = getValidMoves(selectedPiece.row, selectedPiece.col);
        highlightValidMoves(moves);
      }
    }
    // Clicked somewhere invalid, deselect piece;
    else {
      selectedPiece = {row: null, col: null};
      clearHighlights();
      // clears yellow selected piece highlight too
      clearSelectedPieceHighlight()
    }
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

  if(childSquare && isPieceClickable(childSquare)) {
    selectedPiece = {row: row, col: col}
    return true;
  } else {
    if(!childSquare) {
      showErrorMessage('That square is empty. Please select one of your pieces.')
    } else if(!isPieceClickable(childSquare)) {
      showErrorMessage(`That's Player ${currentPlayer === 1 ? '2' : '1'}'s piece. Select your own piece.`);
    }
    return false;
  }
}


const isPieceClickable = (square) => {
  if(square.classList.contains(`player-${currentPlayer}`)) {
    return true;
  } else {
    return false;
  }
}

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
  let directions = [];
  let result;
  if(!isRowAndColValid(row, col)) { return []; } // no valid moves
    if(getPieceOwner(row, col) === 1) {
        directions = [
        [-1, -1],  // up-left
        [-1, +1]   // up-right
      ]
      directions.forEach((direction) => {
        result = getValidDiagonalSquare(row, col, direction[0], direction[1])
        if(result!==null) {
          validMoves.push(result)
        }
      })
    }
    else if(getPieceOwner(row, col) === 2) {
      directions = [
        [+1, -1],  // down-left
        [+1, +1]   // down-right
      ]
      directions.forEach((direction) => {
        result = getValidDiagonalSquare(row, col, direction[0], direction[1])
        if(result!==null) {
          validMoves.push(result)
        }
      })
    }
    return validMoves;
}


//can check any diagonal direction
const getValidDiagonalSquare = (row, col, rowDelta, colDelta) => {
  let newRow = row + rowDelta;//getting adjacent row
  let newCol = col + colDelta;//getting adjacent col
    if(isRowAndColValid(newRow, newCol)) {
      if(isSquareEmpty(newRow, newCol)) {
          return [newRow, newCol];
        }
      }
    return null;
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

//Highlight Valid Moves
const highlightValidMoves = (moves) => {
  for(const [row, col] of moves) {
    const element = document.querySelector(`.cell[data-col="${col}"][data-row="${row}"]`)
    console.log(element)
    if(element) {
      element.classList.add('valid-move');
      validMoves.push([row, col])
      console.log(validMoves);
    } else {
      return;
    }
  }
}

const clearHighlights = (moves) => {
  const highlightedCells = document.querySelectorAll(`.valid-move`);
  for(cell of highlightedCells) {
    cell.classList.remove('valid-move');
  }
  validMoves = []
}
//Implement Move Execution
const executeMove = (fromRow, fromCol, toRow, toCol) => {
  //update board data
  const piece = board[fromRow][fromCol]; //get piece value from starting position
  board[toRow][toCol] = piece //place piece at the destination
  board[fromRow][fromCol] = 0 //clear the original position, makes square available
  selectedPiece = {row: null, col: null}; //clear selection state
  clearSelectedPieceHighlight()
  clearHighlights();
  renderPieces();// re-render pieces
  currentPlayer = (currentPlayer === 1) ? 2 : 1; // switches turns
  renderTurnIndicator()
}

//Integrate Move Logic with Click Handler
//state machine -> we have two states 1) no piece selected 2) piece already selected.
//state 1) -> click should select piece, if valid
//state 2) -> should either move to a valid destination or select a different piece or diselect the current piece.
const isValidDestination = (row, col) => {
  for(let move of validMoves) {
    if(move[0] === row && move[1] === col) {
      return true;
    }
  }
  return false;
}

// removes yellow highlight from all pieces
const clearSelectedPieceHighlight = () => {
  const highlightedElements = document.querySelectorAll('.selected-piece');
  highlightedElements.forEach((element) => {
    element.classList.remove('selected-piece')
  })
}

const addSelectedPieceHighlight = (row, col) => {
  const selectedPieceElement = document.querySelector(`.piece[data-row="${row}"][data-col="${col}"]`);
  if(selectedPieceElement) {
    selectedPieceElement.classList.add('selected-piece');
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

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
let mandatoryJumps = []; // pieces that must jump

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
  if(mandatoryJumps.length > 0) {
    turnIndicator.innerText = `Player ${currentPlayer} turn - MUST JUMP!`;
    turnIndicator.style.color = '#ff6b6b'; //red color
    turnIndicator.style.fontWeight = 'bold';
  } else { // resets to default style
    turnIndicator.innerText = `Player ${currentPlayer} turn`;
    turnIndicator.style.color = '';
    turnIndicator.style.fontWeight = '';
  }
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
    //checks for mandatory jumps, if there are -> only allow selecting pieces that can jump
    if(mandatoryJumps.length > 0) {
      // Check if this piece is the one that can jump
      const canThisPieceJump = mandatoryJumps.some((jumpPiece) => {
        return jumpPiece.row === row && jumpPiece.col === col;
      });

      if(!canThisPieceJump) {
        // Selected piece cannot jump, but there is at least one mandatory jump available
        showErrorMessage(
          'You must make a jump! Select a piece that can jump.',
          3000
        );
        return false;
      }
    }
    // end mandatory jump check
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
  const pieceOwner = getPieceOwner(row, col);
  const pieceIsKing = isKing(row, col);
  // JUMP MOVES (check first)
  // if jumps are available for this piece,ONLY return jumps
    const jumps = getValidJumps(row, col);
    // adds jump to valid moves, jump format: [toRow, toCol, captureRow, captureCol]
    // keeps full format for later use in executeMove
    if(jumps.length > 0) {
      return jumps; // return only jumps, skip rest, we will only show jump destinations, simple moves are never highlighted.
    }
  // SIMPLE MOVES (only if no jumps available)
  // determines valid directions based on piece type
  if(pieceIsKing) {
    directions = [
      //[row, col] -> kings moves in all 4 diagonal directions
      [-1, -1],  //up-left
      [-1, +1],  //up-right
      [+1, -1],  //down-left
      [+1, +1]   //down-right
    ]
  }
  else if(pieceOwner === 1) {
      directions = [
      [-1, -1],  // up-left
      [-1, +1]   // up-right
    ]
  }
  else if(pieceOwner === 2) {
    directions = [
      [+1, -1],  // down-left
      [+1, +1]   // down-right
    ]
  }
  //check each direction for valid SIMPLE moves
  directions.forEach((direction) => {
    result = getValidDiagonalSquare(row, col, direction[0], direction[1]);
    if(result !== null) {
      validMoves.push(result);
    }
  })

  return validMoves;
}

const findAllJumpsForPlayer = (player) => {
  const piecesWithJumps = [];

  //iterate through entire board
  for(let row = 0; row < 8; row ++) {
    for(let col = 0; col < 8; col ++) {
      const pieceOwner = getPieceOwner(row, col);

      // check if current square has a piece belonging to current player
      if(pieceOwner === player) {
        //get all valid jumps for this piece
        const jumps = getValidJumps(row, col);

        // if this piece has any jumps available, store it
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
}

const checkMandatoryJumps = () => {
  mandatoryJumps = findAllJumpsForPlayer(currentPlayer);

  if(mandatoryJumps.length > 0) {
    console.log(`Player ${currentPlayer} has ${mandatoryJumps.length} piece(s) that must jump`);
  }
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
  if(board[row][col] === 1 || board[row][col] === 3) {//player 2 (regular piece, king)
    return 1;
  }
  else if(board[row][col] === 2 || board[row][col] === 4) { //player 2 (regular piece, king)
    return 2;
  }
  return null; // now owner, empty square
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
  for(const move of moves) {
    const row = move[0];
    const col = move[1];

    const element = document.querySelector(`.cell[data-col="${col}"][data-row="${row}"]`)
    console.log(element)
    if(element) {
      // checks if it is a jump (4 elements) or simple move 2 elements
      if (move.length === 4) {
        element.classList.add('valid-jump');
      } else {
        element.classList.add('valid-move');
      }
      validMoves.push(move)
      //console.log(validMoves);
    } else {
      return;
    }
  }
}

const clearHighlights = (moves) => {
  const highlightedCells = document.querySelectorAll(`.valid-move, .valid-jump`);
  for(cell of highlightedCells) {
    cell.classList.remove('valid-move');
    cell.classList.remove('valid-jump');
  }
  validMoves = []
}
//Implement Move Execution
const executeMove = (fromRow, fromCol, toRow, toCol) => {
  //update board data
  const piece = board[fromRow][fromCol]; //get piece value from starting position

  // Calculate the distance moved
  const rowDistance = Math.abs(toRow - fromRow);
  const colDistance = Math.abs(toCol - fromCol);

  // DETECT IF THIS MOVE IS A JUMP
  // jumps move 2 squares diagonally
  const isJump = (rowDistance === 2 && colDistance === 2);

  if(isJump) {
    // Calculates which piece was jumped over
    const capturedRow = (fromRow + toRow) / 2;
    const capturedCol = (fromCol + toCol) / 2;

    // Remove the captured piece from the board
    board[capturedRow][capturedCol] = 0;

  }

  // EXECUTE THE MOVE
  board[toRow][toCol] = piece //place piece at the destination
  board[fromRow][fromCol] = 0 //clear the original position, makes square available
  checkForKingPromotion(toRow, toCol);//check for king promotion after the move

  // UPDATE THE UI (user interface)
  selectedPiece = {row: null, col: null}; //clear selection state
  clearSelectedPieceHighlight()
  clearHighlights();

  renderPieces();// re-render pieces

  // switches turns
  currentPlayer = (currentPlayer === 1) ? 2 : 1; // switches turns
  renderTurnIndicator()

  // checks for mandatory jumps for the new player
  checkMandatoryJumps();
}

const checkForKingPromotion = (row, col) => {
  const pieceValue = board[row][col]
  if(pieceValue === 1 && row === 0) {
    board[row][col] = 3;
    return true;

  } else if(pieceValue === 2 && row === 7) {
    board[row][col] = 4;
    return true;
  }
  return false;
}

const isKing = (row, col) => {
  const pieceValue = board[row][col];
  if(pieceValue === 3 || pieceValue === 4) {
    return true;
  } else {
    return false;
  }
}

const isOpponent = (row, col, player) => {
  const pieceOwner = getPieceOwner(row, col);
  //if there is no piece (null) or its current player's piece return false
  if(pieceOwner === null || pieceOwner === player) {
    return false;
  }
  //returns true if it is the opponents piece
  return true;
}

//calculates all valid jump moves for a piece
const getValidJumps = (row, col) => {
  const validJumps = [];

  if (!isRowAndColValid(row, col)) {
    return []
  }

  const pieceOwner = getPieceOwner(row, col);
  const pieceIsKing = isKing(row, col);

  //if no piece at this location, returns empty
  if(pieceOwner === null) {
    return [];
  }

  // determine directions to check based on piece type (regular or king)
  let directions = []

  if(pieceIsKing) {
    // kings can jump in all 4 directions
    directions = [
      [-1, -1],  // up-left
      [-1, +1],  // up-right
      [+1, -1],  // down-left
      [+1, +1]   // down-right
    ]
  } else if (pieceOwner === 1) {
    // Player 1 regular pieces jump UP
    directions = [
      [-1, -1],  // up-left
      [-1, +1]   // up-right
    ];
  } else if (pieceOwner === 2) {
    // Player 2 regular pieces jump DOWN
    directions = [
      [+1, -1],  // down-left
      [+1, +1]   // down-right
    ];
  }

  // Check each direction for valid jumps
  directions.forEach(([rowDelta, colDelta]) => {
    // Position of adjacent square (potential opponent)
    const adjRow = row + rowDelta;
    const adjCol = col + colDelta;

    // Position of landing square (2 squares away)
    const landRow = row + (rowDelta * 2);
    const landCol = col + (colDelta * 2);

    if(
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
  mandatoryJumps = [];

  renderBoard(gameBoard);
  renderPieces();

  renderTurnIndicator();

  // check for mandatory jumps at game start
  checkMandatoryJumps();
}


// Call init when the dom is ready
document.addEventListener('DOMContentLoaded', init);

// ==========================================
// 1. SELECTING DOM ELEMENTS
// ==========================================
const title = document.getElementById('gameTitle');            // big bouncing title
const staticHeader = document.getElementById('staticHeader');  // fixed header shown in the menus
const canvas = document.getElementById('snakeBoard');          // game area
const scoreContainer = document.getElementById('scoreContainer');

// Menu screens
const mainMenu = document.getElementById('mainMenu');
const modeMenu = document.getElementById('modeMenu');

// Main menu buttons
const btnStart = document.getElementById('btnStart');
const btnHighScore = document.getElementById('btnHighScore');

// Mode menu buttons and back button
const btnScale = document.getElementById('btnScale');
const btnHarmony = document.getElementById('btnHarmony');
const btnPractice = document.getElementById('btnPractice');
const btnBack = document.getElementById('btnBack');

// screen with arrows
const controlsScreen = document.getElementById('controlsScreen');  

// Play screen elements
const levelInfo = document.getElementById('levelInfo');
const levelVal = document.getElementById('levelVal');
const levelKey = document.getElementById('levelKey');
const scoreVal = document.getElementById('scoreVal');

// ==========================================
// 2. LOADING SNAKE SPRITES FROM GITHUB
// ==========================================

const SPRITE_BASE_URL = 'https://cdn.jsdelivr.net/gh/23ET/Anacorda@main/snake-demo-v1.0.3-source/assets';

function loadSprite(filename) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = `${SPRITE_BASE_URL}/${filename}`;
  return img;
}

const SNAKE_SPRITES = {
  head: loadSprite('head.png'),
  body: loadSprite('body-3.png'),
  narrow: loadSprite('narrow.png'),
  tail: loadSprite('tail.png')
};
// ==========================================
// 3. STATE AND MOTION VARIABLES
// ==========================================
let posX = 0;          // current horizontal position of the title
let posY = 0;          // current vertical position of the title

let vx = 2.5;          // horizontal speed (pixels per frame)
let vy = 1.8;          // vertical speed (pixels per frame)

let bouncing = true;   // true while the title is still bouncing

// ==========================================
// 4. INITIAL CENTERING OF THE TITLE ON THE CANVAS
// ==========================================
function centerTitleOnCanvas() {
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const titleWidth = title.offsetWidth;
  const titleHeight = title.offsetHeight;

  // Center = (total space - title size) / 2
  posX = (canvasWidth - titleWidth) / 2;
  posY = (canvasHeight - titleHeight) / 2;

  title.style.left = `${posX}px`;
  title.style.top = `${posY}px`;
}

// ==========================================
// 5. ANIMATION: THE TITLE BOUNCES OFF THE CANVAS BORDERS
// ==========================================
function animateTitle() {
  if (!bouncing) return;               // animation stopped: exit the loop

  const titleWidth = title.offsetWidth;
  const titleHeight = title.offsetHeight;
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;

  const borderWidth = 4;               // canvas border thickness (same as in the CSS)

  // Limits the title can move within
  const minX = borderWidth;
  const maxX = canvasWidth - titleWidth - borderWidth;
  const minY = borderWidth;
  const maxY = canvasHeight - titleHeight - borderWidth;

  // Horizontal bounce
  if (posX >= maxX) {
    posX = maxX;
    vx = -Math.abs(vx);                // right edge: move left
  } else if (posX <= minX) {
    posX = minX;
    vx = Math.abs(vx);                 // left edge: move right
  }

  // Vertical bounce
  if (posY >= maxY) {
    posY = maxY;
    vy = -Math.abs(vy);                // bottom edge: move up
  } else if (posY <= minY) {
    posY = minY;
    vy = Math.abs(vy);                 // top edge: move down
  }

  // Move the title
  posX += vx;
  posY += vy;
  title.style.left = `${posX}px`;
  title.style.top = `${posY}px`;

  requestAnimationFrame(animateTitle); // call this function again on the next frame
}

// ==========================================
// 6. CLICK ANYWHERE ON THE PAGE
// ==========================================
function setupFirstClick() {
  // { once: true }: the listener removes itself after the first click
  document.addEventListener('click', () => {
    bouncing = false;                           // stop the bouncing
    document.body.style.cursor = 'default';     // restore the normal cursor

    title.classList.add('pixel-dissolve');      // start the dissolve animation

    // When the dissolve animation ends...
    title.addEventListener('animationend', () => {
      title.classList.add('hidden');            // hide the big title
      staticHeader.classList.remove('hidden');  // show the fixed header
      mainMenu.classList.remove('hidden');      // show the main menu
    }, { once: true });
  }, { once: true });
}

// ==========================================
// 7. MENU BUTTONS AND TRANSITIONS
// ==========================================

// "NEW GAME": hide the main menu, show the mode selection
btnStart.addEventListener('click', (e) => {
  e.stopPropagation();  
  mainMenu.classList.add('hidden');
  modeMenu.classList.remove('hidden');
});

// "HIGH SCORE":
btnHighScore.addEventListener('click', (e) => {
  e.stopPropagation();
  alert('High Score section coming soon!');
});

// "← BACK": return to the main menu
btnBack.addEventListener('click', (e) => {
  e.stopPropagation();
  modeMenu.classList.add('hidden');
  mainMenu.classList.remove('hidden');
});

// One button per game mode (these are click events, not keyboard events)
btnScale.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame('Scale Mode');
});

btnHarmony.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame('Harmony Mode');
});

btnPractice.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame('Practice Mode');
});

// ==========================================
// 8. COUNTDOWN AND STARTING THE GAME
// ==========================================

// Steps shown one after the other, and how long each one lasts
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_DURATION = 800;   // milliseconds per step
const CONTROLS_DURATION = 3000;   // How long the arrows remain visible, in milliseconds

// Each mode has the same color as its menu button
const MODE_COLORS = {
  'Scale Mode': '#39FF14',     // green  (.btn-green)
  'Harmony Mode': '#ff0055',   // red    (.btn-red)
  'Practice Mode': '#ffffff'   // white  (.btn-outline)
};

// Draws "READY?", the chosen mode and "3 - 2 - 1 - GO!" on the canvas,
// then calls onFinish()
function startCountdown(modeName, onFinish) {
  const ctx = canvas.getContext('2d');
  let stepIndex = 0;         // which step we are showing (0 = "3")
  let stepStart = null;      // time when the current step started

  // Color of the chosen mode (turquoise if the mode is not in the table)
  const modeColor = MODE_COLORS[modeName] || '#00ffcc';

// Function called every frame; “timestamp” is the time in milliseconds provided by the browser

  function drawStep(timestamp) {
    // First frame of a new step: remember when it started
    if (stepStart === null) stepStart = timestamp;

    // progress goes from 0 (step just started) to 1 (step finished)
    const progress = Math.min((timestamp - stepStart) / STEP_DURATION, 1);

    ctx.save();   // save the canvas settings, so we can restore them later

    // Clear the board
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "READY?" at the top (always fully visible)
    ctx.fillStyle = 'yellow';
    ctx.font = '32px GamePaused, monospace';
    ctx.fillText('READY?', canvas.width / 2, 50);

    // Chosen game mode, right below "READY?", in the color of that mode
    ctx.fillStyle = modeColor;
    ctx.font = '22px GamePaused, monospace';
    ctx.fillText(modeName.toUpperCase(), canvas.width / 2, 95);

    // Big countdown text : starts large and shrinks while fading out
    const text = COUNTDOWN_STEPS[stepIndex];
    const fontSize = 120 - 40 * progress;       // 120px -> 80px
    ctx.globalAlpha = 1 - 0.7 * progress;       // 100% -> 30% opacity
    ctx.fillStyle = 'yellow';
    ctx.font = `${fontSize}px CSGoals, monospace`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 30);

    ctx.restore();   // restore the canvas settings

    // Step finished: go to the next one, or end the countdown
    if (progress >= 1) {
      stepIndex++;
      stepStart = null;
      if (stepIndex >= COUNTDOWN_STEPS.length) {
        onFinish();   // countdown over: start the real game
        return;
      }
    }

    requestAnimationFrame(drawStep);   // next frame
  }

  requestAnimationFrame(drawStep);
}

// Current level and score
let level = 1;
let score = 0;

// Updates the "LVL x : key" text in the header
function setLevel(newLevel, key) {
  level = newLevel;
  levelVal.textContent = level;
  levelKey.textContent = key;
}

// Updates the number in the score box
function setScore(newScore) {
  score = newScore;
  scoreVal.textContent = score;
}

// Called when the player picks a game mode
// Called when the player picks a game mode
function startGame(modeName) {
  modeMenu.classList.add('hidden');            // close the mode menu
  staticHeader.classList.add('hidden');        // the header stays hidden until the play screen
  controlsScreen.classList.remove('hidden');   // show the arrows and the instructions

  // After 5 seconds: hide the arrows and start the countdown
  setTimeout(() => {
    controlsScreen.classList.add('hidden');
    startCountdown(modeName, () => initGame(modeName));
  }, CONTROLS_DURATION);
}

// Builds the play screen: header + level on top, score box at the bottom
function initGame(modeName = 'Standard') {
  // Show the header (same as in the menus) with the level line below it
  staticHeader.classList.remove('hidden');
  levelInfo.classList.remove('hidden');

  // Show the score box at the bottom
  scoreContainer.classList.remove('hidden');

  // Starting values
  setLevel(1, 'Gm');
  setScore(0);

  // Clear the board
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Placeholder in the middle
  ctx.fillStyle = MODE_COLORS[modeName] || '#00ffcc';
  ctx.font = '20px GamePaused, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`MODE: ${modeName.toUpperCase()}`, canvas.width / 2, canvas.height / 2);
}

// ==========================================
// 9. SNAKE GAME ENGINE & SPRITE RENDERING
// ==========================================

const GRID_SIZE = 20; // Each grid cell is 20x20px (400 / 20 = 20 columns)
// Safe playable rows: top header takes ~100px (rows 0-4), bottom score takes ~60px (rows 17-19)
const MIN_ROW = 5;
const MAX_ROW = 16;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let gameLoopId = null;

// Draws a snake sprite centered on the grid cell and rotated in the movement direction
function drawRotatedSprite(ctx, img, gridX, gridY, angleDeg, scale = 0.5) {
  const x = gridX * GRID_SIZE;
  const y = gridY * GRID_SIZE;

  // Fallback rectangle if the sprite image has not finished loading yet
  if (!img.complete || img.naturalWidth === 0) {
    ctx.fillStyle = '#39FF14';
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    return;
  }

  // Keep the original image aspect ratio instead of stretching it into a square
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // Keep pixel-art edges crisp and sharp
  ctx.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2); // Move origin to the center of the cell
  ctx.rotate((angleDeg * Math.PI) / 180); // Convert degrees to radians and rotate
  ctx.drawImage(img, -w / 2, -h / 2, w, h); // Draw image centered on the new origin
  ctx.restore();
}

// Returns the rotation angle (in degrees) based on a movement vector
function getAngleFromVector(dx, dy) {
  if (dx === 1) return 0;     // Right
  if (dy === 1) return 90;    // Down
  if (dx === -1) return 180;  // Left
  if (dy === -1) return -90;  // Up
  return 0;
}

// Initializes the play screen, resets snake position, and starts the game loop
function initGame(modeName = 'Standard') {
  // Show the top header, level indicator, and bottom score box
  staticHeader.classList.remove('hidden');
  levelInfo.classList.remove('hidden');
  scoreContainer.classList.remove('hidden');

  // Set initial level and score
  setLevel(1, 'Gm');
  setScore(0);

  // Create a 3-segment snake centered inside the playable area
  snake = [
    { x: 10, y: 10 }, // Head
    { x: 9, y: 10 },  // Body
    { x: 8, y: 10 }   // Tail
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  // Clear any previous game loop and start a new one (updates every 150ms)
  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(updateAndDraw, 150);
}

// Main game loop: updates snake coordinates and redraws the canvas
function updateAndDraw() {
  const ctx = canvas.getContext('2d');
  direction = nextDirection;

  // Calculate the new head position with wrap-around inside the safe playable rows
  const head = {
    x: (snake[0].x + direction.x + 20) % 20,
    y: snake[0].y + direction.y
  };

  if (head.y < MIN_ROW) head.y = MAX_ROW;
  if (head.y > MAX_ROW) head.y = MIN_ROW;

  // Add new head to the front and remove the last tail segment
  snake.unshift(head);
  snake.pop();

  // Clear the board
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw subtle guide lines marking the playable area
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)';
  ctx.strokeRect(0, MIN_ROW * GRID_SIZE, canvas.width, (MAX_ROW - MIN_ROW + 1) * GRID_SIZE);

  // Draw from tail to head so the head always overlaps the body cleanly
  for (let i = snake.length - 1; i >= 0; i--) {
    const segment = snake[i];
    let sprite = SNAKE_SPRITES.body;
    let angle = 0;

    if (i === 0) {
      // Head segment
      sprite = SNAKE_SPRITES.head;
      angle = getAngleFromVector(direction.x, direction.y);
    } else if (i === snake.length - 1) {
      // Tail tip (points toward the segment directly in front of it)
      sprite = SNAKE_SPRITES.tail;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    } else if (i === snake.length - 2 && snake.length > 3) {
      // Narrow segment right before the tail tip
      sprite = SNAKE_SPRITES.narrow;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    } else {
      // Middle body segments
      sprite = SNAKE_SPRITES.body;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    }

    drawRotatedSprite(ctx, sprite, segment.x, segment.y, angle);
  }
}

// Listen for arrow keys to change the snake's direction (preventing 180-degree turns)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  if (e.key === 'ArrowDown' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  if (e.key === 'ArrowLeft' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  if (e.key === 'ArrowRight' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});
// ==========================================
// 10. SAFE LOADING OF THE FONTS
// ==========================================
// Explicitly load both fonts: GamePaused is only used in hidden elements,
// so the browser would not download it on its own.
// .finally(): the game starts even if a font fails to load.
Promise.all([
  document.fonts.load('32px CSGoals'),
  document.fonts.load('22px GamePaused')
]).finally(() => {
  centerTitleOnCanvas();   // title measurements are now correct
  animateTitle();          // start the bouncing
  setupFirstClick();       // the click is only active from this point on
});
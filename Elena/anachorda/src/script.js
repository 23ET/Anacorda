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

// Play screen elements
const levelInfo = document.getElementById('levelInfo');
const levelVal = document.getElementById('levelVal');
const levelKey = document.getElementById('levelKey');
const scoreVal = document.getElementById('scoreVal');

// ==========================================
// 2. STATE AND MOTION VARIABLES
// ==========================================
let posX = 0;          // current horizontal position of the title
let posY = 0;          // current vertical position of the title

let vx = 2.5;          // horizontal speed (pixels per frame)
let vy = 1.8;          // vertical speed (pixels per frame)

let bouncing = true;   // true while the title is still bouncing

// ==========================================
// 3. INITIAL CENTERING OF THE TITLE ON THE CANVAS
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
// 4. ANIMATION: THE TITLE BOUNCES OFF THE CANVAS BORDERS
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
// 5. CLICK ANYWHERE ON THE PAGE
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
// 6. MENU BUTTONS AND TRANSITIONS
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
// 7. COUNTDOWN AND STARTING THE GAME
// ==========================================

// Steps shown one after the other, and how long each one lasts
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_DURATION = 800;   // milliseconds per step

// Each mode has the same color as its menu button
const MODE_COLORS = {
  'Scale Mode': '#00ffaa',     // green  (.btn-green)
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
function startGame(modeName) {
  modeMenu.classList.add('hidden');       // close the mode menu
  staticHeader.classList.add('hidden');   // header and score stay hidden during the countdown

  // Countdown first, then the play screen appears
  startCountdown(modeName, () => initGame(modeName));
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
// 8. SAFE LOADING OF THE FONTS
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
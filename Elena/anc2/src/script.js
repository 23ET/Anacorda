// ==========================================
// 1. SELECTING DOM ELEMENTS
// ==========================================
const title = document.getElementById("gameTitle"); // big bouncing title
const staticHeader = document.getElementById("staticHeader"); // fixed header shown in the menus
const canvas = document.getElementById("snakeBoard"); // game area
const scoreContainer = document.getElementById("scoreContainer");

// Menu screens
const mainMenu = document.getElementById("mainMenu");
const modeMenu = document.getElementById("modeMenu");

// Main menu buttons
const btnStart = document.getElementById("btnStart");
const btnHighScore = document.getElementById("btnHighScore");

// Mode menu buttons and back button
const btnScale = document.getElementById("btnScale");
const btnHarmony = document.getElementById("btnHarmony");
const btnPractice = document.getElementById("btnPractice");
const btnBack = document.getElementById("btnBack");

// screen with arrows
const controlsScreen = document.getElementById("controlsScreen");

// Play screen elements
const levelInfo = document.getElementById("levelInfo");
const levelVal = document.getElementById("levelVal");
const levelKey = document.getElementById("levelKey");
const scoreVal = document.getElementById("scoreVal");

// ==========================================
// 2. LOADING THE SNAKE IMAGES (resilient version)
// ==========================================

/* EMBEDDED_SPRITES is declared in sprite.js (loaded BEFORE this file in index.html).
   It must NOT be declared again here. If sprite.js is missing, we use empty strings
   and the game falls back to GitHub downloads and then to the built-in drawing. */
const SPRITES_SRC =
  typeof EMBEDDED_SPRITES !== "undefined"
    ? EMBEDDED_SPRITES
    : { head: "", body: "", tail: "" };

// Remote backups, tried in order if the embedded image is missing or broken
const SPRITE_BASE_URLS = [
  "https://cdn.jsdelivr.net/gh/23ET/Anacorda@main/snakee",
  "https://raw.githubusercontent.com/23ET/Anacorda/main/snakee",
  "https://github.com/23ET/Anacorda/raw/main/snakee"
];

const SPRITE_FILES = {
  head: "head_anachorda2.jpg",
  body: "body_anachorda2.jpg",
  tail: "tail_anachorda2.jpg"
};

/* The game engine assumes all sprites face RIGHT at 0 degrees.
   Set to true if the original artwork faces LEFT, false if it already faces right. */
const FLIP_SPRITES = true;

const REMOVE_BG = { head: true, body: true, tail: true };
const CROP_ONLY = { head: false, body: false, tail: false };
const SPRITE_SIZE = 40;
const LOAD_TIMEOUT = 8000; // ms to wait for each remote download

/* ---------- Procedural fallback sprites (always available, no files needed) ---------- */
function makeFallbackSprite(part) {
  const S = SPRITE_SIZE;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  const RED = "#c8102e",
    DARK = "#111",
    BLUE = "#2a6fdb",
    LIGHT = "#bfe0ff";

  if (part === "body") {
    g.fillStyle = RED;
    g.fillRect(0, 0, S, S);
    g.fillStyle = BLUE;
    g.fillRect(0, 7, S, S - 14);
    g.fillStyle = LIGHT;
    for (let x = 3; x < S; x += 8) g.fillRect(x, 7, 3, S - 14);
    g.fillStyle = DARK;
    g.fillRect(0, 0, S, 2);
    g.fillRect(0, S - 2, S, 2);
  } else if (part === "head") {
    g.fillStyle = RED;
    g.strokeStyle = DARK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 2);
    g.lineTo(S - 16, 2);
    g.arc(S - 16, S / 2, S / 2 - 2, -Math.PI / 2, Math.PI / 2);
    g.lineTo(0, S - 2);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#fff";
    [8, 16].forEach((x) => {
      g.fillRect(x, 8, 4, 6);
      g.fillRect(x, S - 14, 4, 6);
    });
    g.beginPath();
    g.arc(S - 14, 13, 4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = DARK;
    g.beginPath();
    g.arc(S - 13, 13, 2, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = RED;
    g.strokeStyle = DARK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 3);
    g.lineTo(S - 10, 12);
    g.lineTo(S - 10, S - 12);
    g.lineTo(0, S - 3);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#888";
    g.fillRect(S - 10, 14, 10, S - 28);
  }
  return c;
}

/* Sprites start as procedural drawings, so the green square never appears.
   When a real image is ready, it replaces the drawing. */
const SNAKE_SPRITES = {
  head: makeFallbackSprite("head"),
  body: makeFallbackSprite("body"),
  narrow: null,
  tail: makeFallbackSprite("tail")
};
SNAKE_SPRITES.narrow = SNAKE_SPRITES.body;

/* ---------- Pixel processing ---------- */

// Makes the outer light/neutral background transparent (flood-fill from the 4 corners)
function removeBackground(img, maxColorDiff = 10, minBrightness = 130) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);

  const imageData = g.getImageData(0, 0, c.width, c.height);
  const px = imageData.data;
  const W = c.width;
  const H = c.height;

  const isBg = (i) => {
    if (px[i + 3] < 10) return true; // already transparent
    const r = px[i],
      gr = px[i + 1],
      b = px[i + 2];
    const max = Math.max(r, gr, b);
    const min = Math.min(r, gr, b);
    return max - min < maxColorDiff && min > minBrightness;
  };

  const visited = new Uint8Array(W * H);
  const stack = [0, W - 1, (H - 1) * W, H * W - 1];

  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    if (!isBg(i)) continue;
    px[i + 3] = 0;
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }

  g.putImageData(imageData, 0, 0);
  return c;
}

// Crops transparent margins and leftover checkerboard residue
function trimTransparent(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const rowCounts = new Uint16Array(h);
  const colCounts = new Uint16Array(w);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] <= 20) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isCheckerboardResidue = max - min < 25 && min >= 125;
      if (!isCheckerboardResidue) {
        rowCounts[y]++;
        colCounts[x]++;
      }
    }
  }

  const minPixels = 3;
  let minX = 0,
    maxX = w - 1,
    minY = 0,
    maxY = h - 1;
  while (minX < maxX && colCounts[minX] < minPixels) minX++;
  while (maxX > minX && colCounts[maxX] < minPixels) maxX--;
  while (minY < maxY && rowCounts[minY] < minPixels) minY++;
  while (maxY > minY && rowCounts[maxY] < minPixels) maxY--;

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed
    .getContext("2d")
    .drawImage(
      canvas,
      minX,
      minY,
      trimmed.width,
      trimmed.height,
      0,
      0,
      trimmed.width,
      trimmed.height
    );
  return trimmed;
}

function imageToCanvas(img) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d").drawImage(img, 0, 0);
  return c;
}

// Draws any source (image or canvas) into the final 40x40 square, flipped if needed
function toFinalSprite(source) {
  const c = document.createElement("canvas");
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  if (FLIP_SPRITES) {
    g.translate(SPRITE_SIZE, 0);
    g.scale(-1, 1);
  }
  g.drawImage(source, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

// Sanity check: at least 15% of the pixels must be visible
function looksValid(c) {
  try {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let opaque = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) opaque++;
    return opaque / (d.length / 4) > 0.15;
  } catch (e) {
    return true;
  }
}

// Full processing: remove background + crop + resize
function buildSprite(img, removeBg, cropOnly) {
  let source = img;
  if (cropOnly) source = trimTransparent(imageToCanvas(img));
  else if (removeBg) source = trimTransparent(removeBackground(img));

  const result = toFinalSprite(source);
  if (!looksValid(result)) throw new Error("processed sprite is empty");
  return result;
}

/* ---------- Loading with fallbacks ----------
   Order: 1) embedded base64 (sprite.js)  2) remote with CORS  3) remote without CORS
   If everything fails, the procedural drawing stays in place. */
function loadSnakePart(part) {
  const sources = [];

  if (SPRITES_SRC[part]) {
    sources.push({ url: SPRITES_SRC[part], cors: false, process: true });
  }
  SPRITE_BASE_URLS.forEach((b) =>
    sources.push({ url: `${b}/${SPRITE_FILES[part]}`, cors: true, process: true })
  );
  SPRITE_BASE_URLS.forEach((b) =>
    sources.push({ url: `${b}/${SPRITE_FILES[part]}`, cors: false, process: false })
  );

  const apply = (c) => {
    SNAKE_SPRITES[part] = c;
    if (part === "body") SNAKE_SPRITES.narrow = c;
  };

  const tryNext = (i) => {
    if (i >= sources.length) {
      console.warn(`${part}: all sources failed, using the built-in drawing.`);
      return;
    }
    const s = sources[i];
    const img = new Image();
    let finished = false;

    const fail = (why) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      console.warn(`${part}: ${why} ->`, s.url.slice(0, 70));
      tryNext(i + 1);
    };

    const timer = setTimeout(() => fail("timeout"), LOAD_TIMEOUT);

    img.onload = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        if (img.naturalWidth === 0) throw new Error("empty image");
        const sprite = s.process
          ? buildSprite(img, REMOVE_BG[part], CROP_ONLY[part])
          : toFinalSprite(img);
        apply(sprite);
        console.log(`${part} OK from`, s.url.slice(0, 50), s.process ? "(processed)" : "(raw)");
      } catch (err) {
        console.warn(`${part}: processing failed, trying raw image.`, err);
        try {
          apply(toFinalSprite(img));
        } catch (err2) {
          tryNext(i + 1);
        }
      }
    };
    img.onerror = () => fail("load error");

    if (s.cors) img.crossOrigin = "anonymous";
    img.src = s.url;
  };

  tryNext(0);
}

loadSnakePart("head");
loadSnakePart("body");
loadSnakePart("tail");

// ==========================================
// 3. STATE AND MOTION VARIABLES
// ==========================================
let posX = 0; // current horizontal position of the title
let posY = 0; // current vertical position of the title

let vx = 2.5; // horizontal speed (pixels per frame)
let vy = 1.8; // vertical speed (pixels per frame)

let bouncing = true; // true while the title is still bouncing

// ==========================================
// 4. INITIAL CENTERING OF THE TITLE ON THE CANVAS
// ==========================================
function centerTitleOnCanvas() {
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const titleWidth = title.offsetWidth;
  const titleHeight = title.offsetHeight;

  posX = (canvasWidth - titleWidth) / 2;
  posY = (canvasHeight - titleHeight) / 2;

  title.style.left = `${posX}px`;
  title.style.top = `${posY}px`;
}

// ==========================================
// 5. ANIMATION: THE TITLE BOUNCES OFF THE CANVAS BORDERS
// ==========================================
function animateTitle() {
  if (!bouncing) return;

  const titleWidth = title.offsetWidth;
  const titleHeight = title.offsetHeight;
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;

  const borderWidth = 4; // canvas border thickness (same as in the CSS)

  const minX = borderWidth;
  const maxX = canvasWidth - titleWidth - borderWidth;
  const minY = borderWidth;
  const maxY = canvasHeight - titleHeight - borderWidth;

  if (posX >= maxX) {
    posX = maxX;
    vx = -Math.abs(vx);
  } else if (posX <= minX) {
    posX = minX;
    vx = Math.abs(vx);
  }

  if (posY >= maxY) {
    posY = maxY;
    vy = -Math.abs(vy);
  } else if (posY <= minY) {
    posY = minY;
    vy = Math.abs(vy);
  }

  posX += vx;
  posY += vy;
  title.style.left = `${posX}px`;
  title.style.top = `${posY}px`;

  requestAnimationFrame(animateTitle);
}

// ==========================================
// 6. CLICK ANYWHERE ON THE PAGE
// ==========================================
function setupFirstClick() {
  document.addEventListener(
    "click",
    () => {
      bouncing = false;
      document.body.style.cursor = "default";

      title.classList.add("pixel-dissolve");

      title.addEventListener(
        "animationend",
        () => {
          title.classList.add("hidden");
          staticHeader.classList.remove("hidden");
          mainMenu.classList.remove("hidden");
        },
        { once: true }
      );
    },
    { once: true }
  );
}

// ==========================================
// 7. MENU BUTTONS AND TRANSITIONS
// ==========================================
btnStart.addEventListener("click", (e) => {
  e.stopPropagation();
  mainMenu.classList.add("hidden");
  modeMenu.classList.remove("hidden");
});

btnHighScore.addEventListener("click", (e) => {
  e.stopPropagation();
  alert("High Score section coming soon!");
});

btnBack.addEventListener("click", (e) => {
  e.stopPropagation();
  modeMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
});

btnScale.addEventListener("click", (e) => {
  e.stopPropagation();
  startGame("Scale Mode");
});

btnHarmony.addEventListener("click", (e) => {
  e.stopPropagation();
  startGame("Harmony Mode");
});

btnPractice.addEventListener("click", (e) => {
  e.stopPropagation();
  startGame("Practice Mode");
});

// ==========================================
// 8. COUNTDOWN AND STARTING THE GAME
// ==========================================
const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"];
const STEP_DURATION = 800; // milliseconds per step
const CONTROLS_DURATION = 3000; // how long the arrows remain visible

const MODE_COLORS = {
  "Scale Mode": "#39FF14",
  "Harmony Mode": "#ff0055",
  "Practice Mode": "#ffffff"
};

function startCountdown(modeName, onFinish) {
  const ctx = canvas.getContext("2d");
  let stepIndex = 0;
  let stepStart = null;

  const modeColor = MODE_COLORS[modeName] || "#00ffcc";

  function drawStep(timestamp) {
    if (stepStart === null) stepStart = timestamp;

    const progress = Math.min((timestamp - stepStart) / STEP_DURATION, 1);

    ctx.save();

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "yellow";
    ctx.font = "32px GamePaused, monospace";
    ctx.fillText("READY?", canvas.width / 2, 50);

    ctx.fillStyle = modeColor;
    ctx.font = "22px GamePaused, monospace";
    ctx.fillText(modeName.toUpperCase(), canvas.width / 2, 95);

    const text = COUNTDOWN_STEPS[stepIndex];
    const fontSize = 120 - 40 * progress;
    ctx.globalAlpha = 1 - 0.7 * progress;
    ctx.fillStyle = "yellow";
    ctx.font = `${fontSize}px CSGoals, monospace`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 30);

    ctx.restore();

    if (progress >= 1) {
      stepIndex++;
      stepStart = null;
      if (stepIndex >= COUNTDOWN_STEPS.length) {
        onFinish();
        return;
      }
    }

    requestAnimationFrame(drawStep);
  }

  requestAnimationFrame(drawStep);
}

// Current level and score
let level = 1;
let score = 0;

function setLevel(newLevel, key) {
  level = newLevel;
  levelVal.textContent = level;
  levelKey.textContent = key;
}

function setScore(newScore) {
  score = newScore;
  scoreVal.textContent = score;
}

// Called when the player picks a game mode
function startGame(modeName) {
  modeMenu.classList.add("hidden");
  staticHeader.classList.add("hidden");
  controlsScreen.classList.remove("hidden");

  setTimeout(() => {
    controlsScreen.classList.add("hidden");
    startCountdown(modeName, () => initGame(modeName));
  }, CONTROLS_DURATION);
}

// ==========================================
// 9. SNAKE GAME ENGINE & SPRITE RENDERING
// ==========================================
const GRID_SIZE = 20; // each grid cell is 20x20px (400 / 20 = 20 columns)
const MIN_ROW = 5; // top header takes rows 0-4
const MAX_ROW = 16; // bottom score takes rows 17-19

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let gameLoopId = null;

// Extra pixels each sprite is stretched along the movement direction (hides gaps).
// Gaps still visible -> increase (8, 10). Pieces look squashed -> decrease (3, 4).
const SPRITE_OVERLAP = 6;

// Draws a sprite (Image or canvas) centered on the grid cell, rotated in the movement direction
function drawRotatedSprite(ctx, img, gridX, gridY, angleDeg) {
  const x = gridX * GRID_SIZE;
  const y = gridY * GRID_SIZE;

  const ready =
    img &&
    (img instanceof HTMLCanvasElement ||
      (img.complete && img.naturalWidth > 0));

  if (!ready) {
    ctx.fillStyle = "#39FF14";
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    return;
  }

  const w = GRID_SIZE + SPRITE_OVERLAP;
  const h = GRID_SIZE;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function getAngleFromVector(dx, dy) {
  if (dx === 1) return 0; // Right
  if (dy === 1) return 90; // Down
  if (dx === -1) return 180; // Left
  if (dy === -1) return -90; // Up
  return 0;
}

// Initializes the play screen, resets the snake and starts the game loop
function initGame(modeName = "Standard") {
  staticHeader.classList.remove("hidden");
  levelInfo.classList.remove("hidden");
  scoreContainer.classList.remove("hidden");

  setLevel(1, "Gm");
  setScore(0);

  snake = [
    { x: 10, y: 10 }, // Head
    { x: 9, y: 10 }, // Body
    { x: 8, y: 10 } // Tail
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(updateAndDraw, 150);
}

// Main game loop: updates snake coordinates and redraws the canvas
function updateAndDraw() {
  const ctx = canvas.getContext("2d");
  direction = nextDirection;

  const head = {
    x: (snake[0].x + direction.x + 20) % 20,
    y: snake[0].y + direction.y
  };

  if (head.y < MIN_ROW) head.y = MAX_ROW;
  if (head.y > MAX_ROW) head.y = MIN_ROW;

  snake.unshift(head);
  snake.pop();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 255, 204, 0.15)";
  ctx.strokeRect(
    0,
    MIN_ROW * GRID_SIZE,
    canvas.width,
    (MAX_ROW - MIN_ROW + 1) * GRID_SIZE
  );

  // Draw from tail to head so the head always overlaps the body cleanly
  for (let i = snake.length - 1; i >= 0; i--) {
    const segment = snake[i];
    let sprite = SNAKE_SPRITES.body;
    let angle = 0;

    if (i === 0) {
      sprite = SNAKE_SPRITES.head;
      angle = getAngleFromVector(direction.x, direction.y);
    } else if (i === snake.length - 1) {
      sprite = SNAKE_SPRITES.tail;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    } else if (i === snake.length - 2 && snake.length > 3) {
      sprite = SNAKE_SPRITES.narrow;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    } else {
      sprite = SNAKE_SPRITES.body;
      const prev = snake[i - 1];
      angle = getAngleFromVector(prev.x - segment.x, prev.y - segment.y);
    }

    drawRotatedSprite(ctx, sprite, segment.x, segment.y, angle);
  }
}

// Arrow keys change the snake's direction (no 180-degree turns)
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

// ==========================================
// 10. SAFE LOADING OF THE FONTS
// ==========================================
Promise.all([
  document.fonts.load("32px CSGoals"),
  document.fonts.load("22px GamePaused")
]).finally(() => {
  centerTitleOnCanvas();
  animateTitle();
  setupFirstClick();
});
// Configuration

const W = 2;		// cell size (pixels)
const WIDE = 1920;	// canvas width
const TALL = 1080;	// canvas height
const COLS = 4;		// WARNING - will break if WIDE % COLS != 0
const ROWS = 1;		// WARNING - will break if TALL % ROWS != 0
const QUAD_W = WIDE / COLS;
const QUAD_H = TALL / ROWS;
const N = QUAD_W / W;	// number of cells per row in each quadrant

// States

let cells = [];		// cells[q][i] – q = quadrant index, i = cell index
let rules = [];		// rules[q][neighbourhood] – 32 entries per quadrant
let t = [];		// current row (local y) for each quadrant
let finished = [];	// true when a quadrant has filled its height
let canvas;

// Setup canvas

function setup() {
  pixelDensity(1);  // Naaaah, anything more than 1 absolutely breaks the download img option.
  canvas = createCanvas(WIDE, TALL);
  
  // Gets the canvas reference and override p5's inline style (so mobile users could save images).
  canvas.elt.style.touchAction = 'manipulation';
  
  background(127);
  strokeWeight(1);

  const totalQuads = COLS * ROWS;

  for (let q = 0; q < totalQuads; q++) {
    // 1. Random initial row
    let row = [];
    for (let i = 0; i < N; i++) {
      row[i] = floor(random(2));
    }
    cells[q] = row;

    // 2. Random 5‑neighbour rule (2^32 possibilities)
    let ruleNum = floor(random(pow(2, pow(2, 5))));
    let ruleArr = [];
    for (let i = 0; i < 32; i++) {
      ruleArr[i] = ruleNum % 2;
      ruleNum = floor(ruleNum / 2);
    }
    rules[q] = ruleArr;

    // 3. Start at the top of this quadrant
    t[q] = 0;
    finished[q] = false;
  }
}

// Draw

function draw() {
  strokeWeight(1);

  const totalQuads = COLS * ROWS;

  // Process each quadrant

  for (let q = 0; q < totalQuads; q++) {
    if (finished[q]) continue;

    const row = floor(q / COLS);
    const col = q % COLS;
    const offsetX = col * QUAD_W;
    const offsetY = row * QUAD_H;
    const localT = t[q];

    // Draw the current row

    for (let i = 0; i < N; i++) {
      const x = offsetX + i * W;
      const y = offsetY + localT;
      const val = cells[q][i];
      const brightness = 255 - val * 255;	// white=1, black=0
      stroke(brightness);
      fill(brightness);
      square(x, y, W);
    }

    // Compute the next row (radius 2)

    let nextRow = [];
    for (let i = 0; i < N; i++) {
      const a = cells[q][(N + i - 2) % N];
      const b = cells[q][(N + i - 1) % N];
      const c = cells[q][i];
      const d = cells[q][(N + i + 1) % N];
      const e = cells[q][(N + i + 2) % N];
      const idx = a * 16 + b * 8 + c * 4 + d * 2 + e;
      nextRow[i] = rules[q][idx];
    }

    // Optional mutation (keeps things from total monotony)

    nextRow[floor(random(nextRow.length))] = floor(random(2));

    cells[q] = nextRow;
    t[q] = localT + W;

    if (t[q] >= QUAD_H) {
      finished[q] = true;
    }
  }

  // Draw grid lines between quadrants (unused because it is a special case for 4 quadrants)
  
  /*
  stroke(0);
  strokeWeight(W * 2);
  line(QUAD_W, 0, QUAD_W, TALL);	// middle vertical
  line(0, QUAD_H, WIDE, QUAD_H);	// middle horizontal
  */

  // Stop the loop once all quadrants are full
  
  let allDone = true;
  for (let q = 0; q < totalQuads; q++) {
    if (!finished[q]) allDone = false;
  }
  if (allDone) {
    // Swapping canvas with a static image
    let img = document.createElement('img');
    img.src = canvas.elt.toDataURL('image/png');

    // Displays at the original logical size (so it fits the screen perfectly)
    img.style.width = WIDE + 'px';
    img.style.height = TALL + 'px';

    // Visual styling
    img.style.border = '2px solid #444';
    img.style.borderRadius = '4px';
    img.style.display = 'block';

    // Native save menu
    img.style.webkitTouchCallout = 'default';
    img.style.userSelect = 'auto';
    img.style.touchAction = 'manipulation';

    // This should reduce the blurring.
    img.style.imageRendering = 'pixelated';          // Chrome / Edge / Firefox
    img.style.imageRendering = 'crisp-edges';        // Fallback for older browsers
    img.style.msInterpolationMode = 'nearest-neighbor'; // Legacy IE

    // Replaces the canvas with this image in the DOM
    canvas.elt.parentNode.replaceChild(img, canvas.elt);
    noLoop();
  }
}

// This function should stop p5 from blocking the touch event

function touchStarted() {
  return true;  // Do not call preventDefault()
}

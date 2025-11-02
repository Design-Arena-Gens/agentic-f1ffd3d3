let pyodide = null;
let ready = false;

const maskedEl = document.getElementById('masked-word');
const remainingEl = document.getElementById('remaining');
const wrongEl = document.getElementById('wrong-letters');
const messageEl = document.getElementById('message');
const keyboardEl = document.getElementById('keyboard');
const newGameBtn = document.getElementById('new-game');

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function renderKeyboard(state) {
  keyboardEl.innerHTML = '';
  for (const letter of LETTERS) {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    const lower = letter.toLowerCase();
    const isCorrect = state.guessed?.includes(lower);
    const isWrong = state.wrong?.includes(lower);
    if (isCorrect) btn.classList.add('correct');
    if (isWrong) btn.classList.add('wrong');
    if (isCorrect || isWrong || state.status !== 'playing') btn.disabled = true;
    btn.addEventListener('click', () => onGuess(letter));
    keyboardEl.appendChild(btn);
  }
}

function updateUI(state) {
  maskedEl.textContent = state.masked || '';
  remainingEl.textContent = state.remaining?.toString() ?? '';
  wrongEl.textContent = (state.wrong || []).join(' ').toUpperCase();
  if (state.status === 'won') {
    messageEl.textContent = 'You won! ??';
  } else if (state.status === 'lost') {
    messageEl.textContent = `You lost. The word was "${state.secret?.toUpperCase()}".`;
  } else {
    messageEl.textContent = '';
  }
  renderKeyboard(state);
}

async function ensureReady() {
  if (ready && pyodide) return;
  maskedEl.textContent = 'Loading Python runtime...';
  pyodide = await loadPyodide();
  const code = await fetch('assets/hangman.py').then(r => r.text());
  await pyodide.runPythonAsync(code);
  ready = true;
}

async function fetchState() {
  const stateJson = await pyodide.runPythonAsync('py_state()');
  return JSON.parse(stateJson);
}

async function newGame() {
  await ensureReady();
  const stateJson = await pyodide.runPythonAsync('py_new_game()');
  const state = JSON.parse(stateJson);
  updateUI(state);
}

async function onGuess(letter) {
  await ensureReady();
  const safe = letter.toLowerCase().slice(0, 1);
  const stateJson = await pyodide.runPythonAsync(`py_guess("${safe}")`);
  updateUI(JSON.parse(stateJson));
}

window.addEventListener('keydown', async (e) => {
  const key = e.key || '';
  if (/^[a-zA-Z]$/.test(key)) {
    e.preventDefault();
    onGuess(key);
  }
});

newGameBtn.addEventListener('click', newGame);

// Bootstrap
newGame();

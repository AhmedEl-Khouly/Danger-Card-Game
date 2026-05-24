/* ═══════════════════════════════════════════════════════════
   DANGER CARD v2 — GAME SCRIPT
   N+1 cards · bomb-escape · up to 25 players
   Fixes: centered cards, exit game, confirm dialogs, 2-player default
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────
const Audio = (() => {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const play = (fn) => { try { fn(getCtx()); } catch(e) {} };

  const click = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.14, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    o.start(); o.stop(ac.currentTime + 0.12);
  });

  const cardFlip = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(280, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(560, ac.currentTime + 0.06);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.start(); o.stop(ac.currentTime + 0.15);
  });

  const suspense = () => play(ac => {
    [0, 0.28, 0.56, 0.84, 1.12, 1.4].forEach((t, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(75 + i * 14, ac.currentTime + t);
      g.gain.setValueAtTime(0, ac.currentTime + t);
      g.gain.linearRampToValueAtTime(0.07, ac.currentTime + t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.24);
      o.start(ac.currentTime + t);
      o.stop(ac.currentTime + t + 0.28);
    });
  });

  const explosion = () => play(ac => {
    const len = Math.floor(ac.sampleRate * 0.9);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    const src = ac.createBufferSource(), g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 380;
    src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.7, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.9);
    src.start(); src.stop(ac.currentTime + 0.9);
  });

  const phew = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(300, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(560, ac.currentTime + 0.15);
    o.frequency.exponentialRampToValueAtTime(420, ac.currentTime + 0.45);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    o.start(); o.stop(ac.currentTime + 0.55);
  });

  const winner = () => play(ac => {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    const durs  = [0.12, 0.12, 0.12, 0.2, 0.1, 0.12, 0.4];
    let t = ac.currentTime;
    notes.forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
      o.start(t); o.stop(t + durs[i]);
      t += durs[i] + 0.02;
    });
  });

  const select = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(420, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(680, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.11, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    o.start(); o.stop(ac.currentTime + 0.18);
  });

  return { click, cardFlip, suspense, explosion, phew, winner, select };
})();

// ─── PARTICLE BACKGROUND ──────────────────────────────────────────────────────
const BgParticles = (() => {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const N = 55;
  const rand = (a, b) => a + Math.random() * (b - a);

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

  const init = () => {
    resize();
    particles = Array.from({ length: N }, () => ({
      x: rand(0, canvas.width), y: rand(0, canvas.height),
      r: rand(0.5, 2.2), vx: rand(-0.12, 0.12), vy: rand(-0.18, -0.04),
      alpha: rand(0.08, 0.45), color: Math.random() > 0.72 ? '#ff2d55' : '#00f5ff',
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5)              { p.y = canvas.height + 5; p.x = rand(0, canvas.width); }
      if (p.x < -5)                p.x = canvas.width + 5;
      if (p.x > canvas.width + 5)  p.x = -5;
      ctx.save();
      ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(tick);
  };

  window.addEventListener('resize', resize);
  init(); tick();
})();

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
const Confetti = (() => {
  let canvas, ctx, pieces = [], running = false, raf = null;
  const colors = ['#00f5ff','#ff2d55','#ffd60a','#30d158','#bf5af2','#ff6b00'];

  const start = () => {
    canvas = document.getElementById('confettiCanvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    pieces = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 120,
      w: 5 + Math.random() * 9, h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 3.5, vy: 2 + Math.random() * 3.2,
      vr: (Math.random() - 0.5) * 0.14,
    }));
    running = true; tick();
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const tick = () => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.y > canvas.height * 0.8
        ? Math.max(0, 1 - (p.y - canvas.height * 0.8) / (canvas.height * 0.2)) : 1;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
    }
    raf = requestAnimationFrame(tick);
  };

  return { start, stop };
})();

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
const Store = {
  GAME_KEY:    'dangercard_v2_game',
  HISTORY_KEY: 'dangercard_v2_history',
  saveGame(s)  { try { localStorage.setItem(this.GAME_KEY, JSON.stringify(s)); } catch(e){} },
  loadGame()   { try { return JSON.parse(localStorage.getItem(this.GAME_KEY)); } catch { return null; } },
  clearGame()  { localStorage.removeItem(this.GAME_KEY); },
  getHistory() { try { return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || {}; } catch { return {}; } },
  addWin(name) {
    const h = this.getHistory();
    h[name] = (h[name] || 0) + 1;
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(h));
  },
  clearHistory() { localStorage.removeItem(this.HISTORY_KEY); },
};

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let G = {
  players: [], eliminated: [],
  round: 1, currentTurnIndex: 0,
  cards: [], phase: 'setup',
};

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  start:  $('screen-start'),
  turn:   $('screen-turn'),
  pass:   $('screen-pass'),
  reveal: $('screen-reveal'),
  winner: $('screen-winner'),
};
let currentScreen = 'start';

function showScreen(name) {
  const prev = screens[currentScreen];
  if (prev) {
    prev.classList.remove('active');
    prev.classList.add('exit');
    setTimeout(() => prev.classList.remove('exit'), 550);
  }
  currentScreen = name;
  requestAnimationFrame(() => requestAnimationFrame(() => screens[name].classList.add('active')));
}

function showToast(msg, ms = 2200) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function flashDanger() {
  const f = document.createElement('div');
  f.className = 'danger-flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 750);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
// Generic modal: returns a Promise that resolves true (confirm) or false (cancel)
function showConfirm({ icon = '⚠️', title = 'Are you sure?', msg = '', confirmText = 'Confirm', confirmClass = '' }) {
  return new Promise(resolve => {
    const modal = $('confirmModal');
    $('modalIcon').textContent    = icon;
    $('modalTitle').textContent   = title;
    $('modalMsg').textContent     = msg;
    $('modalConfirm').textContent = confirmText;
    $('modalConfirm').className   = 'btn-modal-confirm' + (confirmClass ? ' ' + confirmClass : '');

    modal.style.display = 'flex';

    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel  = () => { cleanup(); resolve(false); };

    function cleanup() {
      modal.style.display = 'none';
      $('modalConfirm').removeEventListener('click', onConfirm);
      $('modalCancel').removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
    }

    function onBackdrop(e) { if (e.target === modal) onCancel(); }

    $('modalConfirm').addEventListener('click', onConfirm);
    $('modalCancel').addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
  });
}

// ─── EXIT GAME HANDLER ────────────────────────────────────────────────────────
async function handleExitGame() {
  Audio.click();
  const confirmed = await showConfirm({
    icon: '🚪',
    title: 'Exit Current Game?',
    msg: 'The current game will be abandoned and you\'ll return to the main menu. This cannot be undone.',
    confirmText: 'EXIT GAME',
  });
  if (confirmed) {
    Confetti.stop();
    Store.clearGame();
    G = { players: [], eliminated: [], round: 1, currentTurnIndex: 0, cards: [], phase: 'setup' };
    renderLeaderboard();
    showScreen('start');
  }
}

// Wire up all exit buttons
['btnExitTurn', 'btnExitPass', 'btnExitReveal'].forEach(id => {
  const btn = $(id);
  if (btn) btn.addEventListener('click', handleExitGame);
});

// ─── CARD SIZING ──────────────────────────────────────────────────────────────
function updateCardSizeVar(cardCount) {
  const vw = window.innerWidth;
  let w;
  if      (cardCount <= 3)  w = Math.min(140, Math.floor(vw * 0.28));
  else if (cardCount <= 6)  w = Math.min(115, Math.floor(vw * 0.22));
  else if (cardCount <= 10) w = Math.min(98,  Math.floor(vw * 0.18));
  else if (cardCount <= 15) w = Math.min(84,  Math.floor(vw * 0.155));
  else if (cardCount <= 20) w = Math.min(74,  Math.floor(vw * 0.135));
  else                      w = Math.min(66,  Math.floor(vw * 0.12));
  w = Math.max(58, w);
  document.documentElement.style.setProperty('--card-w', w + 'px');
}

// ─── START SCREEN ─────────────────────────────────────────────────────────────
// Default is 2 (minimum) so users start small and increment up as needed
const MIN_PLAYERS = 2, MAX_PLAYERS = 25;
let playerCount = 2;  // ← starts at 2

function updateCountDisplay() {
  $('playerCountDisplay').textContent = playerCount;
  renderNameInputs();
}

function renderNameInputs() {
  const el = $('nameInputs');
  const existing = [...el.querySelectorAll('input')].map(i => i.value.trim());
  el.innerHTML = '';
  el.className = 'name-inputs' + (playerCount <= 6 ? ' few-players' : '');

  for (let i = 0; i < playerCount; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'name-input-wrap';
    const num = document.createElement('span');
    num.className = 'player-num'; num.textContent = i + 1;
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 14;
    inp.placeholder = `Player ${i + 1}`;
    inp.value = existing[i] || '';
    inp.autocomplete = 'off'; inp.spellcheck = false; inp.inputMode = 'text';
    wrap.appendChild(num); wrap.appendChild(inp); el.appendChild(wrap);
  }
}

$('btnDecCount').addEventListener('click', () => {
  if (playerCount > MIN_PLAYERS) { playerCount--; updateCountDisplay(); Audio.click(); }
});
$('btnIncCount').addEventListener('click', () => {
  if (playerCount < MAX_PLAYERS) { playerCount++; updateCountDisplay(); Audio.click(); }
});
updateCountDisplay();

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function renderLeaderboard() {
  const h = Store.getHistory();
  const list = $('leaderboardList');
  const entries = Object.entries(h).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    list.innerHTML = '<p class="lb-empty">No wins yet — play your first game!</p>';
    return;
  }
  list.innerHTML = entries.slice(0, 10).map(([name, wins]) =>
    `<div class="lb-item">
       <span class="lb-name">${escHtml(name)}</span>
       <span class="lb-wins">&#x1F3C6; ${wins} win${wins !== 1 ? 's' : ''}</span>
     </div>`
  ).join('');
}

// Clear history with confirm dialog
$('btnClearHistory').addEventListener('click', async () => {
  const h = Store.getHistory();
  if (!Object.keys(h).length) { showToast('No history to clear'); return; }

  Audio.click();
  const confirmed = await showConfirm({
    icon: '🗑️',
    title: 'Clear Win History?',
    msg: 'All player win records will be permanently deleted. This cannot be undone.',
    confirmText: 'CLEAR ALL',
  });

  if (confirmed) {
    Store.clearHistory();
    renderLeaderboard();
    showToast('Win history cleared');
  }
});

renderLeaderboard();

// ─── START GAME ───────────────────────────────────────────────────────────────
$('btnStart').addEventListener('click', () => {
  const inputs = $('nameInputs').querySelectorAll('input');
  const names  = [...inputs].map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  Audio.click();
  initGame(names);
});

function initGame(names) {
  G = {
    players:          names.map((n, i) => ({ name: n, id: i })),
    eliminated:       [],
    round:            1,
    currentTurnIndex: 0,
    cards:            [],
    phase:            'turn',
  };
  generateRound();
  Store.saveGame(G);
  renderTurnScreen();
  showScreen('turn');
}

// ─── GAME LOGIC ───────────────────────────────────────────────────────────────

/* KEY RULE: N players → N+1 cards. One card always goes untouched. */
function generateRound() {
  const cardCount = G.players.length + 1;
  const dangerIdx = Math.floor(Math.random() * cardCount);

  G.cards = Array.from({ length: cardCount }, (_, i) => ({
    id: i, isDanger: i === dangerIdx,
    selectedBy: null, selectedByName: null,
  }));
  shuffleArray(G.cards);
  G.cards.forEach((c, i) => { c.id = i; });
  G.currentTurnIndex = 0;

  updateCardSizeVar(cardCount);
  const badge = $('cardsInfoBadge');
  if (badge) badge.textContent = `${cardCount} CARDS \u00B7 1 BOMB`;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function currentPlayer()  { return G.players[G.currentTurnIndex]; }
function allSelected()    { return G.cards.filter(c => c.selectedBy !== null).length === G.players.length; }

// ─── TURN SCREEN ──────────────────────────────────────────────────────────────
function renderTurnScreen() {
  const player = currentPlayer();
  $('roundBadge').textContent = `ROUND ${G.round}`;
  $('turnTitle').textContent  = `${player.name}'s Turn`;

  const badge = $('cardsInfoBadge');
  if (badge) badge.textContent = `${G.cards.length} CARDS \u00B7 1 BOMB`;

  $('playersRemaining').innerHTML = G.players.map((p, i) => {
    let cls = 'player-chip';
    if      (i < G.currentTurnIndex)  cls += ' done';
    else if (i === G.currentTurnIndex) cls += ' current';
    else                               cls += ' active';
    return `<div class="${cls}">${escHtml(p.name)}</div>`;
  }).join('');

  renderCards();
  renderProgressDots();
}

function renderCards() {
  const area = $('cardsArea');
  area.innerHTML = '';
  updateCardSizeVar(G.cards.length);
  G.cards.forEach(card => area.appendChild(buildCard(card, false)));
}

function buildCard(card, forReveal) {
  const isSelected = card.selectedBy !== null;
  const wrap = document.createElement('div');
  wrap.className = 'card' + (isSelected ? ' selected disabled' : '');
  if (forReveal && card._isGhost) wrap.classList.add('ghost-card');

  wrap.innerHTML = `
    <div class="card-inner">
      <div class="card-back"><div class="card-pattern"></div></div>
      <div class="card-front ${card.isDanger ? 'danger' : 'safe'}">
        <span class="card-symbol">${card.isDanger ? '&#x1F4A3;' : '&#x1F6E1;&#xFE0F;'}</span>
        <span class="card-label">${card.isDanger ? 'DANGER' : 'SAFE'}</span>
      </div>
    </div>
    <div class="card-lock">&#x1F512;</div>
    ${card.selectedByName ? `<div class="selected-by">${escHtml(card.selectedByName)}</div>` : ''}`;

  if (!isSelected && !forReveal) {
    wrap.addEventListener('click', () => onCardSelect(card.id));
  }
  return wrap;
}

function onCardSelect(cardId) {
  const player = currentPlayer();
  const card   = G.cards[cardId];
  if (card.selectedBy !== null) return;

  Audio.select();
  card.selectedBy     = player.id;
  card.selectedByName = player.name;

  const els = $('cardsArea').querySelectorAll('.card');
  const el  = els[cardId];
  if (el) {
    el.classList.add('selected', 'disabled');
    const lock = el.querySelector('.card-lock');
    if (lock) lock.style.display = 'block';
    if (!el.querySelector('.selected-by')) {
      const sb = document.createElement('div');
      sb.className = 'selected-by'; sb.textContent = player.name;
      el.appendChild(sb);
    }
  }

  G.currentTurnIndex++;
  Store.saveGame(G);

  if (allSelected()) {
    setTimeout(() => {
      Audio.suspense(); G.phase = 'reveal';
      Store.saveGame(G); renderRevealScreen(); showScreen('reveal');
    }, 360);
  } else {
    setTimeout(() => {
      G.phase = 'pass'; Store.saveGame(G); showPassScreen();
    }, 300);
  }
}

function renderProgressDots() {
  const dots  = $('progressDots');
  const total = Math.min(G.players.length, 25);
  dots.innerHTML = Array.from({ length: total }, (_, i) => {
    let cls = 'pdot';
    if      (i < G.currentTurnIndex)  cls += ' done';
    else if (i === G.currentTurnIndex) cls += ' current';
    return `<div class="${cls}"></div>`;
  }).join('');
}

// ─── PASS SCREEN ──────────────────────────────────────────────────────────────
function showPassScreen() {
  const next = currentPlayer();
  $('passNextPlayer').textContent = next.name;
  $('passSubtitle').textContent   = 'Hand the device to the next player';
  showScreen('pass');
}

$('btnReady').addEventListener('click', () => {
  Audio.click(); G.phase = 'turn';
  Store.saveGame(G); renderTurnScreen(); showScreen('turn');
});

// ─── REVEAL SCREEN ────────────────────────────────────────────────────────────
function renderRevealScreen() {
  $('revealRoundBadge').textContent = `ROUND ${G.round}`;
  $('revealTitle').textContent      = 'REVEALING CARDS';
  $('revealResult').style.opacity   = '0';
  $('btnContinue').style.display    = 'none';
  $('explosionRing').style.display  = 'none';
  $('eliminatedMsg').innerHTML      = '';

  // Clean up any previous safe-ring
  const oldRing = $('revealResult').querySelector('.safe-ring');
  if (oldRing) oldRing.remove();

  const area = $('revealCardsArea');
  area.innerHTML = '';
  updateCardSizeVar(G.cards.length);

  const ghostCard = G.cards.find(c => c.selectedBy === null);

  const order = [];
  G.players.forEach(player => {
    const card = G.cards.find(c => c.selectedBy === player.id);
    order.push({ card, player, isGhost: false });
  });
  order.push({ card: ghostCard, player: null, isGhost: true });

  order.forEach(({ card, player, isGhost }) => {
    const wrap = document.createElement('div');
    wrap.className = 'reveal-card-wrap' + (isGhost ? ' ghost-wrap' : '');
    if (!isGhost) wrap.dataset.playerId = player.id;
    wrap.dataset.cardId = card.id;

    const nameEl = document.createElement('div');
    nameEl.className   = 'reveal-player-name';
    nameEl.textContent = isGhost ? '— UNTOUCHED —' : player.name;

    const cardEl = buildCard({ ...card, selectedBy: null, _isGhost: isGhost }, true);

    const elimOverlay = document.createElement('div'); elimOverlay.className = 'elim-overlay';
    const safeOverlay = document.createElement('div'); safeOverlay.className = 'safe-overlay';

    wrap.appendChild(cardEl); wrap.appendChild(elimOverlay);
    wrap.appendChild(safeOverlay); wrap.appendChild(nameEl);
    area.appendChild(wrap);
  });

  // Staggered flip — capped so large games don't drag
  const cardCount = order.length;
  const flipDelay = Math.min(520, Math.max(160, 2400 / cardCount));
  const initDelay = 320;

  area.querySelectorAll('.card').forEach((el, i) => {
    setTimeout(() => { Audio.cardFlip(); el.classList.add('flipped'); }, initDelay + i * flipDelay);
  });

  setTimeout(showRevealResult, initDelay + cardCount * flipDelay + 480);
}

function showRevealResult() {
  const ghostCard    = G.cards.find(c => c.selectedBy === null);
  const bombIsGhost  = ghostCard && ghostCard.isDanger;
  const result       = $('revealResult');
  const msg          = $('eliminatedMsg');
  result.style.transition = 'opacity 0.5s ease';

  if (bombIsGhost) {
    // ══ CASE 1: Bomb was the untouched card — nobody eliminated ══
    $('revealTitle').textContent = 'THE BOMB ESCAPED!';

    $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w => {
      if (parseInt(w.dataset.cardId) === ghostCard.id) w.classList.add('ghost-wrap');
    });

    const safeRing = document.createElement('div');
    safeRing.className = 'safe-ring';
    result.appendChild(safeRing);
    safeRing.style.display = 'block';

    Audio.phew();
    $('screen-reveal').classList.add('safe-bounce');
    setTimeout(() => $('screen-reveal').classList.remove('safe-bounce'), 550);

    msg.innerHTML = `&#x1F60… <span class="safe-msg">Nobody picked the bomb!</span><br>Everyone survives — new round!`;
    result.style.opacity = '1';
    $('continueLabel').textContent = 'NEW ROUND';
    $('btnContinue').style.display = 'flex';
    G.phase = 'same-round-next';
    Store.saveGame(G);

  } else {
    // ══ CASE 2: A player holds the bomb — eliminate them ══
    const dangerCard       = G.cards.find(c => c.isDanger);
    const eliminatedPlayer = G.players.find(p => p.id === dangerCard.selectedBy);

    $('revealTitle').textContent = 'BOOM!';

    $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w => {
      if (!w.classList.contains('ghost-wrap') &&
          parseInt(w.dataset.playerId) === eliminatedPlayer.id) {
        w.classList.add('eliminated');
      }
    });

    $('explosionRing').style.display = 'block';
    flashDanger();
    Audio.explosion();

    $('screen-reveal').classList.add('shake');
    setTimeout(() => $('screen-reveal').classList.remove('shake'), 600);

    msg.innerHTML = `&#x1F4A5; <span class="danger-name">${escHtml(eliminatedPlayer.name)}</span> found the DANGER CARD and is eliminated!`;
    result.style.opacity = '1';

    G.eliminated.push({ ...eliminatedPlayer, round: G.round });
    G.players = G.players.filter(p => p.id !== eliminatedPlayer.id);

    const isGameOver = G.players.length <= 1;
    $('continueLabel').textContent = isGameOver ? 'SEE WINNER' : 'NEXT ROUND';
    $('btnContinue').style.display = 'flex';
    G.phase = isGameOver ? 'winner' : 'eliminated';
    Store.saveGame(G);
  }
}

$('btnContinue').addEventListener('click', () => {
  Audio.click();
  if (G.phase === 'same-round-next') {
    G.round++; G.currentTurnIndex = 0; G.phase = 'turn';
    generateRound(); Store.saveGame(G); renderTurnScreen(); showScreen('turn');
  } else if (G.phase === 'winner' || G.players.length <= 1) {
    showWinner();
  } else {
    nextRound();
  }
});

// ─── NEXT ROUND ───────────────────────────────────────────────────────────────
function nextRound() {
  G.round++; G.currentTurnIndex = 0; G.phase = 'turn';
  generateRound(); Store.saveGame(G); renderTurnScreen(); showScreen('turn');
}

// ─── WINNER ───────────────────────────────────────────────────────────────────
function showWinner() {
  const win = G.players[0];
  $('winnerName').textContent = win.name;
  $('winnerStats').innerHTML  = `
    <div class="stat-box"><span class="stat-val">${G.round}</span><span class="stat-lbl">ROUNDS</span></div>
    <div class="stat-box"><span class="stat-val">${G.eliminated.length}</span><span class="stat-lbl">ELIMINATED</span></div>`;

  Store.addWin(win.name); Store.clearGame(); G.phase = 'winner';
  showScreen('winner'); Audio.winner();
  setTimeout(() => Confetti.start(), 280);
}

$('btnRestart').addEventListener('click', () => {
  Audio.click(); Confetti.stop();
  const allNames = [...G.players, ...G.eliminated].map(p => p.name);
  initGame(allNames);
});

$('btnMainMenu').addEventListener('click', () => {
  Audio.click(); Confetti.stop();
  Store.clearGame(); renderLeaderboard(); showScreen('start');
});

// ─── STATE RESTORE ────────────────────────────────────────────────────────────
function tryRestoreGame() {
  const saved = Store.loadGame();
  if (!saved || !saved.players || !saved.players.length) return false;
  G = saved;
  updateCardSizeVar(G.cards.length || G.players.length + 1);

  switch (G.phase) {
    case 'winner':                                    showWinner();             return true;
    case 'reveal':
    case 'eliminated':
    case 'same-round-next': renderRevealScreen();    showScreen('reveal');     return true;
    case 'pass':            renderTurnScreen();       showPassScreen();         return true;
    case 'turn':            renderTurnScreen();       showScreen('turn');       return true;
  }
  return false;
}

// ─── PREVENT NATIVE BEHAVIORS ─────────────────────────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('dragstart',   e => e.preventDefault());

let lastTap = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTap < 300) e.preventDefault();
  lastTap = now;
}, { passive: false });

// ─── BOOT ─────────────────────────────────────────────────────────────────────
(function boot() {
  renderLeaderboard();
  if (!tryRestoreGame()) showScreen('start');
})();

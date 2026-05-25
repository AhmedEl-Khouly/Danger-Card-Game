/* ═══════════════════════════════════════════════════════════
   DANGER CARD v4 — SCRIPT
   Bug fix: Sudden Death correct reveal logic
   New: Hot Seat, Dare Twist, Lucky Shield, Comeback Crown,
        Round Recap, Taunt messages, Streak tracking
   ═══════════════════════════════════════════════════════════ */
'use strict';

// ─── AUDIO ────────────────────────────────────────────────────────────────────
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
    o.type = 'sine'; o.frequency.setValueAtTime(880, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.14, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    o.start(); o.stop(ac.currentTime + 0.12);
  });

  const cardFlip = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'triangle'; o.frequency.setValueAtTime(280, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(560, ac.currentTime + 0.06);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.start(); o.stop(ac.currentTime + 0.15);
  });

  const suspense = () => play(ac => {
    [0,0.28,0.56,0.84,1.12,1.4].forEach((t,i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(75+i*14, ac.currentTime+t);
      g.gain.setValueAtTime(0, ac.currentTime+t);
      g.gain.linearRampToValueAtTime(0.07, ac.currentTime+t+0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+t+0.24);
      o.start(ac.currentTime+t); o.stop(ac.currentTime+t+0.28);
    });
  });

  const explosion = () => play(ac => {
    const len = Math.floor(ac.sampleRate * 0.9);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      data[i] = (Math.random()*2-1) * Math.pow(1-i/len, 1.8);
    const src = ac.createBufferSource(), g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 380;
    src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.7, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.9);
    src.start(); src.stop(ac.currentTime+0.9);
  });

  const phew = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(300, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(560, ac.currentTime+0.15);
    o.frequency.exponentialRampToValueAtTime(420, ac.currentTime+0.45);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.55);
    o.start(); o.stop(ac.currentTime+0.55);
  });

  const winner = () => play(ac => {
    const notes=[523,659,784,1047,784,1047,1319], durs=[0.12,0.12,0.12,0.2,0.1,0.12,0.4];
    let t = ac.currentTime;
    notes.forEach((freq,i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t+durs[i]);
      o.start(t); o.stop(t+durs[i]); t += durs[i]+0.02;
    });
  });

  const select = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(420, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(680, ac.currentTime+0.1);
    g.gain.setValueAtTime(0.11, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.18);
    o.start(); o.stop(ac.currentTime+0.18);
  });

  const shield = () => play(ac => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'triangle'; o.frequency.setValueAtTime(600, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, ac.currentTime+0.12);
    o.frequency.exponentialRampToValueAtTime(650, ac.currentTime+0.3);
    g.gain.setValueAtTime(0.2, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.4);
    o.start(); o.stop(ac.currentTime+0.4);
  });

  const dare = () => play(ac => {
    [0,0.12,0.24].forEach((t,i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'square'; o.frequency.value = 440 + i*110;
      g.gain.setValueAtTime(0.1, ac.currentTime+t);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+t+0.1);
      o.start(ac.currentTime+t); o.stop(ac.currentTime+t+0.12);
    });
  });

  return { click, cardFlip, suspense, explosion, phew, winner, select, shield, dare };
})();

// ─── PARTICLES ────────────────────────────────────────────────────────────────
const BgParticles = (() => {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const N = 55, rand = (a,b) => a+Math.random()*(b-a);
  const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
  const init = () => {
    resize();
    particles = Array.from({length:N}, () => ({
      x:rand(0,canvas.width), y:rand(0,canvas.height),
      r:rand(0.5,2.2), vx:rand(-0.12,0.12), vy:rand(-0.18,-0.04),
      alpha:rand(0.08,0.45), color:Math.random()>0.72?'#ff2d55':'#00f5ff',
    }));
  };
  const tick = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const p of particles) {
      p.x+=p.vx; p.y+=p.vy;
      if(p.y<-5){p.y=canvas.height+5;p.x=rand(0,canvas.width);}
      if(p.x<-5)p.x=canvas.width+5;
      if(p.x>canvas.width+5)p.x=-5;
      ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
      ctx.shadowColor=p.color; ctx.shadowBlur=5;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    requestAnimationFrame(tick);
  };
  window.addEventListener('resize', resize);
  init(); tick();
})();

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
const Confetti = (() => {
  let canvas, ctx, pieces=[], running=false, raf=null;
  const colors=['#00f5ff','#ff2d55','#ffd60a','#30d158','#bf5af2','#ff6b00'];
  const start = () => {
    canvas=document.getElementById('confettiCanvas');
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    ctx=canvas.getContext('2d');
    pieces=Array.from({length:140},()=>({
      x:Math.random()*canvas.width, y:-20-Math.random()*120,
      w:5+Math.random()*9, h:4+Math.random()*6,
      color:colors[Math.floor(Math.random()*colors.length)],
      rot:Math.random()*Math.PI*2, vx:(Math.random()-0.5)*3.5,
      vy:2+Math.random()*3.2, vr:(Math.random()-0.5)*0.14,
    }));
    running=true; tick();
  };
  const stop = () => { running=false; if(raf)cancelAnimationFrame(raf); if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height); };
  const tick = () => {
    if(!running)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of pieces){
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.color;
      ctx.globalAlpha=p.y>canvas.height*0.8?Math.max(0,1-(p.y-canvas.height*0.8)/(canvas.height*0.2)):1;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      if(p.y>canvas.height+20){p.y=-20;p.x=Math.random()*canvas.width;}
    }
    raf=requestAnimationFrame(tick);
  };
  return {start,stop};
})();

// ─── STORE ────────────────────────────────────────────────────────────────────
const Store = {
  GAME_KEY:    'dangercard_v4_game',
  HISTORY_KEY: 'dangercard_v4_history',
  STATS_KEY:   'dangercard_v4_stats',
  PREFS_KEY:   'dangercard_v4_prefs',
  saveGame(s)   { try{localStorage.setItem(this.GAME_KEY,JSON.stringify(s));}catch(e){} },
  loadGame()    { try{return JSON.parse(localStorage.getItem(this.GAME_KEY));}catch{return null;} },
  clearGame()   { localStorage.removeItem(this.GAME_KEY); },
  getHistory()  { try{return JSON.parse(localStorage.getItem(this.HISTORY_KEY))||{};}catch{return{};} },
  addWin(name)  { const h=this.getHistory(); h[name]=(h[name]||0)+1; localStorage.setItem(this.HISTORY_KEY,JSON.stringify(h)); },
  clearHistory(){ localStorage.removeItem(this.HISTORY_KEY); },
  getStats()    { try{return JSON.parse(localStorage.getItem(this.STATS_KEY))||{games:0,rounds:0,escapes:0};}catch{return{games:0,rounds:0,escapes:0};} },
  saveStats(s)  { localStorage.setItem(this.STATS_KEY,JSON.stringify(s)); },
  getPrefs()    { try{return JSON.parse(localStorage.getItem(this.PREFS_KEY))||{theme:'neon',mode:'classic'};}catch{return{theme:'neon',mode:'classic'};} },
  savePrefs(p)  { localStorage.setItem(this.PREFS_KEY,JSON.stringify(p)); },
};

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let G = {
  players:[], eliminated:[], round:1, currentTurnIndex:0, cards:[],
  phase:'setup', mode:'classic', bombsEscaped:0,
  // new features
  hotSeatPlayerId: null,   // player forced to pick first next round
  shieldHolderId: null,    // player who has the lucky shield this round
  shieldUsed: false,
  playerStreaks: {},        // {id: survivedRoundsInARow}
  roundRecap: [],          // [{round, event, names}]
  dareActive: false,       // is a dare twist pending?
  dareTargetId: null,
};
let prefs = Store.getPrefs();

// ─── GAME MODES ───────────────────────────────────────────────────────────────
const MODES = {
  classic: { label:'Classic', desc:'Standard rules — last player standing wins.', subtitle:'Choose your card wisely…' },
  blitz:   { label:'⚡ Blitz', desc:'5 seconds to pick — hesitate and fate decides!', subtitle:'⚡ PICK FAST!' },
  sudden:  { label:'💀 Sudden', desc:'2 bombs per round — double the danger!', subtitle:'💀 TWO BOMBS IN PLAY!' },
  hotseat: { label:'🔥 Hot Seat', desc:'The loser picks first next round with everyone watching.', subtitle:'🔥 HOT SEAT ROUND!' },
};

// ─── TAUNTS ───────────────────────────────────────────────────────────────────
const TAUNTS_SAFE   = ['You got lucky… this time.','Coward chose wisely.','Safe — but for how long?','Another escape. Another round.','Fortune smiled on you.'];
const TAUNTS_BOMB   = ['The bomb found its target.','Should have trusted your gut.','Boom. No survivors.','The cards never lie.','Your luck just ran out.'];
const TAUNTS_ESCAPE = ['The bomb roams free…','It escaped. It always escapes.','Nobody was brave enough.','The ghost card strikes again!','One bullet left in the chamber.'];
const ROUND_EVENTS  = ['⚡ Lightning round!','🎲 The odds shift…','👁 Something feels different.','🌀 Chaos incoming.','🔮 Trust nothing.'];

function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = { start:$('screen-start'), turn:$('screen-turn'), pass:$('screen-pass'), reveal:$('screen-reveal'), winner:$('screen-winner') };
let currentScreen = 'start';

function showScreen(name) {
  const prev = screens[currentScreen];
  if (prev) { prev.classList.remove('active'); prev.classList.add('exit'); setTimeout(()=>prev.classList.remove('exit'),550); }
  currentScreen = name;
  requestAnimationFrame(()=>requestAnimationFrame(()=>screens[name].classList.add('active')));
}

function showToast(msg, ms=2400) {
  let el=document.querySelector('.toast');
  if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);}
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),ms);
}

function flashDanger() {
  const f=document.createElement('div'); f.className='danger-flash';
  document.body.appendChild(f); setTimeout(()=>f.remove(),750);
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function spawnSparks(count=18) {
  const container=$('explosionSparks');
  container.style.display='block'; container.innerHTML='';
  const colors=['#ff2d55','#ff6b00','#ffd60a','#ff4488'];
  for(let i=0;i<count;i++){
    const s=document.createElement('div'); s.className='spark';
    const angle=(i/count)*360, dist=40+Math.random()*70, rad=angle*Math.PI/180;
    s.style.setProperty('--sx', Math.cos(rad)*dist+'px');
    s.style.setProperty('--sy', Math.sin(rad)*dist+'px');
    s.style.background=colors[Math.floor(Math.random()*colors.length)];
    s.style.animationDelay=(Math.random()*0.2)+'s';
    container.appendChild(s);
  }
  setTimeout(()=>{ container.style.display='none'; container.innerHTML=''; },900);
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function showConfirm({icon='⚠️',title='Are you sure?',msg='',confirmText='Confirm'}) {
  return new Promise(resolve => {
    const modal=$('confirmModal');
    $('modalIcon').textContent=icon; $('modalTitle').textContent=title;
    $('modalMsg').textContent=msg; $('modalConfirm').textContent=confirmText;
    modal.style.display='flex';
    const ok=()=>{cleanup();resolve(true);};
    const no=()=>{cleanup();resolve(false);};
    const bg=(e)=>{if(e.target===modal)no();};
    function cleanup(){modal.style.display='none';$('modalConfirm').removeEventListener('click',ok);$('modalCancel').removeEventListener('click',no);modal.removeEventListener('click',bg);}
    $('modalConfirm').addEventListener('click',ok);
    $('modalCancel').addEventListener('click',no);
    modal.addEventListener('click',bg);
  });
}

// ─── DARE TWIST MODAL ─────────────────────────────────────────────────────────
// Shows a dare card between rounds — winner of last round must complete a dare or forfeit a shield
const DARES = [
  'Do your best villain laugh for 5 seconds.',
  'Reveal who you think will be eliminated next round.',
  'Swap seats with the player on your left.',
  'Say "I\'m not scared" three times without laughing.',
  'Point at the player you trust least — silently.',
  'Confess which card you almost picked instead.',
  'Describe the last dream you remember.',
  'Do 5 push-ups or lose your shield.',
  'Whisper a secret to the player on your right.',
  'Predict the exact elimination order for next round.',
];

function showDareModal(playerName) {
  return new Promise(resolve => {
    const modal=$('dareModal');
    const dare = randomFrom(DARES);
    $('darePlayerName').textContent = playerName;
    $('dareText').textContent = dare;
    modal.style.display='flex';
    Audio.dare();
    const done=()=>{modal.style.display='none'; resolve();};
    $('dareDone').onclick=done;
    $('dareSkip').onclick=done;
  });
}

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
const THEMES = [
  {id:'neon',   label:'NEON',   emoji:'💙'},
  {id:'gold',   label:'GOLD',   emoji:'💛'},
  {id:'purple', label:'VOID',   emoji:'💜'},
  {id:'green',  label:'MATRIX', emoji:'💚'},
  {id:'fire',   label:'FIRE',   emoji:'🔥'},
];

function applyTheme(id) {
  document.body.className = document.body.className.replace(/theme-\w+/g,'').trim();
  document.body.classList.add('theme-'+id);
  prefs.theme=id; Store.savePrefs(prefs);
}

function buildThemeGrid() {
  const grid=$('themeGrid'); grid.innerHTML='';
  THEMES.forEach(t=>{
    const btn=document.createElement('button');
    btn.className='theme-btn'+(prefs.theme===t.id?' active':'');
    btn.innerHTML=`<span>${t.emoji}</span>${t.label}`;
    btn.addEventListener('click',()=>{
      applyTheme(t.id);
      grid.querySelectorAll('.theme-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); Audio.click();
    });
    grid.appendChild(btn);
  });
}

$('btnTheme').addEventListener('click',()=>{ buildThemeGrid(); $('themeModal').style.display='flex'; Audio.click(); });
$('themeClose').addEventListener('click',()=>{ $('themeModal').style.display='none'; Audio.click(); });
$('themeModal').addEventListener('click',e=>{ if(e.target===$('themeModal'))$('themeModal').style.display='none'; });
applyTheme(prefs.theme);

// ─── MODE PILLS ───────────────────────────────────────────────────────────────
document.querySelectorAll('.mode-pill').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode-pill').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const mode=btn.dataset.mode;
    prefs.mode=mode; Store.savePrefs(prefs);
    $('modeDesc').textContent=MODES[mode].desc;
    Audio.click();
  });
  if(btn.dataset.mode===prefs.mode) btn.classList.add('active');
});
$('modeDesc').textContent=MODES[prefs.mode]?.desc||MODES.classic.desc;

// ─── EXIT GAME ────────────────────────────────────────────────────────────────
async function handleExitGame() {
  Audio.click();
  const ok=await showConfirm({icon:'🚪',title:'Exit Game?',msg:'Abandon the current game and return to the main menu.',confirmText:'EXIT'});
  if(ok){
    clearBlitzTimer();
    Confetti.stop();
    Store.clearGame();
    G={players:[],eliminated:[],round:1,currentTurnIndex:0,cards:[],phase:'setup',mode:'classic',bombsEscaped:0,hotSeatPlayerId:null,shieldHolderId:null,shieldUsed:false,playerStreaks:{},roundRecap:[],dareActive:false,dareTargetId:null};
    renderLeaderboard(); updateStatsBar(); showScreen('start');
  }
}
['btnExitTurn','btnExitPass','btnExitReveal'].forEach(id=>{ const b=$(id); if(b)b.addEventListener('click',handleExitGame); });

// ─── CARD SIZING ──────────────────────────────────────────────────────────────
function updateCardSizeVar(n) {
  const vw=window.innerWidth;
  let w;
  if(n<=3)       w=Math.min(140,Math.floor(vw*0.28));
  else if(n<=6)  w=Math.min(115,Math.floor(vw*0.22));
  else if(n<=10) w=Math.min(98,Math.floor(vw*0.18));
  else if(n<=15) w=Math.min(84,Math.floor(vw*0.155));
  else if(n<=20) w=Math.min(74,Math.floor(vw*0.135));
  else           w=Math.min(66,Math.floor(vw*0.12));
  document.documentElement.style.setProperty('--card-w',Math.max(58,w)+'px');
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function updateStatsBar() {
  const s=Store.getStats();
  if(s.games===0){$('statsBar').style.display='none';return;}
  $('statsBar').style.display='flex';
  $('statGamesPlayed').textContent=s.games;
  $('statTotalRounds').textContent=s.rounds;
  $('statBombsEscaped').textContent=s.escapes;
}

// ─── PLAYER INPUTS ────────────────────────────────────────────────────────────
const MIN_PLAYERS=2, MAX_PLAYERS=25;
let playerCount=2;

function updateCountDisplay(){ $('playerCountDisplay').textContent=playerCount; renderNameInputs(); }
function renderNameInputs(){
  const el=$('nameInputs');
  const existing=[...el.querySelectorAll('input')].map(i=>i.value.trim());
  el.innerHTML='';
  el.className='name-inputs'+(playerCount<=6?' few-players':'');
  for(let i=0;i<playerCount;i++){
    const wrap=document.createElement('div'); wrap.className='name-input-wrap';
    const num=document.createElement('span'); num.className='player-num'; num.textContent=i+1;
    const inp=document.createElement('input');
    inp.type='text'; inp.maxLength=14; inp.placeholder=`Player ${i+1}`;
    inp.value=existing[i]||''; inp.autocomplete='off'; inp.spellcheck=false; inp.inputMode='text';
    wrap.appendChild(num); wrap.appendChild(inp); el.appendChild(wrap);
  }
}
$('btnDecCount').addEventListener('click',()=>{ if(playerCount>MIN_PLAYERS){playerCount--;updateCountDisplay();Audio.click();} });
$('btnIncCount').addEventListener('click',()=>{ if(playerCount<MAX_PLAYERS){playerCount++;updateCountDisplay();Audio.click();} });
updateCountDisplay();

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function renderLeaderboard(){
  const h=Store.getHistory(), list=$('leaderboardList');
  const entries=Object.entries(h).sort((a,b)=>b[1]-a[1]);
  const medals=['🥇','🥈','🥉'];
  if(!entries.length){list.innerHTML='<p class="lb-empty">No wins yet — play your first game!</p>';return;}
  list.innerHTML=entries.slice(0,10).map(([name,wins],i)=>`
    <div class="lb-item">
      <span class="lb-rank">${medals[i]||'#'+(i+1)}</span>
      <span class="lb-name">${escHtml(name)}</span>
      <span class="lb-wins">${wins} win${wins!==1?'s':''}</span>
    </div>`).join('');
}

$('btnClearHistory').addEventListener('click',async()=>{
  const h=Store.getHistory();
  if(!Object.keys(h).length){showToast('No history to clear');return;}
  Audio.click();
  const ok=await showConfirm({icon:'🗑️',title:'Clear Win History?',msg:'All win records will be permanently deleted.',confirmText:'CLEAR ALL'});
  if(ok){Store.clearHistory();renderLeaderboard();showToast('Win history cleared');}
});
renderLeaderboard();
updateStatsBar();

// ─── START GAME ───────────────────────────────────────────────────────────────
$('btnStart').addEventListener('click',()=>{
  const inputs=$('nameInputs').querySelectorAll('input');
  const names=[...inputs].map((inp,i)=>inp.value.trim()||`Player ${i+1}`);
  const mode=document.querySelector('.mode-pill.active')?.dataset.mode||'classic';
  Audio.click(); initGame(names,mode);
});

function initGame(names,mode='classic'){
  const streaks={};
  names.forEach((_,i)=>{ streaks[i]=0; });
  G={
    players:names.map((n,i)=>({name:n,id:i})),
    eliminated:[], round:1, currentTurnIndex:0, cards:[],
    phase:'turn', mode, bombsEscaped:0,
    hotSeatPlayerId:null, shieldHolderId:null, shieldUsed:false,
    playerStreaks:streaks, roundRecap:[], dareActive:false, dareTargetId:null,
  };
  generateRound();
  Store.saveGame(G);
  renderTurnScreen();
  showScreen('turn');
}

// ─── BLITZ TIMER ──────────────────────────────────────────────────────────────
let blitzInterval=null, blitzSeconds=0;

function startBlitzTimer(){
  clearBlitzTimer();
  blitzSeconds=5;
  updateTurnSubtitle();
  blitzInterval=setInterval(()=>{
    blitzSeconds--;
    updateTurnSubtitle();
    if(blitzSeconds<=0){
      clearBlitzTimer();
      const avail=G.cards.filter(c=>c.selectedBy===null);
      if(avail.length>0){
        const pick=avail[Math.floor(Math.random()*avail.length)];
        onCardSelect(pick.id);
      }
    }
  },1000);
}
function clearBlitzTimer(){ if(blitzInterval){clearInterval(blitzInterval);blitzInterval=null;} }
function updateTurnSubtitle(){
  const el=$('turnSubtitle'); if(!el)return;
  if(G.mode==='blitz'){ el.textContent=`⚡ PICK NOW — ${blitzSeconds}s remaining!`; el.className='turn-subtitle blitz'; }
  else if(G.mode==='sudden'){ el.textContent='💀 TWO BOMBS IN PLAY — choose wisely!'; el.className='turn-subtitle sudden'; }
  else if(G.mode==='hotseat'&&G.hotSeatPlayerId!==null){
    const hs=G.players.find(p=>p.id===G.hotSeatPlayerId);
    el.textContent=hs?`🔥 ${hs.name} is on the Hot Seat!`:'🔥 HOT SEAT ROUND!';
    el.className='turn-subtitle hotseat';
  }
  else{ el.textContent='Choose your card wisely…'; el.className='turn-subtitle'; }
}

// ─── LUCKY SHIELD ─────────────────────────────────────────────────────────────
// Every N rounds, a random player gets a shield. If they pick the bomb, they survive once.
function assignShieldIfDue(){
  if(G.round % 3 === 0 && G.players.length > 1){
    // Pick a random player who hasn't had it recently
    const idx=Math.floor(Math.random()*G.players.length);
    G.shieldHolderId=G.players[idx].id;
    G.shieldUsed=false;
    showToast(`🛡️ ${G.players[idx].name} received the Lucky Shield!`, 3000);
  }
}

// ─── ROUND GENERATION ─────────────────────────────────────────────────────────
function generateRound(){
  const n=G.players.length;
  const cardCount=n+1;
  // FIXED: In Sudden Death, we always have exactly 2 bombs (or 1 if only 2 players remain)
  const bombCount = G.mode==='sudden' ? (n>=2 ? Math.min(2,n) : 1) : 1;

  // Place bombs at distinct random positions
  const indices=new Set();
  while(indices.size<bombCount) indices.add(Math.floor(Math.random()*cardCount));

  G.cards=Array.from({length:cardCount},(_,i)=>({
    id:i, isDanger:indices.has(i), selectedBy:null, selectedByName:null,
  }));
  shuffleArray(G.cards);
  G.cards.forEach((c,i)=>{c.id=i;});
  G.currentTurnIndex=0;

  // Hot seat: force the hot seat player to go first
  if(G.mode==='hotseat' && G.hotSeatPlayerId!==null){
    const hsIdx=G.players.findIndex(p=>p.id===G.hotSeatPlayerId);
    if(hsIdx>0){
      const tmp=G.players[0]; G.players[0]=G.players[hsIdx]; G.players[hsIdx]=tmp;
    }
  }

  updateCardSizeVar(cardCount);
  const badge=$('cardsInfoBadge');
  if(badge) badge.textContent=`${cardCount} CARDS \u00B7 ${bombCount} BOMB${bombCount>1?'S':''}`;

  assignShieldIfDue();
}

function shuffleArray(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}}
function currentPlayer(){return G.players[G.currentTurnIndex];}
function allSelected(){return G.cards.filter(c=>c.selectedBy!==null).length===G.players.length;}

// ─── TURN SCREEN ──────────────────────────────────────────────────────────────
function renderTurnScreen(){
  clearBlitzTimer();
  const player=currentPlayer();
  $('roundBadge').textContent=`ROUND ${G.round}`;
  $('turnTitle').textContent=`${player.name}'s Turn`;

  const bombCount=G.mode==='sudden'?Math.min(2,G.players.length):1;
  const badge=$('cardsInfoBadge');
  if(badge) badge.textContent=`${G.cards.length} CARDS \u00B7 ${bombCount} BOMB${bombCount>1?'S':''}`;

  // Streak badges for players with streaks ≥ 2
  $('playersRemaining').innerHTML=
    G.players.map((p,i)=>{
      let cls='player-chip';
      if(i<G.currentTurnIndex)cls+=' done';
      else if(i===G.currentTurnIndex)cls+=' current';
      else cls+=' active';
      const streak=(G.playerStreaks[p.id]||0);
      const shieldBadge=G.shieldHolderId===p.id&&!G.shieldUsed?' 🛡️':'';
      const streakBadge=streak>=2?` 🔥${streak}`:'';
      const hsTag=G.mode==='hotseat'&&G.hotSeatPlayerId===p.id?' 🪑':'';
      return `<div class="${cls}">${escHtml(p.name)}${shieldBadge}${streakBadge}${hsTag}</div>`;
    }).join('')+
    G.eliminated.map(p=>`<div class="player-chip elim">${escHtml(p.name)}</div>`).join('');

  renderCards();
  renderProgressDots();
  updateTurnSubtitle();
  if(G.mode==='blitz') startBlitzTimer();
}

function renderCards(){
  const area=$('cardsArea'); area.innerHTML='';
  updateCardSizeVar(G.cards.length);
  G.cards.forEach(card=>area.appendChild(buildCard(card,false)));
}

function buildCard(card,forReveal){
  const isSelected=card.selectedBy!==null;
  const wrap=document.createElement('div');
  wrap.className='card'+(isSelected?' selected disabled':'');
  if(forReveal&&card._isGhost) wrap.classList.add('ghost-card');

  wrap.innerHTML=`
    <div class="card-inner">
      <div class="card-back"><div class="card-pattern"></div></div>
      <div class="card-front ${card.isDanger?'danger':'safe'}">
        <span class="card-symbol">${card.isDanger?'&#x1F4A3;':'&#x1F6E1;&#xFE0F;'}</span>
        <span class="card-label">${card.isDanger?'DANGER':'SAFE'}</span>
      </div>
    </div>
    <div class="card-lock">&#x1F512;</div>
    ${card.selectedByName?`<div class="selected-by">${escHtml(card.selectedByName)}</div>`:''}`;

  if(!isSelected&&!forReveal) wrap.addEventListener('click',()=>onCardSelect(card.id));
  return wrap;
}

function onCardSelect(cardId){
  clearBlitzTimer();
  const player=currentPlayer(), card=G.cards[cardId];
  if(card.selectedBy!==null)return;
  Audio.select();
  card.selectedBy=player.id; card.selectedByName=player.name;

  const el=$('cardsArea').querySelectorAll('.card')[cardId];
  if(el){
    el.classList.add('selected','disabled');
    const lock=el.querySelector('.card-lock'); if(lock)lock.style.display='block';
    if(!el.querySelector('.selected-by')){
      const sb=document.createElement('div'); sb.className='selected-by'; sb.textContent=player.name; el.appendChild(sb);
    }
  }
  G.currentTurnIndex++; Store.saveGame(G);

  if(allSelected()){
    setTimeout(()=>{ Audio.suspense(); G.phase='reveal'; Store.saveGame(G); renderRevealScreen(); showScreen('reveal'); },360);
  } else {
    setTimeout(()=>{ G.phase='pass'; Store.saveGame(G); showPassScreen(); },300);
  }
}

function renderProgressDots(){
  const dots=$('progressDots'), total=Math.min(G.players.length,25);
  dots.innerHTML=Array.from({length:total},(_,i)=>{
    let cls='pdot';
    if(i<G.currentTurnIndex)cls+=' done';
    else if(i===G.currentTurnIndex)cls+=' current';
    return `<div class="${cls}"></div>`;
  }).join('');
}

// ─── PASS SCREEN ──────────────────────────────────────────────────────────────
function showPassScreen(){
  const next=currentPlayer();
  $('passNextPlayer').textContent=next.name;
  $('passSubtitle').textContent='Hand the device to the next player';
  showScreen('pass');
}
$('btnReady').addEventListener('click',()=>{ Audio.click(); G.phase='turn'; Store.saveGame(G); renderTurnScreen(); showScreen('turn'); });

// ─── SUSPENSE BAR ─────────────────────────────────────────────────────────────
function animateSuspenseBar(cardCount,flipDelay,initDelay){
  const fill=$('suspenseFill'); if(!fill)return;
  fill.style.width='0%';
  const totalMs=initDelay+cardCount*flipDelay, start=Date.now();
  const step=()=>{ const pct=Math.min(100,(Date.now()-start)/totalMs*100); fill.style.width=pct+'%'; if(pct<100)requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ─── REVEAL SCREEN ────────────────────────────────────────────────────────────
function renderRevealScreen(){
  $('revealRoundBadge').textContent=`ROUND ${G.round}`;
  $('revealTitle').textContent='REVEALING CARDS';
  $('revealResult').style.opacity='0';
  $('btnContinue').style.display='none';
  $('explosionRing').style.display='none';
  $('eliminatedMsg').innerHTML='';
  const oldRing=$('revealResult').querySelector('.safe-ring');
  if(oldRing)oldRing.remove();
  const modeTag=$('revealModeTag');
  if(modeTag) modeTag.textContent=G.mode==='classic'?'':MODES[G.mode]?.label||'';

  const area=$('revealCardsArea'); area.innerHTML='';
  updateCardSizeVar(G.cards.length);

  // One card is always the ghost (unselected)
  const ghostCard=G.cards.find(c=>c.selectedBy===null);
  const order=[];
  G.players.forEach(player=>{
    const card=G.cards.find(c=>c.selectedBy===player.id);
    order.push({card,player,isGhost:false});
  });
  order.push({card:ghostCard,player:null,isGhost:true});

  order.forEach(({card,player,isGhost})=>{
    const wrap=document.createElement('div');
    wrap.className='reveal-card-wrap'+(isGhost?' ghost-wrap':'');
    if(!isGhost)wrap.dataset.playerId=player.id;
    wrap.dataset.cardId=card.id;
    const nameEl=document.createElement('div');
    nameEl.className='reveal-player-name';
    nameEl.textContent=isGhost?'— UNTOUCHED —':player.name;
    // Shield badge in name
    if(!isGhost&&G.shieldHolderId===player.id&&!G.shieldUsed){
      nameEl.textContent+=' 🛡️';
    }
    const cardEl=buildCard({...card,selectedBy:null,_isGhost:isGhost},true);
    const elimOverlay=document.createElement('div'); elimOverlay.className='elim-overlay';
    const safeOverlay=document.createElement('div'); safeOverlay.className='safe-overlay';
    wrap.appendChild(cardEl); wrap.appendChild(elimOverlay); wrap.appendChild(safeOverlay); wrap.appendChild(nameEl);
    area.appendChild(wrap);
  });

  const cardCount=order.length;
  const flipDelay=Math.min(520,Math.max(160,2400/cardCount));
  const initDelay=320;
  animateSuspenseBar(cardCount,flipDelay,initDelay);
  area.querySelectorAll('.card').forEach((el,i)=>{
    setTimeout(()=>{ Audio.cardFlip(); el.classList.add('flipped'); },initDelay+i*flipDelay);
  });
  setTimeout(showRevealResult, initDelay+cardCount*flipDelay+480);
}

// ═══════════════════════════════════════════════════════════
//  FIXED REVEAL RESULT — correct logic for ALL modes
// ═══════════════════════════════════════════════════════════
function showRevealResult(){
  // The one card nobody picked
  const ghostCard = G.cards.find(c => c.selectedBy === null);

  // All danger cards in this round
  const allDangerCards = G.cards.filter(c => c.isDanger);

  // Danger cards that WERE selected by a player (bomb found)
  const selectedDangerCards = allDangerCards.filter(c => c.selectedBy !== null);

  // Danger cards that are the ghost (untouched)
  const ghostDangerCards = allDangerCards.filter(c => c.selectedBy === null);

  const result=$('revealResult'), msg=$('eliminatedMsg');
  result.style.transition='opacity 0.5s ease';

  if(selectedDangerCards.length === 0){
    // ═══ ALL BOMBS WERE THE GHOST — everyone is safe ═══
    $('revealTitle').textContent='THE BOMB ESCAPED!';

    // Highlight ghost card wrap
    $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w=>{
      if(parseInt(w.dataset.cardId)===ghostCard.id) w.classList.add('ghost-wrap');
    });

    const safeRing=document.createElement('div'); safeRing.className='safe-ring';
    result.appendChild(safeRing); safeRing.style.display='block';
    Audio.phew();
    $('screen-reveal').classList.add('safe-bounce');
    setTimeout(()=>$('screen-reveal').classList.remove('safe-bounce'),550);

    msg.innerHTML=`😅 <span class="safe-msg">Nobody picked the bomb!</span><br>${randomFrom(TAUNTS_ESCAPE)}`;
    result.style.opacity='1';
    $('continueLabel').textContent='NEW ROUND';
    $('btnContinue').style.display='flex';

    // Update streaks — everyone survives
    G.players.forEach(p=>{ G.playerStreaks[p.id]=(G.playerStreaks[p.id]||0)+1; });

    // Add to recap
    G.roundRecap.push({round:G.round,event:'escape',names:[]});
    G.bombsEscaped++;
    G.phase='same-round-next';
    Store.saveGame(G);

  } else {
    // ═══ ONE OR MORE PLAYERS PICKED A BOMB ═══

    // Map selected danger cards → the players who picked them
    let eliminatedPlayers = selectedDangerCards
      .map(c => G.players.find(p => p.id === c.selectedBy))
      .filter(Boolean);

    // ── LUCKY SHIELD CHECK ─────────────────────────────────
    // If the shield holder picked the bomb AND the shield hasn't been used yet — they survive
    const shieldSavedIdx = eliminatedPlayers.findIndex(p => p.id === G.shieldHolderId && !G.shieldUsed);
    if(shieldSavedIdx !== -1){
      const shieldSaved = eliminatedPlayers[shieldSavedIdx];
      eliminatedPlayers.splice(shieldSavedIdx,1);
      G.shieldUsed = true;
      Audio.shield();
      showToast(`🛡️ ${shieldSaved.name}'s Lucky Shield deflected the bomb!`, 3500);
      // Highlight their card wrap as shielded instead of eliminated
      $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w=>{
        if(!w.classList.contains('ghost-wrap')&&parseInt(w.dataset.playerId)===shieldSaved.id){
          w.classList.add('shielded');
        }
      });
    }

    // If shield saved the only eliminated player — treat as escape
    if(eliminatedPlayers.length===0){
      $('revealTitle').textContent='SHIELD BLOCKED IT!';
      const safeRing=document.createElement('div'); safeRing.className='safe-ring';
      result.appendChild(safeRing); safeRing.style.display='block';
      msg.innerHTML=`🛡️ <span class="safe-msg">The Lucky Shield saved everyone!</span><br>New round begins.`;
      result.style.opacity='1';
      $('continueLabel').textContent='NEXT ROUND';
      $('btnContinue').style.display='flex';
      G.players.forEach(p=>{ G.playerStreaks[p.id]=(G.playerStreaks[p.id]||0)+1; });
      G.phase='eliminated'; // re-use same phase flow, no one actually removed
      Store.saveGame(G);
      return;
    }

    // Normal elimination
    const isDouble = eliminatedPlayers.length > 1;
    $('revealTitle').textContent = isDouble ? '💀 DOUBLE BOOM!' : '💥 BOOM!';

    eliminatedPlayers.forEach(ep=>{
      $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w=>{
        if(!w.classList.contains('ghost-wrap')&&parseInt(w.dataset.playerId)===ep.id) w.classList.add('eliminated');
      });
    });

    // Ghost danger cards — show safe-escape ring on them
    ghostDangerCards.forEach(gc=>{
      $('revealCardsArea').querySelectorAll('.reveal-card-wrap').forEach(w=>{
        if(parseInt(w.dataset.cardId)===gc.id) w.classList.add('ghost-wrap');
      });
    });

    $('explosionRing').style.display='block';
    spawnSparks();
    flashDanger();
    Audio.explosion();
    $('screen-reveal').classList.add('shake');
    setTimeout(()=>$('screen-reveal').classList.remove('shake'),600);

    const names=eliminatedPlayers.map(p=>p.name);
    if(isDouble){
      msg.innerHTML=`💥 <span class="danger-name">${escHtml(names.join(' & '))}</span> found DANGER CARDS and are eliminated!`;
    } else {
      msg.innerHTML=`💥 <span class="danger-name">${escHtml(names[0])}</span> found the DANGER CARD! ${randomFrom(TAUNTS_BOMB)}`;
    }
    result.style.opacity='1';

    // Add recap
    G.roundRecap.push({round:G.round,event:'elimination',names});

    // Update streaks — survivors get +1, eliminated get reset
    G.players.forEach(p=>{
      if(eliminatedPlayers.find(ep=>ep.id===p.id)){
        G.playerStreaks[p.id]=0;
      } else {
        G.playerStreaks[p.id]=(G.playerStreaks[p.id]||0)+1;
      }
    });

    // ── MUTUAL ELIMINATION CHECK ──────────────────────────────
    // If ALL remaining players are about to be eliminated at the same time
    // (e.g. 2-player Sudden Death where both pick bombs), nobody is actually
    // eliminated — instead, restore everyone and replay the round.
    const allPlayersEliminated = eliminatedPlayers.length === G.players.length;

    if (allPlayersEliminated) {
      // Dramatic tie message — overwrite the boom message
      $('revealTitle').textContent = '💀 MUTUAL DESTRUCTION!';
      const tieNames = eliminatedPlayers.map(p => p.name);
      msg.innerHTML = `
        💥 <span class="danger-name">${escHtml(tieNames.join(' & '))}</span>
        both hit BOMBS!<br>
        <span class="safe-msg">No winner yet — REPLAY THIS ROUND!</span>`;

      // Reset streaks for all tied players
      eliminatedPlayers.forEach(ep=>{ G.playerStreaks[ep.id]=0; });

      $('continueLabel').textContent = '🔁 REPLAY ROUND';
      $('btnContinue').style.display = 'flex';

      // Don't actually remove anyone — just note it as a tie replay
      G.roundRecap.push({round:G.round, event:'tie', names:tieNames});
      G.phase = 'tie-replay';
      Store.saveGame(G);
      return;
    }

    // Hot Seat: the eliminated player (first if multiple) goes first next round
    if(G.mode==='hotseat') G.hotSeatPlayerId=eliminatedPlayers[0].id;

    // Actually remove eliminated players
    eliminatedPlayers.forEach(ep=>{
      G.eliminated.push({...ep,round:G.round});
      G.players=G.players.filter(p=>p.id!==ep.id);
    });

    // Comeback Crown: if remaining player has longest losing streak mention it
    checkComebackCrown();

    const isGameOver=G.players.length<=1;
    $('continueLabel').textContent=isGameOver?'SEE WINNER':'NEXT ROUND';
    $('btnContinue').style.display='flex';
    G.phase=isGameOver?'winner':'eliminated';
    Store.saveGame(G);
  }
}

// ─── COMEBACK CROWN ───────────────────────────────────────────────────────────
// If the player who won last round's streak ≥ 3, show a taunt toast
function checkComebackCrown(){
  if(!G.players.length)return;
  const top=G.players.reduce((a,b)=>(G.playerStreaks[a.id]||0)>(G.playerStreaks[b.id]||0)?a:b);
  const streak=G.playerStreaks[top.id]||0;
  if(streak>=3) setTimeout(()=>showToast(`👑 ${top.name} has survived ${streak} rounds in a row!`,3000),1200);
}

// ─── CONTINUE BUTTON ──────────────────────────────────────────────────────────
$('btnContinue').addEventListener('click',async()=>{
  Audio.click();

  // ── TIE REPLAY: everyone hit a bomb — replay same round, nobody removed ──
  if(G.phase==='tie-replay'){
    G.currentTurnIndex=0; G.phase='turn';
    G.shieldHolderId=null; G.shieldUsed=false;
    generateRound(); Store.saveGame(G); renderTurnScreen(); showScreen('turn');
    showToast('🔁 All hit bombs — pick again!', 2200);
    return;
  }

  if(G.phase==='same-round-next'){
    G.round++; G.currentTurnIndex=0; G.phase='turn';
    generateRound(); Store.saveGame(G); renderTurnScreen(); showScreen('turn');
  } else if(G.phase==='winner'||G.players.length<=1){
    showWinner();
  } else {
    // Dare Twist: every 2 rounds after round 1, 30% chance of a dare
    if(G.round>1 && G.round%2===0 && Math.random()<0.30 && G.players.length>0){
      const dareTarget=G.players[Math.floor(Math.random()*G.players.length)];
      await showDareModal(dareTarget.name);
    }
    nextRound();
  }
});

function nextRound(){
  G.round++; G.currentTurnIndex=0; G.phase='turn';
  generateRound(); Store.saveGame(G); renderTurnScreen(); showScreen('turn');
}

// ─── WINNER SCREEN ────────────────────────────────────────────────────────────
function showWinner(){
  const win=G.players[0];
  $('winnerName').textContent=win.name;

  const finalStreak=G.playerStreaks[win.id]||0;
  const extra=finalStreak>=3?`<div class="stat-box"><span class="stat-val">${finalStreak}🔥</span><span class="stat-lbl">STREAK</span></div>`:'';

  $('winnerStats').innerHTML=`
    <div class="stat-box"><span class="stat-val">${G.round}</span><span class="stat-lbl">ROUNDS</span></div>
    <div class="stat-box"><span class="stat-val">${G.eliminated.length}</span><span class="stat-lbl">ELIMINATED</span></div>
    <div class="stat-box"><span class="stat-val">${G.bombsEscaped}</span><span class="stat-lbl">ESCAPES</span></div>
    ${extra}`;

  // Elimination order
  const elimList=$('winnerEliminatedList');
  if(elimList&&G.eliminated.length){
    elimList.innerHTML='<div class="elim-list-title">ELIMINATION ORDER</div>'+
      [...G.eliminated].reverse().map((p,i)=>`
        <div class="elim-row">
          <span class="elim-pos">#${G.eliminated.length-i}</span>
          <span class="elim-name">${escHtml(p.name)}</span>
          <span class="elim-round">Round ${p.round}</span>
        </div>`).join('');
  }

  // Game recap teaser
  const recapEl=$('winnerRecap');
  if(recapEl&&G.roundRecap.length){
    const escapes=G.roundRecap.filter(r=>r.event==='escape').length;
    const elims=G.roundRecap.filter(r=>r.event==='elimination').length;
    recapEl.innerHTML=`<div class="recap-line">💣 ${elims} elimination${elims!==1?'s':''} · 😅 ${escapes} escape${escapes!==1?'s':''}</div>`;
  }

  const s=Store.getStats();
  s.games++; s.rounds+=G.round; s.escapes+=G.bombsEscaped;
  Store.saveStats(s);
  Store.addWin(win.name); Store.clearGame(); G.phase='winner';
  showScreen('winner'); Audio.winner();
  setTimeout(()=>Confetti.start(),280);
}

$('btnRestart').addEventListener('click',()=>{
  Audio.click(); Confetti.stop();
  const allNames=[...G.players,...G.eliminated].map(p=>p.name);
  initGame(allNames, G.mode||prefs.mode);
});
$('btnMainMenu').addEventListener('click',()=>{
  Audio.click(); Confetti.stop(); Store.clearGame();
  renderLeaderboard(); updateStatsBar(); showScreen('start');
});

// ─── STATE RESTORE ────────────────────────────────────────────────────────────
function tryRestoreGame(){
  const saved=Store.loadGame();
  if(!saved||!saved.players||!saved.players.length)return false;
  G=saved;
  if(!G.playerStreaks)G.playerStreaks={};
  if(!G.roundRecap)G.roundRecap=[];
  if(G.bombsEscaped===undefined)G.bombsEscaped=0;
  updateCardSizeVar(G.cards.length||G.players.length+1);
  switch(G.phase){
    case 'winner':                                         showWinner();             return true;
    case 'reveal': case 'eliminated':
    case 'same-round-next':
    case 'tie-replay':     renderRevealScreen();           showScreen('reveal');     return true;
    case 'pass':           renderTurnScreen();             showPassScreen();         return true;
    case 'turn':           renderTurnScreen();             showScreen('turn');       return true;
  }
  return false;
}

// ─── PREVENT NATIVE BEHAVIORS ─────────────────────────────────────────────────
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
document.addEventListener('dragstart',  e=>e.preventDefault());
let lastTap=0;
document.addEventListener('touchend',e=>{ const now=Date.now(); if(now-lastTap<300)e.preventDefault(); lastTap=now; },{passive:false});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
(function boot(){
  renderLeaderboard(); updateStatsBar();
  if(!tryRestoreGame()) showScreen('start');
})();

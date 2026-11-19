import { Map2D, MAP_SIZE, MAP_CENTER } from './Map2D.js';
import { Storm2D } from './Storm2D.js';
import { BuildGrid2D } from './BuildGrid2D.js';
import { BotManager2D } from './Bot2D.js';
import { HUD } from './HUD.js';

class Camera2D {
  constructor(canvas, botManager, hud) {
    this.canvas = canvas;
    this.botManager = botManager;
    this.hud = hud;

    this.mode = 'bus'; // 'bus' | 'free' | 'player' | 'map'
    this.x = MAP_CENTER;
    this.y = MAP_CENTER;
    this.zoom = 0.24;

    this.targetX = MAP_CENTER;
    this.targetY = MAP_CENTER;
    this.targetZoom = 0.24;

    this.keys = Object.create(null);
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k.startsWith('arrow')) e.preventDefault();
      this.keys[k] = true;

      if (k === '1' || e.code === 'Digit1' || e.code === 'Numpad1') this.setMode('bus');
      else if (k === '2' || e.code === 'Digit2' || e.code === 'Numpad2') this.setMode('free');
      else if (k === '3' || e.code === 'Digit3' || e.code === 'Numpad3') this.setMode('player');
      else if (k === '4' || e.code === 'Digit4' || e.code === 'Numpad4') this.setMode('map');
      else if (this.mode === 'player' && k === 'arrowleft') this.cyclePlayer(-1);
      else if (this.mode === 'player' && k === 'arrowright') this.cyclePlayer(1);
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      for (const k in this.keys) this.keys[k] = false;
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.mode === 'player' || this.mode === 'bus') {
        if (Math.hypot(dx, dy) > 2) this.setMode('free');
      }
      this.targetX = Math.max(0, Math.min(MAP_SIZE, this.targetX - dx / this.zoom));
      this.targetY = Math.max(0, Math.min(MAP_SIZE, this.targetY - dy / this.zoom));
      this.x = this.targetX;
      this.y = this.targetY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.16 : 0.86;
      const nextZoom = Math.max(0.065, Math.min(2.4, this.targetZoom * factor));

      if (this.mode === 'free' || this.mode === 'map') {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width * 0.5;
        const my = e.clientY - rect.top - rect.height * 0.5;
        const worldBeforeX = this.targetX + mx / this.targetZoom;
        const worldBeforeY = this.targetY + my / this.targetZoom;
        this.targetZoom = nextZoom;
        this.targetX = Math.max(0, Math.min(MAP_SIZE, worldBeforeX - mx / nextZoom));
        this.targetY = Math.max(0, Math.min(MAP_SIZE, worldBeforeY - my / nextZoom));
      } else {
        this.targetZoom = nextZoom;
      }
    }, { passive: false });
  }

  resetForNewMatch() {
    this.setMode('bus');
    this.x = this.botManager.bus.x;
    this.y = this.botManager.bus.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.zoom = 0.25;
    this.targetZoom = 0.25;
  }

  setMode(mode) {
    if (mode === 'bus' && !this.botManager.bus.active) {
      this.hud.showToast('Le Bus de Combat a terminé sa traversée');
      mode = 'map';
    }
    this.mode = mode;

    if (mode === 'bus') {
      this.targetZoom = 0.26;
    } else if (mode === 'map') {
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 720;
      this.targetZoom = Math.max(0.075, Math.min(vw / 8350, vh / 8350));
      this.targetX = MAP_CENTER;
      this.targetY = MAP_CENTER;
    } else if (mode === 'player') {
      const cur = this.botManager.bots[this.botManager.watchedBotIndex];
      if (!cur || !cur.alive || cur.state === 'bus') {
        this.botManager.watchedBotIndex = this.botManager.findAliveBot(this.botManager.watchedBotIndex, 1);
      }
      this.targetZoom = 1.38;
    }

    this.hud.syncViewMode(mode, this.botManager.bus.active);
  }

  cyclePlayer(dir) {
    this.botManager.watchedBotIndex = this.botManager.findAliveBot(this.botManager.watchedBotIndex, dir);
    if (this.mode !== 'player') this.setMode('player');
  }

  update(rawDt) {
    if (this.mode === 'bus' && !this.botManager.bus.active) {
      this.setMode('map');
      this.hud.showToast('Largage terminé — Passage en Vue Carte FNCS');
    }

    if (this.mode === 'bus') {
      this.targetX = this.botManager.bus.x;
      this.targetY = this.botManager.bus.y;
    } else if (this.mode === 'player') {
      const b = this.botManager.bots[this.botManager.watchedBotIndex];
      if (b) {
        this.targetX = b.x;
        this.targetY = b.y;
      }
    } else if (this.mode === 'free') {
      const panSpd = (this.keys['shift'] ? 1200 : 620) / Math.max(0.12, this.zoom);
      if (this.keys['z'] || this.keys['w'] || this.keys['arrowup']) this.targetY -= panSpd * rawDt;
      if (this.keys['s'] || this.keys['arrowdown']) this.targetY += panSpd * rawDt;
      if (this.keys['q'] || this.keys['a'] || this.keys['arrowleft']) this.targetX -= panSpd * rawDt;
      if (this.keys['d'] || this.keys['arrowright']) this.targetX += panSpd * rawDt;
      this.targetX = Math.max(0, Math.min(MAP_SIZE, this.targetX));
      this.targetY = Math.max(0, Math.min(MAP_SIZE, this.targetY));
    }

    const posLerp = 1 - Math.exp(-10 * rawDt);
    const zoomLerp = 1 - Math.exp(-8 * rawDt);
    this.x += (this.targetX - this.x) * posLerp;
    this.y += (this.targetY - this.y) * posLerp;
    this.zoom += (this.targetZoom - this.zoom) * zoomLerp;
  }

  getViewportBounds(vw, vh) {
    const halfW = (vw * 0.5) / this.zoom;
    const halfH = (vh * 0.5) / this.zoom;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.y - halfH,
      maxY: this.y + halfH,
      width: halfW * 2,
      height: halfH * 2
    };
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let vw = window.innerWidth;
let vh = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(vw * dpr));
  canvas.height = Math.max(1, Math.floor(vh * dpr));
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const hud = new HUD();
const map = new Map2D();
const storm = new Storm2D(map);
const builds = new BuildGrid2D();
const botManager = new BotManager2D(map, storm, builds, hud);
const camera = new Camera2D(canvas, botManager, hud);

let simSpeed = 1;

function resetMatch() {
  map.resetMatch();
  storm.reset();
  builds.reset();
  botManager.reset();
  hud.resetForNewMatch();
  camera.resetForNewMatch();
  hud.syncSpeed(simSpeed);
  hud.showToast('Nouvelle Partie — Bus de Combat en approche');
}

hud.bindControls({
  onViewMode: (mode) => camera.setMode(mode),
  onCyclePlayer: (dir) => camera.cyclePlayer(dir),
  onSpeedChange: (speed) => {
    simSpeed = speed;
    hud.syncSpeed(speed);
    hud.showToast(`Vitesse x${speed}`);
  },
  onReplay: () => resetMatch()
});

resetMatch();

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);

  const rawDt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const simDt = rawDt * simSpeed;
  const subSteps = simDt > 0.08 ? Math.min(10, Math.ceil(simDt / 0.04)) : 1;
  const stepDt = simDt / subSteps;

  for (let s = 0; s < subSteps; s++) {
    storm.update(stepDt);
    builds.update(stepDt);
    botManager.update(stepDt);
  }

  camera.update(rawDt);
  hud.update(rawDt, botManager, storm, camera);

  // Rendu 100% HTML5 Canvas 2D
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#06335e';
  ctx.fillRect(0, 0, vw, vh);

  const view = camera.getViewportBounds(vw, vh);
  const watchedBot = botManager.bots[botManager.watchedBotIndex];
  const nowSec = now * 0.001;

  ctx.save();
  ctx.translate(vw * 0.5, vh * 0.5);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // 1. Île 8000x8000, biomes, rivières, ponts, routes, bâtiments, arbres, coffres & loot
  map.renderWorld(ctx, view, camera.zoom, watchedBot, nowSec);

  // 2. Grille 64x64 (Sols, Escaliers High Ground, Murs + Édits bleu électrique)
  builds.renderBase(ctx, view, camera.zoom);

  // 3. Joueurs 2D (points FNCS dézoomés ou personnages ZombsRoyale zoomés), tirs & particules
  botManager.render(ctx, view, camera.zoom, botManager.watchedBotIndex);

  // 4. Toits (semi-transparents si dedans) & Cônes en X avec carré central au-dessus des joueurs
  map.renderRoofs(ctx, view, camera.zoom, watchedBot);
  builds.renderConesOverlay(ctx, view, camera.zoom);

  // 5. Noms des 12 Villes & Bus de Combat
  map.renderPoiLabels(ctx, camera.zoom);
  botManager.bus.render(ctx, camera.zoom);

  // 6. Tempête violette + Cercle blanc prochaine zone
  storm.render(ctx, view, camera.zoom);

  ctx.restore();
}

requestAnimationFrame(animate);

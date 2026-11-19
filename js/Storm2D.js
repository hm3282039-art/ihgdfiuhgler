import { MAP_CENTER, ISLAND_RADIUS } from './Map2D.js';

const STORM_PHASES = [
  // Phases 1 à 5 : Early & Mid Game (~17 min)
  { phase: 1, wait: 120, shrink: 165, targetRadius: 2150, dps: 1.0, moving: false, shift: 520 },
  { phase: 2, wait: 90,  shrink: 145, targetRadius: 1280, dps: 2.0, moving: false, shift: 380 },
  { phase: 3, wait: 70,  shrink: 125, targetRadius: 720,  dps: 4.0, moving: false, shift: 240 },
  { phase: 4, wait: 60,  shrink: 110, targetRadius: 380,  dps: 6.0, moving: false, shift: 135 },
  { phase: 5, wait: 50,  shrink: 95,  targetRadius: 195,  dps: 8.0, moving: false, shift: 75 },
  // Phases 6 à 8 : Moving Zones FNCS (~5 min)
  { phase: 6, wait: 25,  shrink: 85,  targetRadius: 115,  dps: 10.0, moving: true, shift: 280 },
  { phase: 7, wait: 20,  shrink: 80,  targetRadius: 65,   dps: 12.0, moving: true, shift: 220 },
  { phase: 8, wait: 15,  shrink: 80,  targetRadius: 24,   dps: 15.0, moving: true, shift: 160 }
];

export class Storm2D {
  constructor(map) {
    this.map = map;
    this.x = MAP_CENTER;
    this.y = MAP_CENTER;
    this.radius = 4200;

    this.startX = MAP_CENTER;
    this.startY = MAP_CENTER;
    this.startRadius = 4200;

    this.nextX = MAP_CENTER;
    this.nextY = MAP_CENTER;
    this.nextRadius = 2150;

    this.phaseIndex = 0;
    this.subPhase = 'wait';
    this.subTimer = 0;
    this.dps = 1.0;

    this.reset();
  }

  get currentPhaseNumber() {
    return STORM_PHASES[Math.min(this.phaseIndex, STORM_PHASES.length - 1)].phase;
  }

  get isMovingPhase() {
    return STORM_PHASES[Math.min(this.phaseIndex, STORM_PHASES.length - 1)].moving;
  }

  get isLateGame() {
    return this.currentPhaseNumber >= 5;
  }

  getStatusLabel() {
    const p = this.currentPhaseNumber;
    const isMoving = this.isMovingPhase;
    const title = isMoving ? `Zone ${p} (Moving)` : `Phase ${p}`;

    if (this.subPhase === 'done') {
      return { title: 'Zone Finale', sub: 'Fermeture Totale', timerText: '0:00', isMoving: true };
    }
    const sec = Math.max(0, Math.ceil(this.subTimer));
    const min = Math.floor(sec / 60);
    const rem = String(sec % 60).padStart(2, '0');
    const sub = this.subPhase === 'wait' ? 'Prochaine zone' : 'Rétrécissement';
    return { title, sub, timerText: `${min}:${rem}`, isMoving };
  }

  reset() {
    this.x = MAP_CENTER;
    this.y = MAP_CENTER;
    this.radius = 4200;
    this.phaseIndex = 0;
    this._setupPhase(0);
  }

  _pickNextZone(cfg) {
    this.startX = this.x;
    this.startY = this.y;
    this.startRadius = this.radius;
    this.nextRadius = cfg.targetRadius;

    let nx = MAP_CENTER;
    let ny = MAP_CENTER;
    for (let tries = 0; tries < 50; tries++) {
      const ang = Math.random() * Math.PI * 2;
      if (cfg.moving) {
        const dist = cfg.shift * (0.85 + Math.random() * 0.3);
        nx = this.x + Math.cos(ang) * dist;
        ny = this.y + Math.sin(ang) * dist;
      } else {
        const maxOff = Math.min(cfg.shift, Math.max(40, this.radius - cfg.targetRadius));
        const dist = Math.random() * maxOff;
        nx = this.x + Math.cos(ang) * dist;
        ny = this.y + Math.sin(ang) * dist;
      }
      if (
        Math.hypot(nx - MAP_CENTER, ny - MAP_CENTER) < ISLAND_RADIUS * 0.65 &&
        this.map.isLand(nx, ny) &&
        this.map.getRiverDistance(nx, ny) > 55
      ) {
        break;
      }
    }

    const rFromCenter = Math.hypot(nx - MAP_CENTER, ny - MAP_CENTER);
    if (rFromCenter > ISLAND_RADIUS * 0.65) {
      const s = (ISLAND_RADIUS * 0.62) / rFromCenter;
      nx = MAP_CENTER + (nx - MAP_CENTER) * s;
      ny = MAP_CENTER + (ny - MAP_CENTER) * s;
    }

    this.nextX = nx;
    this.nextY = ny;
  }

  _setupPhase(idx) {
    this.phaseIndex = idx;
    const cfg = STORM_PHASES[idx];
    this.subPhase = 'wait';
    this.subTimer = cfg.wait;
    this.dps = cfg.dps;
    this._pickNextZone(cfg);
  }

  update(dt) {
    if (this.subPhase === 'done') {
      if (this.radius > 0) {
        this.radius = Math.max(0, this.radius - 1.2 * dt);
        this.dps = 25.0;
      }
      return;
    }

    const cfg = STORM_PHASES[this.phaseIndex];
    this.subTimer -= dt;

    if (this.subPhase === 'wait' && this.subTimer <= 0) {
      this.subPhase = 'shrink';
      this.subTimer = cfg.shrink + this.subTimer;
    }

    if (this.subPhase === 'shrink') {
      const elapsed = cfg.shrink - Math.max(0, this.subTimer);
      const t = Math.max(0, Math.min(1, elapsed / cfg.shrink));
      this.x = this.startX + (this.nextX - this.startX) * t;
      this.y = this.startY + (this.nextY - this.startY) * t;
      this.radius = this.startRadius + (this.nextRadius - this.startRadius) * t;

      if (this.subTimer <= 0) {
        this.x = this.nextX;
        this.y = this.nextY;
        this.radius = this.nextRadius;
        if (this.phaseIndex + 1 < STORM_PHASES.length) {
          this._setupPhase(this.phaseIndex + 1);
        } else {
          this.subPhase = 'done';
          this.subTimer = 0;
        }
      }
    }
  }

  render(ctx, view, zoom) {
    // 1. Zone violette à l'extérieur du cercle de Tempête (evenodd mask)
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.minX - 200, view.minY - 200, view.width + 400, view.height + 400);
    if (this.radius > 0.5) {
      ctx.moveTo(this.x + this.radius, this.y);
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    }
    ctx.fillStyle = 'rgba(139, 92, 246, 0.34)';
    ctx.fill('evenodd');

    // Bordure violette lumineuse de la tempête actuelle
    if (this.radius > 0.5) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = Math.max(3, 3.2 / zoom);
      ctx.stroke();
    }

    // 2. Cercle Blanc de la prochaine zone sûre (Moving Zone très visible !)
    if (this.subPhase !== 'done' && this.nextRadius > 1) {
      ctx.beginPath();
      ctx.arc(this.nextX, this.nextY, this.nextRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = Math.max(2, 2.5 / zoom);
      ctx.stroke();
    }
    ctx.restore();
  }
}

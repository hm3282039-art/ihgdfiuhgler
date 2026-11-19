import { MAP_SIZE } from './Map2D.js';

export const CELL_SIZE = 64;

const MAT_CONFIG = {
  wood:  { maxHp: 150, color: '#b47438', floor: 'rgba(180, 116, 56, 0.42)',  cone: 'rgba(196, 132, 68, 0.36)' },
  brick: { maxHp: 300, color: '#c8523b', floor: 'rgba(200, 82, 59, 0.44)',   cone: 'rgba(214, 98, 72, 0.36)' },
  metal: { maxHp: 450, color: '#7c8b9e', floor: 'rgba(124, 139, 158, 0.48)', cone: 'rgba(148, 163, 184, 0.38)' }
};

const MAX_WALLS = 2800;
const MAX_CELL_PIECES = 1600;

export function worldToGrid(x, y) {
  return {
    gx: Math.floor(x / CELL_SIZE),
    gy: Math.floor(y / CELL_SIZE)
  };
}

export function gridCenter(gx, gy) {
  return {
    x: gx * CELL_SIZE + CELL_SIZE * 0.5,
    y: gy * CELL_SIZE + CELL_SIZE * 0.5
  };
}

function segmentIntersectsSegment(ax, ay, bx, by, cx, cy, dx, dy) {
  const rX = bx - ax, rY = by - ay;
  const sX = dx - cx, sY = dy - cy;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-6) return null;
  const qpx = cx - ax, qpy = cy - ay;
  const t = (qpx * sY - qpy * sX) / denom;
  const u = (qpx * rY - qpy * rX) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { t, u };
  return null;
}

export class BuildGrid2D {
  constructor() {
    this.wallsMap = new Map();
    this.floorsMap = new Map();
    this.stairsMap = new Map();
    this.conesMap = new Map();

    this.walls = [];
    this.floors = [];
    this.stairs = [];
    this.cones = [];
  }

  reset() {
    this.wallsMap.clear();
    this.floorsMap.clear();
    this.stairsMap.clear();
    this.conesMap.clear();
    this.walls = [];
    this.floors = [];
    this.stairs = [];
    this.cones = [];
  }

  // dir: 0=Haut(-Y), 1=Droite(+X), 2=Bas(+Y), 3=Gauche(-X)
  _wallKey(gx, gy, dir) {
    if (dir === 0) return `H:${gx},${gy}`;
    if (dir === 2) return `H:${gx},${gy + 1}`;
    if (dir === 3) return `V:${gx},${gy}`;
    return `V:${gx + 1},${gy}`;
  }

  _cellKey(gx, gy) {
    return `${gx},${gy}`;
  }

  _evictOldest(arr, map) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].alive) {
        arr[i].alive = false;
        map.delete(arr[i].key);
        arr.splice(i, 1);
        return;
      }
    }
    const dead = arr.shift();
    if (dead) map.delete(dead.key);
  }

  placeWall(gx, gy, dir, ownerId, ownerColor = '#38bdf8', material = 'wood', forceTake = false) {
    const key = this._wallKey(gx, gy, dir);
    const existing = this.wallsMap.get(key);
    if (existing && existing.alive) {
      if (!forceTake) return existing;
      this.destroyPiece(existing);
    }

    const cfg = MAT_CONFIG[material] || MAT_CONFIG.wood;
    const isHoriz = dir === 0 || dir === 2;
    const edgeIdx = dir === 0 ? gy : dir === 2 ? gy + 1 : dir === 3 ? gx : gx + 1;

    const x1 = isHoriz ? gx * CELL_SIZE : edgeIdx * CELL_SIZE;
    const y1 = isHoriz ? edgeIdx * CELL_SIZE : gy * CELL_SIZE;
    const x2 = isHoriz ? (gx + 1) * CELL_SIZE : x1;
    const y2 = isHoriz ? y1 : (gy + 1) * CELL_SIZE;

    const piece = {
      type: 'wall',
      key,
      gx, gy, dir,
      axis: isHoriz ? 'h' : 'v',
      x1, y1, x2, y2,
      cx: (x1 + x2) * 0.5,
      cy: (y1 + y2) * 0.5,
      ownerId,
      ownerColor,
      material,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      buildTimer: 0.25,
      editTimer: 0,
      alive: true,
      life: 240
    };

    if (this.walls.length >= MAX_WALLS) this._evictOldest(this.walls, this.wallsMap);
    this.wallsMap.set(key, piece);
    this.walls.push(piece);
    return piece;
  }

  placeFloor(gx, gy, ownerId, ownerColor = '#38bdf8', material = 'wood') {
    const key = this._cellKey(gx, gy);
    const ex = this.floorsMap.get(key);
    if (ex && ex.alive) return ex;

    const cfg = MAT_CONFIG[material] || MAT_CONFIG.wood;
    const piece = {
      type: 'floor',
      key,
      gx, gy,
      x: gx * CELL_SIZE,
      y: gy * CELL_SIZE,
      cx: gx * CELL_SIZE + CELL_SIZE * 0.5,
      cy: gy * CELL_SIZE + CELL_SIZE * 0.5,
      ownerId,
      ownerColor,
      material,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      buildTimer: 0.22,
      alive: true,
      life: 240
    };
    if (this.floors.length >= MAX_CELL_PIECES) this._evictOldest(this.floors, this.floorsMap);
    this.floorsMap.set(key, piece);
    this.floors.push(piece);
    return piece;
  }

  placeStairs(gx, gy, dir, ownerId, ownerColor = '#38bdf8', material = 'wood') {
    const key = this._cellKey(gx, gy);
    const ex = this.stairsMap.get(key);
    if (ex && ex.alive) return ex;

    const cfg = MAT_CONFIG[material] || MAT_CONFIG.wood;
    const piece = {
      type: 'stairs',
      key,
      gx, gy, dir,
      x: gx * CELL_SIZE,
      y: gy * CELL_SIZE,
      cx: gx * CELL_SIZE + CELL_SIZE * 0.5,
      cy: gy * CELL_SIZE + CELL_SIZE * 0.5,
      ownerId,
      ownerColor,
      material,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      buildTimer: 0.22,
      alive: true,
      life: 240
    };
    if (this.stairs.length >= MAX_CELL_PIECES) this._evictOldest(this.stairs, this.stairsMap);
    this.stairsMap.set(key, piece);
    this.stairs.push(piece);
    return piece;
  }

  placeCone(gx, gy, ownerId, ownerColor = '#38bdf8', material = 'wood') {
    const key = this._cellKey(gx, gy);
    const ex = this.conesMap.get(key);
    if (ex && ex.alive) return ex;

    const cfg = MAT_CONFIG[material] || MAT_CONFIG.wood;
    const piece = {
      type: 'cone',
      key,
      gx, gy,
      x: gx * CELL_SIZE,
      y: gy * CELL_SIZE,
      cx: gx * CELL_SIZE + CELL_SIZE * 0.5,
      cy: gy * CELL_SIZE + CELL_SIZE * 0.5,
      ownerId,
      ownerColor,
      material,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      buildTimer: 0.22,
      alive: true,
      life: 240
    };
    if (this.cones.length >= MAX_CELL_PIECES) this._evictOldest(this.cones, this.conesMap);
    this.conesMap.set(key, piece);
    this.cones.push(piece);
    return piece;
  }

  destroyPiece(piece) {
    if (!piece || !piece.alive) return;
    piece.alive = false;
    if (piece.type === 'wall') this.wallsMap.delete(piece.key);
    else if (piece.type === 'floor') this.floorsMap.delete(piece.key);
    else if (piece.type === 'stairs') this.stairsMap.delete(piece.key);
    else if (piece.type === 'cone') this.conesMap.delete(piece.key);
  }

  damagePiece(piece, amount) {
    if (!piece || !piece.alive) return false;
    piece.hp -= amount;
    if (piece.hp <= 0) {
      piece.hp = 0;
      this.destroyPiece(piece);
      return true;
    }
    return false;
  }

  requestEdit(wall, duration = 0.6) {
    if (!wall || !wall.alive || wall.editTimer > 0) return false;
    wall.editTimer = duration;
    return true;
  }

  // Full Box sur grille : 4 Murs sur les bords + Sol + Cône semi-transparent par-dessus !
  buildFullBox(bot, material = null) {
    const { gx, gy } = worldToGrid(bot.x, bot.y);
    let mat = material;
    if (!mat && bot.mats) {
      if (bot.mats.metal >= 60) { bot.mats.metal -= 60; mat = 'metal'; }
      else if (bot.mats.brick >= 60) { bot.mats.brick -= 60; mat = 'brick'; }
      else { bot.mats.wood = Math.max(0, bot.mats.wood - 60); mat = 'wood'; }
    }
    mat = mat || 'wood';
    const col = bot.teamColor || '#38bdf8';

    for (let d = 0; d < 4; d++) {
      this.placeWall(gx, gy, d, bot.id, col, mat);
    }
    this.placeFloor(gx, gy, bot.id, col, mat);
    this.placeCone(gx, gy, bot.id, col, mat);
    return { gx, gy };
  }

  // Base d'attente en zone ("Tower / Box Holding" 1x1 ou 2x1 en Brique/Métal avec Cône + Escalier)
  buildHoldingBase(bot, is2x1 = false, stairDir = 0) {
    const { gx, gy } = worldToGrid(bot.x, bot.y);
    let mat = 'wood';
    if (bot.mats) {
      if (bot.mats.metal >= 80) { bot.mats.metal -= 80; mat = 'metal'; }
      else if (bot.mats.brick >= 80) { bot.mats.brick -= 80; mat = 'brick'; }
      else { bot.mats.wood = Math.max(0, bot.mats.wood - 80); mat = 'wood'; }
    }
    const col = bot.teamColor || '#38bdf8';

    if (!is2x1) {
      for (let d = 0; d < 4; d++) this.placeWall(gx, gy, d, bot.id, col, mat);
      this.placeFloor(gx, gy, bot.id, col, mat);
      this.placeStairs(gx, gy, stairDir, bot.id, col, mat);
      this.placeCone(gx, gy, bot.id, col, mat);
      return { gx, gy };
    }

    // Box 2x1 horizontale (gx, gy) + (gx+1, gy) avec 6 murs extérieurs, 2 sols, 1 rampe et 2 cônes
    this.placeWall(gx, gy, 0, bot.id, col, mat);
    this.placeWall(gx, gy, 2, bot.id, col, mat);
    this.placeWall(gx, gy, 3, bot.id, col, mat);
    this.placeWall(gx + 1, gy, 0, bot.id, col, mat);
    this.placeWall(gx + 1, gy, 1, bot.id, col, mat);
    this.placeWall(gx + 1, gy, 2, bot.id, col, mat);
    this.placeFloor(gx, gy, bot.id, col, mat);
    this.placeFloor(gx + 1, gy, bot.id, col, mat);
    this.placeStairs(gx, gy, stairDir, bot.id, col, mat);
    this.placeCone(gx, gy, bot.id, col, mat);
    this.placeCone(gx + 1, gy, bot.id, col, mat);
    return { gx, gy };
  }

  // Tunnel / Tarp en Moving Zone : Murs latéraux + Sol + Cône protecteur
  buildTunnelStep(x, y, dirX, dirY, ownerId, ownerColor, material = 'wood') {
    const { gx, gy } = worldToGrid(x, y);
    const moveHoriz = Math.abs(dirX) >= Math.abs(dirY);
    if (moveHoriz) {
      this.placeWall(gx, gy, 0, ownerId, ownerColor, material);
      this.placeWall(gx, gy, 2, ownerId, ownerColor, material);
    } else {
      this.placeWall(gx, gy, 1, ownerId, ownerColor, material);
      this.placeWall(gx, gy, 3, ownerId, ownerColor, material);
    }
    this.placeFloor(gx, gy, ownerId, ownerColor, material);
    if ((gx + gy) % 2 === 0) this.placeCone(gx, gy, ownerId, ownerColor, material);
  }

  // Bonus de "High Ground" si le bot se trouve sur un Escalier / Rampe
  getHighGroundBonus(x, y) {
    const { gx, gy } = worldToGrid(x, y);
    const st = this.stairsMap.get(this._cellKey(gx, gy));
    return !!(st && st.alive);
  }

  // Collisions solides contre les Murs sur grille 60x60 (aucun bot ne traverse un mur fermé !)
  resolveCollisions(nx, ny, botRadius, botId) {
    let x = Math.max(20, Math.min(MAP_SIZE - 20, nx));
    let y = Math.max(20, Math.min(MAP_SIZE - 20, ny));

    const gx = Math.floor(x / CELL_SIZE);
    const gy = Math.floor(y / CELL_SIZE);
    const minDist = 4.5 + botRadius;

    const pushFromWall = (w) => {
      if (!w || !w.alive) return;
      if (w.editTimer > 0 && w.ownerId === botId) return;

      if (w.axis === 'h') {
        if (x >= w.x1 - botRadius && x <= w.x2 + botRadius) {
          const dy = y - w.y1;
          if (Math.abs(dy) < minDist) {
            y += dy >= 0 ? (minDist - dy) : -(minDist + dy);
          }
        }
      } else {
        if (y >= w.y1 - botRadius && y <= w.y2 + botRadius) {
          const dx = x - w.x1;
          if (Math.abs(dx) < minDist) {
            x += dx >= 0 ? (minDist - dx) : -(minDist + dx);
          }
        }
      }
    };

    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        pushFromWall(this.wallsMap.get(`H:${gx + ox},${gy + oy}`));
        pushFromWall(this.wallsMap.get(`V:${gx + ox},${gy + oy}`));
      }
    }

    return { x, y };
  }

  findBlockingWallAhead(x, y, dirX, dirY, range = 28) {
    const { gx, gy } = worldToGrid(x, y);
    const check = (dir) => {
      const w = this.wallsMap.get(this._wallKey(gx, gy, dir));
      if (!w || !w.alive) return null;
      const dist = w.axis === 'h' ? Math.abs(y - w.y1) : Math.abs(x - w.x1);
      return dist <= range ? w : null;
    };
    if (Math.abs(dirX) >= Math.abs(dirY)) {
      return check(dirX >= 0 ? 1 : 3) || check(dirY >= 0 ? 2 : 0);
    }
    return check(dirY >= 0 ? 2 : 0) || check(dirX >= 0 ? 1 : 3);
  }

  // Raycast des balles contre les Murs de la grille (bloque sauf ouverture fenêtre d'Edit 0.6s ou High Ground par-dessus mur adjacent !)
  raycastWalls(ax, ay, bx, by, shooterId = -1, shooterHighGround = false) {
    const minGx = Math.floor(Math.min(ax, bx) / CELL_SIZE) - 1;
    const maxGx = Math.floor(Math.max(ax, bx) / CELL_SIZE) + 1;
    const minGy = Math.floor(Math.min(ay, by) / CELL_SIZE) - 1;
    const maxGy = Math.floor(Math.max(ay, by) / CELL_SIZE) + 1;

    let bestT = 2.0;
    let hitWall = null;

    const testWall = (w) => {
      if (!w || !w.alive) return;
      if (shooterHighGround && Math.hypot(w.cx - ax, w.cy - ay) <= CELL_SIZE * 1.15) return;
      const hit = segmentIntersectsSegment(ax, ay, bx, by, w.x1, w.y1, w.x2, w.y2);
      if (!hit) return;

      // Si le mur a une fenêtre éditée ouverte (0.6s), les balles traversent la fenêtre centrale [0.24..0.76] !
      if (w.editTimer > 0 && hit.u >= 0.24 && hit.u <= 0.76) return;

      if (hit.t < bestT) {
        bestT = hit.t;
        hitWall = w;
      }
    };

    for (let gy = minGy; gy <= maxGy + 1; gy++) {
      for (let gx = minGx; gx <= maxGx + 1; gx++) {
        testWall(this.wallsMap.get(`H:${gx},${gy}`));
        testWall(this.wallsMap.get(`V:${gx},${gy}`));
      }
    }

    return hitWall ? { piece: hitWall, t: bestT } : null;
  }

  update(dt) {
    const tickList = (arr, map) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        if (!p.alive) { arr.splice(i, 1); continue; }
        if (p.buildTimer > 0) p.buildTimer = Math.max(0, p.buildTimer - dt);
        if (p.editTimer > 0) p.editTimer = Math.max(0, p.editTimer - dt);
        p.life -= dt;
        if (p.life <= 0) {
          p.alive = false;
          map.delete(p.key);
          arr.splice(i, 1);
        }
      }
    };
    tickList(this.walls, this.wallsMap);
    tickList(this.floors, this.floorsMap);
    tickList(this.stairs, this.stairsMap);
    tickList(this.cones, this.conesMap);
  }

  // Rendu couches basses (Sols, Escaliers avec marches + flèche, Murs avec fenêtre d'Édit bleue)
  renderBase(ctx, view, zoom) {
    const pad = 120;
    const minX = view.minX - pad, maxX = view.maxX + pad;
    const minY = view.minY - pad, maxY = view.maxY + pad;

    // 1. Sols (planches / dalles)
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i];
      if (!f.alive || f.x + CELL_SIZE < minX || f.x > maxX || f.y + CELL_SIZE < minY || f.y > maxY) continue;
      const cfg = MAT_CONFIG[f.material] || MAT_CONFIG.wood;

      ctx.fillStyle = f.buildTimer > 0 ? 'rgba(56, 189, 248, 0.42)' : cfg.floor;
      ctx.fillRect(f.x + 2, f.y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      if (zoom > 0.45) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let s = 15; s < CELL_SIZE; s += 15) {
          ctx.beginPath();
          ctx.moveTo(f.x + 3, f.y + s);
          ctx.lineTo(f.x + CELL_SIZE - 3, f.y + s);
          ctx.stroke();
        }
      }
    }

    // 2. Escaliers / Rampes avec marches + flèche indiquant le sens de montée (High Ground)
    for (let i = 0; i < this.stairs.length; i++) {
      const s = this.stairs[i];
      if (!s.alive || s.x + CELL_SIZE < minX || s.x > maxX || s.y + CELL_SIZE < minY || s.y > maxY) continue;
      const cfg = MAT_CONFIG[s.material] || MAT_CONFIG.wood;

      ctx.save();
      ctx.translate(s.cx, s.cy);
      // dir 0=Haut(-Y), 1=Droite(+X), 2=Bas(+Y), 3=Gauche(-X)
      const rot = s.dir === 0 ? 0 : s.dir === 1 ? Math.PI / 2 : s.dir === 2 ? Math.PI : -Math.PI / 2;
      ctx.rotate(rot);

      ctx.fillStyle = s.buildTimer > 0 ? 'rgba(0, 180, 255, 0.52)' : cfg.floor;
      ctx.fillRect(-30, -30, 60, 60);

      // Marches d'escalier horizontales progressant vers le haut (-Y local)
      ctx.strokeStyle = s.buildTimer > 0 ? '#7dd3fc' : cfg.color;
      ctx.lineWidth = 3;
      for (let yOff = -22; yOff <= 22; yOff += 11) {
        ctx.beginPath();
        ctx.moveTo(-27, yOff);
        ctx.lineTo(27, yOff);
        ctx.stroke();
      }

      // Flèche directionnelle de High Ground pointant vers le sommet
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(10, -8);
      ctx.lineTo(3.5, -8);
      ctx.lineTo(3.5, 20);
      ctx.lineTo(-3.5, 20);
      ctx.lineTo(-3.5, -8);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Murs (barres épaisses bloquantes + couleur équipe + ouverture bleu électrique d'Édit 0.6s)
    ctx.lineCap = 'round';
    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      if (!w.alive) continue;
      if (Math.max(w.x1, w.x2) < minX || Math.min(w.x1, w.x2) > maxX || Math.max(w.y1, w.y2) < minY || Math.min(w.y1, w.y2) > maxY) continue;

      const cfg = MAT_CONFIG[w.material] || MAT_CONFIG.wood;

      if (w.editTimer > 0) {
        // Édit de fenêtre visible (bleu électrique avec ouverture au milieu !)
        const mx1 = w.x1 + (w.x2 - w.x1) * 0.25;
        const my1 = w.y1 + (w.y2 - w.y1) * 0.25;
        const mx2 = w.x1 + (w.x2 - w.x1) * 0.75;
        const my2 = w.y1 + (w.y2 - w.y1) * 0.75;

        ctx.strokeStyle = 'rgba(0, 180, 255, 0.35)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1); ctx.lineTo(mx1, my1);
        ctx.moveTo(mx2, my2); ctx.lineTo(w.x2, w.y2);
        ctx.stroke();

        ctx.strokeStyle = '#00b4ff';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1); ctx.lineTo(mx1, my1);
        ctx.moveTo(mx2, my2); ctx.lineTo(w.x2, w.y2);
        ctx.stroke();

        // Pointillés bleu électrique indiquant la fenêtre ouverte
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(mx1, my1); ctx.lineTo(mx2, my2);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }

      // Halo équipe / propriétaire (montre visuellement les reprises de mur !)
      if (zoom > 0.38) {
        ctx.strokeStyle = w.ownerColor;
        ctx.lineWidth = 11;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = w.buildTimer > 0 ? '#38bdf8' : cfg.color;
      ctx.lineWidth = Math.max(4, 7.5);
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // Indicateur discret de PV si le mur est endommagé
      if (zoom > 0.55 && w.hp < w.maxHp) {
        const ratio = Math.max(0, w.hp / w.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(w.cx - 14, w.cy - 3, 28, 5);
        ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(w.cx - 13, w.cy - 2, 26 * ratio, 3);
      }
    }
  }

  // Rendu des Cônes / Pyramides AU-DESSUS des joueurs (4 triangles en X semi-transparents !)
  renderConesOverlay(ctx, view, zoom) {
    if (zoom < 0.22) return;
    const pad = 120;
    const minX = view.minX - pad, maxX = view.maxX + pad;
    const minY = view.minY - pad, maxY = view.maxY + pad;

    for (let i = 0; i < this.cones.length; i++) {
      const c = this.cones[i];
      if (!c.alive || c.x + CELL_SIZE < minX || c.x > maxX || c.y + CELL_SIZE < minY || c.y > maxY) continue;
      const cfg = MAT_CONFIG[c.material] || MAT_CONFIG.wood;

      const x0 = c.x + 2, y0 = c.y + 2;
      const x1 = c.x + CELL_SIZE - 2, y1 = c.y + CELL_SIZE - 2;

      // 4 triangles formant un X avec un carré au centre, semi-transparents pour voir le joueur caché dessous
      ctx.save();
      ctx.fillStyle = c.buildTimer > 0 ? 'rgba(0, 180, 255, 0.34)' : cfg.cone;
      ctx.beginPath();
      ctx.rect(x0, y0, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.fill();

      ctx.strokeStyle = c.buildTimer > 0 ? 'rgba(125, 211, 252, 0.92)' : 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.moveTo(x1, y0); ctx.lineTo(x0, y1);
      ctx.stroke();

      // Carré central du cône
      const cap = 16;
      ctx.fillStyle = c.buildTimer > 0 ? 'rgba(0, 180, 255, 0.45)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(c.cx - cap * 0.5, c.cy - cap * 0.5, cap, cap);
      ctx.strokeRect(c.cx - cap * 0.5, c.cy - cap * 0.5, cap, cap);

      ctx.strokeStyle = c.ownerColor;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, y0, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.restore();
    }
  }
}

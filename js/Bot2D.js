import { MAP_SIZE, MAP_CENTER, ISLAND_RADIUS, RARITY_COLORS } from './Map2D.js';
import { CELL_SIZE, worldToGrid, gridCenter } from './BuildGrid2D.js';

export const BOT_COUNT = 100;

export const WEAPON_STATS = {
  ar: {
    names: ['AR Commun', 'AR Typique', 'AR Rare', 'SCAR Épique', 'SCAR Or'],
    dmg: [8, 9, 11, 13, 15],
    range: [320, 350, 380, 410, 440],
    cooldown: [1.05, 0.96, 0.88, 0.80, 0.72],
    spread: [0.08, 0.068, 0.056, 0.044, 0.036]
  },
  shotgun: {
    names: ['Pompe Tactique', 'Pompe Typique', 'Pompe Rare', 'Spas-12 Épique', 'Spas-12 Or'],
    dmg: [20, 24, 28, 34, 42],
    range: [115, 120, 125, 135, 145],
    cooldown: [1.45, 1.38, 1.30, 1.22, 1.12],
    spread: [0.09, 0.08, 0.07, 0.06, 0.05]
  },
  smg: {
    names: ['PM Commun', 'PM Typique', 'PM Rare', 'PM Épique', 'PM Or'],
    dmg: [6, 7, 8, 9, 10],
    range: [175, 185, 195, 205, 220],
    cooldown: [0.52, 0.48, 0.44, 0.40, 0.36],
    spread: [0.09, 0.08, 0.07, 0.06, 0.05]
  },
  sniper: {
    names: ['Sniper Chasse', 'Sniper Rare', 'Sniper Épique', 'Sniper Lourd', 'Sniper Or'],
    dmg: [36, 42, 48, 56, 64],
    range: [640, 680, 720, 760, 820],
    cooldown: [2.4, 2.3, 2.2, 2.1, 1.95],
    spread: [0.022, 0.018, 0.015, 0.012, 0.009]
  },
  mini:   { names: ['Mini-Potions', 'Mini-Potions', 'Mini-Potions', 'Mini-Potions', 'Mini-Potions'] },
  bigpot: { names: ['Potion Bouclier', 'Potion Bouclier', 'Potion Bouclier', 'Potion Bouclier', 'Potion Bouclier'] },
  medkit: { names: ['Kit de Soin', 'Kit de Soin', 'Kit de Soin', 'Kit de Soin', 'Kit de Soin'] },
  fish:   { names: ['Poisson Bleu', 'Poisson Bleu', 'Poisson Bleu', 'Poisson Bleu', 'Poisson Bleu'] }
};

export function getItemDisplayName(item) {
  if (!item) return 'Vide';
  const list = WEAPON_STATS[item.kind]?.names;
  return list ? list[item.rarity] || list[0] : item.kind;
}

export function getItemShortName(item) {
  if (!item) return 'VIDE';
  if (item.kind === 'shotgun') return item.rarity >= 3 ? 'SPAS-12' : 'POMPE';
  if (item.kind === 'ar') return item.rarity >= 3 ? 'SCAR' : 'AR';
  if (item.kind === 'smg') return 'PM';
  if (item.kind === 'sniper') return 'SNIPER';
  if (item.kind === 'mini') return 'MINI';
  if (item.kind === 'bigpot') return 'GROSSE POPO';
  if (item.kind === 'medkit') return 'KIT';
  if (item.kind === 'fish') return 'POISSON';
  return item.kind.toUpperCase();
}

// Tags d'équipes & pseudos Esport 100 % propres : AUCUN '_' ni chiffre !
const TEAM_TAGS = [
  'KC', 'KCORP', 'VIT', 'SLY', 'FNC', 'BDS', 'TL', 'OG', 'GL',
  'NRG', 'TSM', 'FAZE', 'SEN', 'NAVI', 'GXR', 'KOI', 'TH',
  'MAD', 'XL', 'VP', 'EG', 'NIP', 'AST', 'SOL', 'LOUD'
];

const PRO_HANDLES = [
  'Kairo', 'Zelox', 'Vexi', 'Soran', 'Lasko', 'Tenzor', 'Ryze', 'Kova',
  'Flux', 'Nyx', 'Zeno', 'Kyro', 'Vade', 'Malix', 'Sypher', 'Astra',
  'Nexo', 'Breso', 'Tayson', 'Veno', 'Queasy', 'Merstach', 'Malibuca', 'Setty',
  'Kami', 'Rezon', 'Jannis', 'Andilex', 'Nayte', 'Floki', 'Vortex', 'Kinstaar',
  'Snayzy', 'Vadeal', 'Acorn', 'Pollo', 'Clix', 'Bugha', 'Peterbot', 'Cold',
  'Khanada', 'Ritual', 'Kiro', 'Zedox', 'Kael', 'Lyra', 'Onyx', 'Xeno',
  'Riven', 'Sylas', 'Jett', 'Talon', 'Draven', 'Krag', 'Kaos', 'Axon',
  'Bane', 'Cyrus', 'Drax', 'Eon', 'Fury', 'Gale', 'Haze', 'Ion',
  'Jinx', 'Kron', 'Lumen', 'Mako', 'Nova', 'Orion', 'Pyro', 'Quill',
  'Raze', 'Sable', 'Torus', 'Umbra', 'Valor', 'Wraith', 'Zephyr', 'Aether',
  'Blaze', 'Crest', 'Drift', 'Echo', 'Frost', 'Glint', 'Hyper', 'Krypt',
  'Lux', 'Mirage', 'Nebula', 'Pulse', 'Quake', 'Reign', 'Spark', 'Titan',
  'Vega', 'Zenith', 'Cinder', 'Soren'
];

const TEAM_COLORS = [
  '#38bdf8', '#f43f5e', '#4ade80', '#fbbf24', '#c084fc',
  '#fb923c', '#22d3ee', '#a3e635', '#ec4899', '#818cf8'
];

function generateCleanEsportNames(count) {
  const handles = [...PRO_HANDLES];
  for (let i = handles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [handles[i], handles[j]] = [handles[j], handles[i]];
  }
  const names = [];
  for (let i = 0; i < count; i++) {
    const tag = TEAM_TAGS[(i * 7 + Math.floor(Math.random() * 3)) % TEAM_TAGS.length];
    const handle = handles[i % handles.length];
    names.push(`${tag} ${handle}`);
  }
  return names;
}

function getSlotForKind(kind) {
  if (kind === 'ar') return 0;
  if (kind === 'shotgun') return 1;
  if (kind === 'smg') return 2;
  if (kind === 'sniper' || kind === 'mini') return 3;
  return 4;
}

function dirVecToGridDir(dx, dy) {
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? 0 : 2; // 0:Haut(-Y), 2:Bas(+Y)
  return dx > 0 ? 1 : 3; // 1:Droite(+X), 3:Gauche(-X)
}

export class BattleBus2D {
  constructor() {
    this.duration = 45.0;
    this.elapsed = 0;
    this.active = true;
    this.x = MAP_CENTER;
    this.y = MAP_CENTER;
    this.angle = 0;
    this.startX = 0;
    this.startY = 0;
    this.endX = MAP_SIZE;
    this.endY = MAP_SIZE;
    this.reset();
  }

  reset() {
    this.elapsed = 0;
    this.active = true;
    const ang = Math.random() * Math.PI * 2;
    const perp = (Math.random() - 0.5) * 1400;
    const dist = ISLAND_RADIUS + 420;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const px = -dy * perp, py = dx * perp;

    this.startX = MAP_CENTER - dx * dist + px;
    this.startY = MAP_CENTER - dy * dist + py;
    this.endX = MAP_CENTER + dx * dist + px;
    this.endY = MAP_CENTER + dy * dist + py;

    this.x = this.startX;
    this.y = this.startY;
    this.angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
  }

  // Assigne un Drop Spot unique à chacun des 100 bots (12 Villes + 45 Petits Spawns)
  assignProDrops(bots, pois, smallSpawns) {
    const slots = [];

    // 1. 12 Villes : 4 ou 5 joueurs par ville (52 places)
    for (let pIdx = 0; pIdx < pois.length; pIdx++) {
      const p = pois[pIdx];
      const cap = pIdx < 4 ? 5 : 4;
      for (let k = 0; k < cap; k++) {
        const ang = (k / cap) * Math.PI * 2 + Math.random() * 0.6;
        const rad = 45 + Math.random() * (p.radius * 0.72);
        slots.push({
          spot: p,
          tx: p.x + Math.cos(ang) * rad,
          ty: p.y + Math.sin(ang) * rad
        });
      }
    }

    // 2. 45 Petits Spawns : 1 à 2 joueurs par petit spawn (48 places)
    const shuffled = [...smallSpawns];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const needTwo = Math.max(0, bots.length - slots.length - shuffled.length);
    for (let sIdx = 0; sIdx < shuffled.length && slots.length < bots.length; sIdx++) {
      const sp = shuffled[sIdx];
      const cap = sIdx < needTwo ? 2 : 1;
      for (let k = 0; k < cap && slots.length < bots.length; k++) {
        const ang = k * Math.PI + Math.random() * 1.2;
        const rad = 18 + Math.random() * 44;
        slots.push({
          spot: sp,
          tx: sp.x + Math.cos(ang) * rad,
          ty: sp.y + Math.sin(ang) * rad
        });
      }
    }

    // Mélange les 100 bots sur les 100 Drop Spots uniques
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const pathDx = this.endX - this.startX;
    const pathDy = this.endY - this.startY;
    const pathLenSq = pathDx * pathDx + pathDy * pathDy || 1;

    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      const slot = slots[i];
      b.state = 'bus';
      b.targetSpot = slot.spot;
      b.dropTargetX = slot.tx;
      b.dropTargetY = slot.ty;

      const proj = ((slot.tx - this.startX) * pathDx + (slot.ty - this.startY) * pathDy) / pathLenSq;
      const tJump = Math.max(0.04, Math.min(0.94, proj - 0.05 + (Math.random() - 0.5) * 0.04));
      b.dropTime = tJump * this.duration;
    }
  }

  update(dt, bots) {
    if (!this.active) return;
    this.elapsed += dt;
    const t = Math.max(0, Math.min(1, this.elapsed / this.duration));
    this.x = this.startX + (this.endX - this.startX) * t;
    this.y = this.startY + (this.endY - this.startY) * t;

    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      if (b.alive && b.state === 'bus' && this.elapsed >= b.dropTime) {
        b.state = 'skydive';
        b.x = this.x + (Math.random() - 0.5) * 24;
        b.y = this.y + (Math.random() - 0.5) * 24;
        b.altitude = 100;
      }
    }

    if (t >= 1) {
      for (let i = 0; i < bots.length; i++) {
        const b = bots[i];
        if (b.alive && b.state === 'bus') {
          b.state = 'skydive';
          b.x = this.x;
          b.y = this.y;
          b.altitude = 100;
        }
      }
      this.active = false;
    }
  }

  render(ctx, zoom) {
    ctx.save();
    // Ligne de trajet du Bus toujours visible tant que le bus vole (ou en vue carte au début)
    if (this.active) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
      ctx.lineWidth = Math.max(4, 3.2 / zoom);
      ctx.setLineDash([28, 18]);
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(this.endX, this.endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dessin du Bus de Combat bleu avec ballon et flamme
      const scale = Math.max(1.0, Math.min(4.2, 1.35 / Math.max(0.18, zoom)));
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(scale, scale);

      // Flamme réacteur
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-26, -6);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();

      // Carrosserie bleue + bande jaune
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-26, -12, 52, 24);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-24, -4, 48, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-26, -12, 52, 24);

      // Pare-brise avant
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(16, -9, 7, 18);

      // Ballon au centre
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class BotManager2D {
  constructor(map, storm, builds, hud) {
    this.map = map;
    this.storm = storm;
    this.builds = builds;
    this.hud = hud;

    this.bus = new BattleBus2D();
    this.bots = [];
    this.aliveCount = BOT_COUNT;
    this.watchedBotIndex = 0;
    this.matchTime = 0;
    this.matchOver = false;

    this.combatZones = [];
    this.tracers = [];
    this.sparks = [];

    this.stats = {
      boxesBuilt: 0,
      editsDone: 0,
      rampRushes: 0,
      thirdParties: 0
    };
  }

  reset() {
    this.bus.reset();
    this.bots = [];
    this.aliveCount = BOT_COUNT;
    this.watchedBotIndex = 0;
    this.matchTime = 0;
    this.matchOver = false;
    this.combatZones = [];
    this.tracers = [];
    this.sparks = [];
    this.stats = { boxesBuilt: 0, editsDone: 0, rampRushes: 0, thirdParties: 0 };

    const names = generateCleanEsportNames(BOT_COUNT);
    for (let i = 0; i < BOT_COUNT; i++) {
      this.bots.push({
        id: i,
        name: names[i],
        teamColor: TEAM_COLORS[i % TEAM_COLORS.length],
        state: 'bus',
        dropTime: 5,
        targetSpot: null,
        dropTargetX: MAP_CENTER,
        dropTargetY: MAP_CENTER,
        x: this.bus.x,
        y: this.bus.y,
        altitude: 100,
        angle: 0,
        hp: 100,
        shield: 0,
        slots: [null, null, null, null, null],
        activeSlot: 0,
        mats: { wood: 80, brick: 40, metal: 20 },
        kills: 0,
        alive: true,
        speed: 98 + Math.random() * 14,
        aiming: false,
        lastDamagerId: -1,
        duelTargetId: -1,
        lastDamagedTime: -999,
        outOfCombatTime: 0,
        coverTimer: 0,
        drinkCooldown: 0,
        harvestCooldown: 0,
        shootCooldown: 0.9 + Math.random() * 1.1,
        buildCooldown: 0,
        reactionCooldown: 0,
        editCooldown: 0,
        tunnelCooldown: 0,
        surgeCooldown: 0,
        rampRushTimer: 0,
        rampRushDir: 0,
        rampRushCooldown: 2 + Math.random() * 4,
        zoneBoxPhase: 0,
        boxAnchorX: MAP_CENTER,
        boxAnchorY: MAP_CENTER,
        thirdPartyActive: false,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        strafeTimer: 0.8 + Math.random() * 1.2,
        detourTimer: 0,
        watchdogTimer: 0,
        watchdogX: this.bus.x,
        watchdogY: this.bus.y,
        stuckAccum: 0,
        pickaxeFlash: 0,
        hopPhase: Math.random() * Math.PI * 2,
        hopHeight: 0,
        lastMoveDirX: 1,
        lastMoveDirY: 0,
        roamX: MAP_CENTER,
        roamY: MAP_CENTER,
        roamTimer: 0,
        hitFlash: 0,
        muzzleFlash: 0
      });
    }

    this.bus.assignProDrops(this.bots, this.map.pois, this.map.smallSpawns);
  }

  getActiveWeaponLabel(bot) {
    const item = bot.slots[bot.activeSlot];
    if (item) return getItemDisplayName(item);
    for (let s = 0; s < 5; s++) {
      if (bot.slots[s]) return getItemDisplayName(bot.slots[s]);
    }
    return 'Pioche';
  }

  findAliveBot(startIdx, dir) {
    for (let step = 1; step <= BOT_COUNT; step++) {
      const idx = (startIdx + dir * step + BOT_COUNT) % BOT_COUNT;
      if (this.bots[idx].alive && this.bots[idx].state !== 'bus') return idx;
    }
    for (let step = 0; step < BOT_COUNT; step++) {
      const idx = (startIdx + dir * step + BOT_COUNT) % BOT_COUNT;
      if (this.bots[idx].alive) return idx;
    }
    return startIdx;
  }

  _totalMats(bot) {
    return bot.mats.wood + bot.mats.brick + bot.mats.metal;
  }

  _pickMaterial(bot, cost = 10) {
    if (bot.mats.wood >= cost) { bot.mats.wood -= cost; return 'wood'; }
    if (bot.mats.brick >= cost) { bot.mats.brick -= cost; return 'brick'; }
    if (bot.mats.metal >= cost) { bot.mats.metal -= cost; return 'metal'; }
    return null;
  }

  _giveItemToBot(bot, kind, rarity, count = 1) {
    const slotIdx = getSlotForKind(kind);
    const cur = bot.slots[slotIdx];
    const isConsumable = kind === 'mini' || kind === 'bigpot' || kind === 'medkit' || kind === 'fish';

    if (!cur) {
      bot.slots[slotIdx] = { kind, rarity, count };
      if (!isConsumable && !bot.slots[bot.activeSlot]) bot.activeSlot = slotIdx;
      return true;
    }
    if (isConsumable && cur.kind === kind) {
      const cap = kind === 'mini' ? 6 : kind === 'bigpot' || kind === 'fish' ? 3 : 2;
      if (cur.count < cap) { cur.count = Math.min(cap, cur.count + count); return true; }
      return false;
    }
    if (slotIdx === 3) {
      if (kind === 'sniper' && (cur.kind !== 'sniper' || rarity > cur.rarity)) {
        bot.slots[3] = { kind, rarity, count: 1 };
        return true;
      }
      return false;
    }
    if (slotIdx === 4) {
      if (cur.count <= 0 || (kind === 'bigpot' && bot.shield < 90 && cur.kind !== 'bigpot')) {
        bot.slots[4] = { kind, rarity, count };
        return true;
      }
      return false;
    }
    if (rarity > cur.rarity) {
      bot.slots[slotIdx] = { kind, rarity, count: 1 };
      return true;
    }
    return false;
  }

  _emitCombatNoise(x, y, aId, bId) {
    for (let i = 0; i < this.combatZones.length; i++) {
      const cz = this.combatZones[i];
      if ((cz.x - x) ** 2 + (cz.y - y) ** 2 < 220 * 220) {
        cz.x = (cz.x + x) * 0.5;
        cz.y = (cz.y + y) * 0.5;
        cz.timer = 7.5;
        if (aId >= 0) cz.fighterA = aId;
        if (bId >= 0) cz.fighterB = bId;
        return;
      }
    }
    if (this.combatZones.length < 24) {
      this.combatZones.push({ x, y, radius: 680, timer: 8.5, maxTimer: 8.5, fighterA: aId, fighterB: bId });
    }
  }

  _buildFullBoxOnGrid(bot) {
    if (this._totalMats(bot) < 40) return false;
    const { gx, gy } = worldToGrid(bot.x, bot.y);
    const c = gridCenter(gx, gy);
    bot.x = c.x + Math.max(-12, Math.min(12, bot.x - c.x));
    bot.y = c.y + Math.max(-12, Math.min(12, bot.y - c.y));
    this.builds.buildFullBox(bot);
    this.stats.boxesBuilt++;
    this._spawnSparks(bot.x, bot.y, '#38bdf8', 6);
    return true;
  }

  _expandDoubleBox(bot, attackerX, attackerY) {
    const mat = this._pickMaterial(bot, 30);
    if (!mat) return;
    const { gx, gy } = worldToGrid(bot.x, bot.y);
    const backDir = dirVecToGridDir(attackerX - bot.x, attackerY - bot.y);
    this.builds.placeWall(gx, gy, backDir, bot.id, bot.teamColor, mat);

    const stepX = backDir === 1 ? -1 : backDir === 3 ? 1 : 0;
    const stepY = backDir === 2 ? -1 : backDir === 0 ? 1 : 0;
    const c = gridCenter(gx + stepX, gy + stepY);
    const fakeTarget = { id: bot.id, teamColor: bot.teamColor, x: c.x, y: c.y, mats: bot.mats };
    this.builds.buildFullBox(fakeTarget, mat);
    this.stats.boxesBuilt++;
  }

  _spawnTracer(sx, sy, tx, ty, shooterId, damage, targetWallOnly = false, isShotgun = false, shooterHighGround = false) {
    const baseAng = Math.atan2(ty - sy, tx - sx);
    const pellets = isShotgun ? 4 : 1;
    for (let p = 0; p < pellets; p++) {
      if (this.tracers.length >= 340) this.tracers.shift();
      const ang = isShotgun ? baseAng + (p - 1.5) * 0.055 : baseAng;
      const speed = 1350;
      this.tracers.push({
        x: sx, y: sy,
        originX: sx, originY: sy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        shooterId,
        damage: damage / pellets,
        targetWallOnly,
        shooterHighGround,
        life: 0.65
      });
    }
  }

  _spawnSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= 420) this.sparks.shift();
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.25 + Math.random() * 0.22,
        maxLife: 0.47,
        color
      });
    }
  }

  _lootEliminatedBot(killer, victim) {
    for (let s = 0; s < 5; s++) {
      const vItem = victim.slots[s];
      if (vItem) this._giveItemToBot(killer, vItem.kind, vItem.rarity, vItem.count);
    }
    killer.mats.wood = Math.min(500, killer.mats.wood + 70 + Math.floor(victim.mats.wood * 0.4));
    killer.mats.brick = Math.min(500, killer.mats.brick + 50 + Math.floor(victim.mats.brick * 0.4));
    killer.mats.metal = Math.min(500, killer.mats.metal + 40 + Math.floor(victim.mats.metal * 0.4));
  }

  _damageBot(victim, amount, attackerId, fromX, fromY, isStormDamage) {
    if (!victim.alive || this.matchOver) return;

    if (!isStormDamage) {
      victim.outOfCombatTime = 0;
      const hadShield = victim.shield > 0;
      const incomingAngle = Math.atan2(fromY - victim.y, fromX - victim.x);
      const angleDiff = Math.abs(Math.atan2(Math.sin(incomingAngle - victim.angle), Math.cos(incomingAngle - victim.angle)));
      const isBackstab =
        attackerId >= 0 &&
        ((victim.duelTargetId >= 0 && victim.duelTargetId !== attackerId) || angleDiff > 1.45);

      victim.lastDamagerId = attackerId;
      victim.lastDamagedTime = this.matchTime;
      victim.hitFlash = 0.14;
      this._emitCombatNoise(victim.x, victim.y, victim.id, attackerId);

      let rem = amount;
      if (victim.shield > 0) {
        const absorbed = Math.min(victim.shield, rem);
        victim.shield -= absorbed;
        rem -= absorbed;
      }
      victim.hp -= rem;

      const lostShield = hadShield && victim.shield <= 0;
      const wounded = victim.hp + victim.shield < 165;
      // Réaction réflexe (< 0.2s) : Pose murs + escalier ou Full Box immédiate pour boire du shield !
      if (victim.hp > 0 && victim.state === 'ground' && victim.reactionCooldown <= 0) {
        if (isBackstab && this._totalMats(victim) >= 30) {
          this._expandDoubleBox(victim, fromX, fromY);
          victim.reactionCooldown = 0.7;
          victim.buildCooldown = 1.6;
          victim.coverTimer = Math.max(victim.coverTimer, 4.8);
          victim.boxAnchorX = victim.x;
          victim.boxAnchorY = victim.y;
        } else if ((lostShield || wounded || victim.hp < 90) && this._totalMats(victim) >= 40) {
          this._buildFullBoxOnGrid(victim);
          victim.reactionCooldown = 0.7;
          victim.buildCooldown = 1.8;
          victim.coverTimer = Math.max(victim.coverTimer, 5.2);
          victim.boxAnchorX = victim.x;
          victim.boxAnchorY = victim.y;
        } else {
          const mat = this._pickMaterial(victim, 20) || this._pickMaterial(victim, 10);
          if (mat) {
            const { gx, gy } = worldToGrid(victim.x, victim.y);
            const dir = dirVecToGridDir(fromX - victim.x, fromY - victim.y);
            this.builds.placeWall(gx, gy, dir, victim.id, victim.teamColor, mat);
            this.builds.placeStairs(gx, gy, dir, victim.id, victim.teamColor, mat);
            victim.reactionCooldown = 0.2;
            victim.buildCooldown = 0.8;
          }
        }
      }
    } else {
      victim.hp -= amount;
    }

    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.alive = false;
      this.aliveCount--;
      this._spawnSparks(victim.x, victim.y, '#38bdf8', 18);

      let killer = null;
      if (attackerId >= 0 && attackerId !== victim.id && this.bots[attackerId]) {
        killer = this.bots[attackerId];
      } else if (isStormDamage && victim.lastDamagerId >= 0 && this.matchTime - victim.lastDamagedTime < 10) {
        killer = this.bots[victim.lastDamagerId];
      }

      if (killer) {
        killer.kills++;
        if (killer.alive) {
          const heal = 20;
          const hpAdd = Math.min(100 - killer.hp, heal);
          killer.hp += hpAdd;
          killer.shield = Math.min(100, killer.shield + (heal - hpAdd));
          this._lootEliminatedBot(killer, victim);
        }
        this.hud.addKill(killer.name, victim.name, false);
      } else {
        this.hud.addKill(null, victim.name, true);
      }

      if (this.watchedBotIndex === victim.id && this.aliveCount > 0) {
        if (killer && killer.alive) {
          this.watchedBotIndex = killer.id;
          this.hud.showToast(`${victim.name} éliminé — Bascule sur ${killer.name}`);
        } else {
          this.watchedBotIndex = this.findAliveBot(victim.id, 1);
          this.hud.showToast(`${victim.name} éliminé — Bascule sur ${this.bots[this.watchedBotIndex].name}`);
        }
      }

      if (this.aliveCount <= 1 && !this.matchOver) {
        this.matchOver = true;
        const winner = this.bots.find((b) => b.alive) || killer || victim;
        if (winner) {
          this.watchedBotIndex = winner.id;
          this.hud.showVictory(winner.name, winner.kills);
        }
      }
    }
  }

  _tryUseConsumables(bot) {
    if (bot.drinkCooldown > 0) return;

    const s3 = bot.slots[3];
    if (s3 && s3.kind === 'mini' && s3.count > 0 && bot.shield < 50) {
      bot.activeSlot = 3;
      bot.shield = Math.min(50, bot.shield + 25);
      s3.count--;
      if (s3.count <= 0) bot.slots[3] = null;
      bot.drinkCooldown = 1.4;
      this._spawnSparks(bot.x, bot.y, '#38bdf8', 5);
      return;
    }

    const s4 = bot.slots[4];
    if (s4 && s4.count > 0) {
      if (s4.kind === 'bigpot' && bot.shield < 90 && (bot.shield >= 50 || !s3 || s3.kind !== 'mini')) {
        bot.activeSlot = 4;
        bot.shield = Math.min(100, bot.shield + 50);
        s4.count--;
        if (s4.count <= 0) bot.slots[4] = null;
        bot.drinkCooldown = 2.0;
        this._spawnSparks(bot.x, bot.y, '#38bdf8', 6);
      } else if (s4.kind === 'medkit' && bot.hp < 78 && (bot.outOfCombatTime > 2.2 || bot.coverTimer > 0)) {
        bot.activeSlot = 4;
        bot.hp = 100;
        s4.count--;
        if (s4.count <= 0) bot.slots[4] = null;
        bot.drinkCooldown = 2.5;
        this._spawnSparks(bot.x, bot.y, '#22c55e', 6);
      } else if (s4.kind === 'fish' && (bot.hp < 82 || bot.shield < 85)) {
        bot.activeSlot = 4;
        const hpGain = Math.min(100 - bot.hp, 40);
        bot.hp += hpGain;
        bot.shield = Math.min(100, bot.shield + (40 - hpGain));
        s4.count--;
        if (s4.count <= 0) bot.slots[4] = null;
        bot.drinkCooldown = 1.1;
        this._spawnSparks(bot.x, bot.y, '#4ade80', 5);
      }
    }
  }

  _chooseCombatWeapon(bot, dist, forceBoxGun = false) {
    if (forceBoxGun) {
      if (bot.slots[1]) { bot.activeSlot = 1; return bot.slots[1]; }
      if (bot.slots[2]) { bot.activeSlot = 2; return bot.slots[2]; }
    }
    if (dist > 360 && bot.slots[3]?.kind === 'sniper') { bot.activeSlot = 3; return bot.slots[3]; }
    if (dist <= 115) {
      if (bot.slots[1]) { bot.activeSlot = 1; return bot.slots[1]; }
      if (bot.slots[2]) { bot.activeSlot = 2; return bot.slots[2]; }
    }
    if (dist <= 185 && bot.slots[2] && !bot.slots[0]) { bot.activeSlot = 2; return bot.slots[2]; }
    if (bot.slots[0]) { bot.activeSlot = 0; return bot.slots[0]; }
    if (bot.slots[2]) { bot.activeSlot = 2; return bot.slots[2]; }
    if (bot.slots[1]) { bot.activeSlot = 1; return bot.slots[1]; }
    if (bot.slots[3]?.kind === 'sniper') { bot.activeSlot = 3; return bot.slots[3]; }
    return null;
  }

  update(dt) {
    this.matchTime += dt;
    this.bus.update(dt, this.bots);

    const phase = this.storm.currentPhaseNumber;
    const isMovingZone = this.storm.isMovingPhase && this.storm.subPhase === 'shrink';
    const isLateGame = this.storm.isLateGame;

    for (let i = this.combatZones.length - 1; i >= 0; i--) {
      this.combatZones[i].timer -= dt;
      if (this.combatZones[i].timer <= 0) this.combatZones.splice(i, 1);
    }

    // Objectif Stacked FNCS : 55 à 65 joueurs en vie au milieu de la partie (Phase 4/5), Moving Zones jusqu'à ~22 min !
    const phaseAggroCap =
      phase === 1 ? 90
      : phase === 2 ? 81
      : phase === 3 ? 72
      : phase === 4 ? 64
      : phase === 5 ? 36
      : phase === 6 ? 20
      : phase === 7 ? 9
      : 0;
    const isCautiousLobby = phase <= 7 && this.aliveCount <= phaseAggroCap;
    const sightRange =
      this.storm.subPhase === 'done' ? 750
      : isCautiousLobby ? (phase >= 7 ? 115 : phase >= 5 ? 30 : 0)
      : phase === 1 ? 105
      : phase <= 4 ? 135
      : phase === 5 ? 165
      : phase === 6 ? 235
      : phase === 7 ? 320
      : 660;
    const sightRangeSq = sightRange * sightRange;

    for (let i = 0; i < BOT_COUNT; i++) {
      const b = this.bots[i];
      if (!b.alive) continue;

      if (b.state === 'bus') {
        b.x = this.bus.x;
        b.y = this.bus.y;
        continue;
      }

      if (b.state === 'skydive' || b.state === 'glider') {
        if (b.state === 'skydive' && b.altitude <= 34) b.state = 'glider';
        const horizSpeed = b.state === 'skydive' ? 245 : 195;
        const altRate = b.state === 'skydive' ? 14.5 : 6.2;

        const dx = b.dropTargetX - b.x;
        const dy = b.dropTargetY - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 6) {
          const step = Math.min(dist, horizSpeed * dt);
          b.x += (dx / dist) * step;
          b.y += (dy / dist) * step;
          b.angle = Math.atan2(dy, dx);
        }

        b.altitude -= altRate * dt;
        if (b.altitude <= 0) {
          b.altitude = 0;
          b.state = 'ground';
          b.roamX = b.x;
          b.roamY = b.y;
          b.roamTimer = 0.5;
          b.watchdogX = b.x;
          b.watchdogY = b.y;
          b.watchdogTimer = 0;
        }
        continue;
      }

      if (b.buildCooldown > 0) b.buildCooldown -= dt;
      if (b.reactionCooldown > 0) b.reactionCooldown -= dt;
      if (b.editCooldown > 0) b.editCooldown -= dt;
      if (b.tunnelCooldown > 0) b.tunnelCooldown -= dt;
      if (b.surgeCooldown > 0) b.surgeCooldown -= dt;
      if (b.shootCooldown > 0) b.shootCooldown -= dt;
      if (b.hitFlash > 0) b.hitFlash -= dt;
      if (b.muzzleFlash > 0) b.muzzleFlash -= dt;
      if (b.pickaxeFlash > 0) b.pickaxeFlash -= dt;
      if (b.coverTimer > 0) b.coverTimer -= dt;
      if (b.drinkCooldown > 0) b.drinkCooldown -= dt;
      if (b.harvestCooldown > 0) b.harvestCooldown -= dt;
      if (b.rampRushTimer > 0) b.rampRushTimer -= dt;
      if (b.rampRushCooldown > 0) b.rampRushCooldown -= dt;
      if (b.detourTimer > 0) b.detourTimer -= dt;
      b.outOfCombatTime += dt;
      b.hopPhase += dt * 4.2;
      b.hopHeight = Math.max(0, Math.sin(b.hopPhase));

      this._tryUseConsumables(b);

      // Dégâts de Tempête
      const distStorm = Math.hypot(b.x - this.storm.x, b.y - this.storm.y);
      if (distStorm > this.storm.radius) {
        this._damageBot(b, this.storm.dps * dt, -1, this.storm.x, this.storm.y, true);
        if (!b.alive) continue;
      }

      // Loot : Coffres dorés & Loot au sol coloré
      let targetLoot = null;
      let targetLootType = null;
      let targetLootDistSq = 380 * 380;
      const needsGear = !b.slots[0] || !b.slots[1] || !b.slots[2] || b.shield < 75;
      if (phase <= 3 && needsGear) {
        for (let c = 0; c < this.map.chests.length; c++) {
          const ch = this.map.chests[c];
          if (ch.opened) continue;
          const d2 = (ch.x - b.x) ** 2 + (ch.y - b.y) ** 2;
          if (d2 < targetLootDistSq) { targetLootDistSq = d2; targetLoot = ch; targetLootType = 'chest'; }
        }
        for (let f = 0; f < this.map.floorLoot.length; f++) {
          const item = this.map.floorLoot[f];
          if (item.picked) continue;
          const d2 = (item.x - b.x) ** 2 + (item.y - b.y) ** 2;
          if (d2 < targetLootDistSq) {
            const sIdx = getSlotForKind(item.kind);
            const cur = b.slots[sIdx];
            if (!cur || item.rarity > cur.rarity || (sIdx >= 3 && cur.kind === item.kind && cur.count < 3)) {
              targetLootDistSq = d2; targetLoot = item; targetLootType = 'floor';
            }
          }
        }
        if (targetLoot && targetLootDistSq < 26 * 26) {
          if (targetLootType === 'chest') {
            targetLoot.opened = true;
            const wChoices = ['ar', 'shotgun', 'smg', 'sniper'];
            const wKind = !b.slots[0] ? 'ar' : !b.slots[1] ? 'shotgun' : wChoices[Math.floor(Math.random() * wChoices.length)];
            this._giveItemToBot(b, wKind, targetLoot.rarity, 1);
            const hChoices = ['mini', 'bigpot', 'medkit', 'fish'];
            const hKind = hChoices[Math.floor(Math.random() * hChoices.length)];
            this._giveItemToBot(b, hKind, hKind === 'mini' || hKind === 'fish' ? 1 : 2, hKind === 'mini' ? 3 : 1);
            b.mats.wood = Math.min(500, b.mats.wood + 50);
            b.mats.brick = Math.min(500, b.mats.brick + 35);
            b.mats.metal = Math.min(500, b.mats.metal + 25);
            this._spawnSparks(targetLoot.x, targetLoot.y, '#facc15', 10);
          } else {
            targetLoot.picked = true;
            this._giveItemToBot(b, targetLoot.kind, targetLoot.rarity, targetLoot.count);
            this._spawnSparks(targetLoot.x, targetLoot.y, RARITY_COLORS[targetLoot.rarity].hex, 6);
          }
          targetLoot = null;
        }
      }

      // Farm actif jusqu'à 500 Bois / 500 Brique / 500 Métal (arbres, rochers & voitures)
      let farmTarget = null;
      let farmKind = null;
      let farmDistSq = 320 * 320;
      const needsFarm = phase <= 4 && (b.mats.wood < 500 || b.mats.brick < 500 || b.mats.metal < 500);
      if (needsFarm) {
        if (b.mats.wood < 500) {
          for (let t = 0; t < this.map.trees.length; t++) {
            const tr = this.map.trees[t];
            if (tr.woodLeft <= 0) continue;
            const d2 = (tr.x - b.x) ** 2 + (tr.y - b.y) ** 2;
            if (d2 < farmDistSq) { farmDistSq = d2; farmTarget = tr; farmKind = 'wood'; }
          }
        }
        if (b.mats.brick < 500) {
          for (let r = 0; r < this.map.rocks.length; r++) {
            const rk = this.map.rocks[r];
            if (rk.brickLeft <= 0) continue;
            const d2 = (rk.x - b.x) ** 2 + (rk.y - b.y) ** 2;
            if (d2 < farmDistSq) { farmDistSq = d2; farmTarget = rk; farmKind = 'brick'; }
          }
        }
        if (b.mats.metal < 500 && this.map.cars) {
          for (let c = 0; c < this.map.cars.length; c++) {
            const cr = this.map.cars[c];
            if (cr.metalLeft <= 0) continue;
            const d2 = (cr.x - b.x) ** 2 + (cr.y - b.y) ** 2;
            if (d2 < farmDistSq) { farmDistSq = d2; farmTarget = cr; farmKind = 'metal'; }
          }
        }

        if (farmTarget && farmDistSq < 36 * 36 && b.harvestCooldown <= 0) {
          b.pickaxeFlash = 0.22;
          b.harvestCooldown = 0.6;
          if (farmKind === 'wood') {
            const gain = Math.min(farmTarget.woodLeft, 65);
            farmTarget.woodLeft -= gain;
            b.mats.wood = Math.min(500, b.mats.wood + gain);
            this._spawnSparks(farmTarget.x, farmTarget.y, '#8b5a2b', 5);
          } else if (farmKind === 'brick') {
            const gain = Math.min(farmTarget.brickLeft, 65);
            farmTarget.brickLeft -= gain;
            b.mats.brick = Math.min(500, b.mats.brick + gain);
            this._spawnSparks(farmTarget.x, farmTarget.y, '#94a3b8', 5);
          } else {
            const gain = Math.min(farmTarget.metalLeft, 65);
            farmTarget.metalLeft -= gain;
            b.mats.metal = Math.min(500, b.mats.metal + gain);
            this._spawnSparks(farmTarget.x, farmTarget.y, '#38bdf8', 5);
          }
        }
      }

      // Recherche d'ennemi (avec bonus portée si sur Escalier High Ground)
      const hasHighGround = this.builds.getHighGroundBonus(b.x, b.y);
      const effSightSq = hasHighGround ? sightRangeSq * 1.32 : sightRangeSq;
      let nearestEnemy = null;
      let nearestDistSq = effSightSq;
      for (let j = 0; j < BOT_COUNT; j++) {
        if (i === j) continue;
        const other = this.bots[j];
        if (!other.alive || other.state !== 'ground') continue;
        const d2 = (other.x - b.x) ** 2 + (other.y - b.y) ** 2;
        if (d2 < nearestDistSq) { nearestDistSq = d2; nearestEnemy = other; }
      }

      // Détection Third-Party ("se faire back") : bruits de Box Fight voisins (surtout Mid/Late Game)
      let thirdPartyTarget = null;
      const hasAnyGun = !!(b.slots[0] || b.slots[1] || b.slots[2] || b.slots[3]?.kind === 'sniper');
      if (!nearestEnemy && phase >= 2 && phase <= 6 && !isCautiousLobby && hasAnyGun && b.hp + b.shield >= 95 && this.combatZones.length > 0) {
        for (let c = 0; c < this.combatZones.length; c++) {
          const cz = this.combatZones[c];
          if (cz.fighterA === b.id || cz.fighterB === b.id) continue;
          if ((cz.x - b.x) ** 2 + (cz.y - b.y) ** 2 < cz.radius * cz.radius) {
            const fa = this.bots[cz.fighterA];
            const fb = this.bots[cz.fighterB];
            const pickA = fa && fa.alive && (!fb || !fb.alive || fa.hp + fa.shield <= fb.hp + fb.shield);
            thirdPartyTarget = pickA ? fa : fb && fb.alive ? fb : null;
            if (thirdPartyTarget) {
              if (!b.thirdPartyActive) {
                b.thirdPartyActive = true;
                this.stats.thirdParties++;
              }
              break;
            }
          }
        }
      }
      if (!thirdPartyTarget) b.thirdPartyActive = false;

      // Ancrage Tempête & Moving Zones
      const toNextX = this.storm.nextX - this.storm.x;
      const toNextY = this.storm.nextY - this.storm.y;
      const toNextLen = Math.hypot(toNextX, toNextY) || 1;
      let safeAnchorX = this.storm.nextX;
      let safeAnchorY = this.storm.nextY;
      if (this.storm.isMovingPhase) {
        const leadFactor = isMovingZone ? 0.42 : 0.2;
        const lead = Math.min(toNextLen, Math.max(0, this.storm.radius * leadFactor));
        safeAnchorX = this.storm.x + (toNextX / toNextLen) * lead;
        safeAnchorY = this.storm.y + (toNextY / toNextLen) * lead;
      }

      const distAnchor = Math.hypot(b.x - safeAnchorX, b.y - safeAnchorY);
      const distNextZone = Math.hypot(b.x - this.storm.nextX, b.y - this.storm.nextY);
      const outsideSafeMargin = distStorm > Math.max(12, this.storm.radius * 0.72);
      const earlyZoneRotate =
        !this.storm.isMovingPhase &&
        phase >= 1 &&
        (this.storm.subPhase === 'shrink' || this.storm.subTimer < 36) &&
        distNextZone > Math.max(24, this.storm.nextRadius * 0.86);
      const mustRotateToNext =
        outsideSafeMargin ||
        earlyZoneRotate ||
        (isMovingZone && distAnchor > Math.max(18, this.storm.radius * 0.48));

      const playPassiveMid =
        (phase === 1 && this.aliveCount <= 88) ||
        (phase >= 2 && phase <= 4 && this.aliveCount <= 78) ||
        (phase === 5 && this.aliveCount <= 44) ||
        (phase === 6 && this.aliveCount <= 26);
      let moveX = 0, moveY = 0, isMoving = true;
      b.aiming = false;
      b.duelTargetId = nearestEnemy ? nearestEnemy.id : -1;

      if (mustRotateToNext) {
        const targetX = outsideSafeMargin && this.storm.isMovingPhase ? this.storm.x : safeAnchorX;
        const targetY = outsideSafeMargin && this.storm.isMovingPhase ? this.storm.y : safeAnchorY;
        const toX = targetX - b.x, toY = targetY - b.y;
        const len = Math.hypot(toX, toY) || 1;
        const baseX = toX / len, baseY = toY / len;
        // Rotation humaine : léger zigzag fluide + coups d'œil gauche/droite
        const weave = isMovingZone ? 0 : Math.sin(this.matchTime * 3.1 + b.id * 1.7) * 0.22;
        moveX = baseX - baseY * weave;
        moveY = baseY + baseX * weave;
        const glance = Math.sin(this.matchTime * 2.4 + b.id) * 0.28;
        b.angle = Math.atan2(baseY, baseX) + glance;

        // Moving Zones : Tarp / Tunnels continus !
        if (isMovingZone && b.tunnelCooldown <= 0) {
          if (this._totalMats(b) < 25) b.mats.wood += 60;
          const mat = this._pickMaterial(b, 15) || 'wood';
          this.builds.buildTunnelStep(b.x, b.y, baseX, baseY, b.id, b.teamColor, mat);
          b.tunnelCooldown = 0.52;
        }
      } else if (targetLoot && (!hasAnyGun || !nearestEnemy || nearestDistSq > 140 * 140)) {
        const toX = targetLoot.x - b.x, toY = targetLoot.y - b.y;
        const len = Math.hypot(toX, toY) || 1;
        moveX = toX / len; moveY = toY / len;
        b.angle = Math.atan2(moveY, moveX);
      } else if (farmTarget && hasAnyGun && (!nearestEnemy || nearestDistSq > 155 * 155)) {
        // Early Game : court d'arbre en rocher en voiture pour monter à 500/500/500 !
        const toX = farmTarget.x - b.x, toY = farmTarget.y - b.y;
        const len = Math.hypot(toX, toY) || 1;
        moveX = toX / len; moveY = toY / len;
        b.angle = Math.atan2(moveY, moveX);
      } else if (b.coverTimer > 0 && phase <= 5) {
        // Reste actif même en plein soin dans sa box (mini jiggle-peek)
        const tgtX = (b.boxAnchorX || b.x) + Math.cos(this.matchTime * 2.8 + b.id) * 11;
        const tgtY = (b.boxAnchorY || b.y) + Math.sin(this.matchTime * 2.5 + b.id) * 11;
        const dx = tgtX - b.x, dy = tgtY - b.y, l = Math.hypot(dx, dy) || 1;
        moveX = dx / l; moveY = dy / l;
        b.angle = Math.atan2(dy, dx) + Math.sin(this.matchTime * 3.0 + b.id) * 0.4;
      } else if (thirdPartyTarget) {
        const toX = thirdPartyTarget.x - b.x, toY = thirdPartyTarget.y - b.y;
        const len = Math.hypot(toX, toY) || 1;
        moveX = toX / len; moveY = toY / len;
        b.angle = Math.atan2(moveY, moveX);
      } else if (nearestEnemy) {
        b.aiming = true;
        const dist = Math.sqrt(nearestDistSq) || 1;
        const dirX = (nearestEnemy.x - b.x) / dist, dirY = (nearestEnemy.y - b.y) / dist;
        b.angle = Math.atan2(dirY, dirX);

        // 1. Prise de hauteur avec Rampe + Mur avant !
        if (
          b.rampRushTimer <= 0 &&
          b.rampRushCooldown <= 0 &&
          b.coverTimer <= 0 &&
          phase <= 6 &&
          !playPassiveMid &&
          dist > 105 && dist < 240 &&
          this._totalMats(b) >= 35
        ) {
          b.rampRushTimer = 1.4;
          b.rampRushDir = dirVecToGridDir(dirX, dirY);
          b.rampRushCooldown = 8.0;
          this.stats.rampRushes++;
        }

        if (b.rampRushTimer > 0 && this._totalMats(b) >= 20) {
          const { gx, gy } = worldToGrid(b.x, b.y);
          const mat = this._pickMaterial(b, 20) || 'wood';
          this.builds.placeStairs(gx, gy, b.rampRushDir, b.id, b.teamColor, mat);
          this.builds.placeWall(gx, gy, b.rampRushDir, b.id, b.teamColor, mat);
          moveX = dirX; moveY = dirY;
        } else {
          // 2. Détection Box Fight : un Mur bloque entre moi et l'adversaire ? (High Ground tire par-dessus les murs adjacents !)
          const mx = b.x + Math.cos(b.angle) * 16;
          const my = b.y + Math.sin(b.angle) * 16;
          const wallHit = this.builds.raycastWalls(mx, my, nearestEnemy.x, nearestEnemy.y, b.id, hasHighGround);

          if (wallHit) {
            const wall = wallHit.piece;
            if (wall.ownerId === b.id) {
              // PROPRIÉTAIRE DU MUR : Édit bleu clair (ouverture 0.6s) -> Tir Pompe Spas-12 -> Refermeture !
              isMoving = false;
              if (b.editCooldown <= 0 && dist <= 135 && b.shootCooldown <= 0) {
                if (this.builds.requestEdit(wall, 0.6)) {
                  this.stats.editsDone++;
                  b.editCooldown = phase <= 5 ? 4.8 : 1.8;
                  const sg = this._chooseCombatWeapon(b, dist, true);
                  const stat = sg ? WEAPON_STATS[sg.kind] : WEAPON_STATS.shotgun;
                  const rIdx = sg ? sg.rarity : 1;
                  this._spawnTracer(mx, my, nearestEnemy.x, nearestEnemy.y, b.id, stat.dmg[rIdx], false, sg?.kind === 'shotgun');
                  b.muzzleFlash = 0.08;
                  b.shootCooldown = phase <= 4 ? 5.2 : phase === 5 ? 3.2 : 1.4;
                  this._emitCombatNoise(b.x, b.y, b.id, nearestEnemy.id);
                }
              }
            } else {
              // ATTAQUANT : S'approche au contact du mur, tire dessus pour le casser et REPRENDRE le mur !
              if (dist > 56) {
                moveX = dirX; moveY = dirY;
              } else {
                isMoving = false;
              }
              if (b.shootCooldown <= 0) {
                const spray = b.slots[2] || b.slots[0] || this._chooseCombatWeapon(b, dist);
                const stat = spray ? WEAPON_STATS[spray.kind] : WEAPON_STATS.ar;
                const rIdx = spray ? spray.rarity : 0;
                const wallDmg = spray?.kind === 'smg' ? 28 : spray?.kind === 'shotgun' ? 45 : 24;
                if (spray) b.activeSlot = getSlotForKind(spray.kind);

                this._spawnTracer(mx, my, wall.cx, wall.cy, b.id, wallDmg, true, false);
                b.muzzleFlash = 0.06;
                b.shootCooldown = stat.cooldown[rIdx] * 1.1;
                this._emitCombatNoise(b.x, b.y, b.id, nearestEnemy.id);

                // Reprise de mur ("Wall Replace") : le mur prend la couleur de l'attaquant + Édit !
                if (wall.hp - wallDmg <= 0 && dist < 80) {
                  const mat = this._pickMaterial(b, 10);
                  if (mat) {
                    const taken = this.builds.placeWall(wall.gx, wall.gy, wall.dir, b.id, b.teamColor, mat, true);
                    if (taken && b.editCooldown <= 0 && this.builds.requestEdit(taken, 0.6)) {
                      this.stats.editsDone++;
                      b.editCooldown = phase <= 4 ? 4.2 : 2.1;
                    }
                  }
                }
              }
            }
          } else {
            // Duel ouvert (ou à travers l'ouverture d'Édit / depuis High Ground)
            b.strafeTimer -= dt;
            if (b.strafeTimer <= 0) {
              b.strafeDir = -b.strafeDir;
              b.strafeTimer = 0.7 + Math.random() * 1.0;
            }
            if ((isLateGame || playPassiveMid) && dist > 110) {
              isMoving = Math.sin(this.matchTime * 1.4 + b.id) > 0.48;
              moveX = -dirY * b.strafeDir; moveY = dirX * b.strafeDir;
            } else if (dist > 190) {
              moveX = dirX * 0.7 - dirY * b.strafeDir * 0.65;
              moveY = dirY * 0.7 + dirX * b.strafeDir * 0.65;
            } else if (dist < 75) {
              moveX = -dirX * 0.5 - dirY * b.strafeDir * 0.85;
              moveY = -dirY * 0.5 + dirX * b.strafeDir * 0.85;
            } else {
              moveX = -dirY * b.strafeDir; moveY = dirX * b.strafeDir;
            }

            if (b.shootCooldown <= 0) {
              const item = this._chooseCombatWeapon(b, dist);
              const stat = item ? WEAPON_STATS[item.kind] : null;
              const rIdx = item ? item.rarity : 0;
              const wDmg = stat ? stat.dmg[rIdx] : 8;
              const wRange = (stat ? stat.range[rIdx] : 110) * (hasHighGround ? 1.18 : 1.0);
              const wCd = stat ? stat.cooldown[rIdx] : 1.05;
              const wSpread = (stat ? stat.spread[rIdx] : 0.085) * (hasHighGround ? 0.78 : 1.0);

              const blockedByBuilding = this.map.segmentHitsWall(mx, my, nearestEnemy.x, nearestEnemy.y);
              if (!blockedByBuilding && dist <= wRange) {
                const aimX = nearestEnemy.x + (Math.random() - 0.5) * dist * wSpread;
                const aimY = nearestEnemy.y + (Math.random() - 0.5) * dist * wSpread;

                const pacingMult =
                  this.storm.subPhase === 'done' ? 0.42
                  : phase === 8 ? 0.52
                  : isCautiousLobby ? 8.8
                  : phase === 7 ? 1.25
                  : phase === 6 ? 2.80
                  : phase === 5 ? 6.10
                  : playPassiveMid ? 9.2
                  : phase === 1 ? 5.6
                  : 4.8;

                this._spawnTracer(mx, my, aimX, aimY, b.id, wDmg, false, item?.kind === 'shotgun', hasHighGround);
                b.muzzleFlash = 0.07;
                this._emitCombatNoise(b.x, b.y, b.id, nearestEnemy.id);
                b.shootCooldown = wCd * pacingMult * (0.85 + Math.random() * 0.4);
              } else {
                b.shootCooldown = 0.25;
              }
            }
          }
        }
      } else {
        const anchorRadius = this.storm.isMovingPhase ? Math.max(24, this.storm.radius * 0.62) : this.storm.nextRadius * 0.78;
        const anchorX = this.storm.isMovingPhase ? safeAnchorX : this.storm.nextX;
        const anchorY = this.storm.isMovingPhase ? safeAnchorY : this.storm.nextY;
        const insideNextSafe = Math.hypot(b.x - anchorX, b.y - anchorY) < anchorRadius;

        // Base d'attente en zone ("Tower / Box Holding" 1x1 ou 2x1 en Brique/Métal avec Cône + Escalier)
        if (phase >= 2 && phase <= 7 && insideNextSafe && b.zoneBoxPhase < phase && b.buildCooldown <= 0) {
          if (this._totalMats(b) < 80 && phase >= 3) b.mats.brick += 80;
          if (this._totalMats(b) >= 60) {
            b.zoneBoxPhase = phase;
            const stairDir = dirVecToGridDir(anchorX - b.x, anchorY - b.y);
            this.builds.buildHoldingBase(b, b.id % 3 === 0, stairDir);
            this.stats.boxesBuilt++;
            this.stats.rampRushes++;
            b.boxAnchorX = b.x;
            b.boxAnchorY = b.y;
            b.buildCooldown = 5.5;
          }
        }

        if (insideNextSafe && b.zoneBoxPhase === phase) {
          // Toujours vivant dans sa 1x1 / 2x1 : jiggle-peek actif + scan + Tags AR/Sniper ("Storm Surge") !
          const paceAng = this.matchTime * 1.9 + b.id * 1.3;
          const targetPaceX = b.boxAnchorX + Math.cos(paceAng) * 14;
          const targetPaceY = b.boxAnchorY + Math.sin(paceAng * 0.85) * 10;
          const dxP = targetPaceX - b.x, dyP = targetPaceY - b.y, dP = Math.hypot(dxP, dyP) || 1;
          moveX = dxP / dP; moveY = dyP / dP;

          // Cherche un joueur en rotation jusqu'à 460px pour mettre des tags Storm Surge
          let surgeTarget = null;
          let bestSurgeD2 = 460 * 460;
          if (hasAnyGun && (phase >= 5 || !isCautiousLobby || this.aliveCount > 62)) {
            for (let j = 0; j < BOT_COUNT; j++) {
              if (j === i) continue;
              const o = this.bots[j];
              if (!o.alive || o.state !== 'ground') continue;
              if (isCautiousLobby && o.hp + o.shield < 125) continue;
              const d2 = (o.x - b.x) ** 2 + (o.y - b.y) ** 2;
              if (d2 < bestSurgeD2) { bestSurgeD2 = d2; surgeTarget = o; }
            }
          }

          if (surgeTarget) {
            b.aiming = true;
            b.angle = Math.atan2(surgeTarget.y - b.y, surgeTarget.x - b.x);
            if (b.surgeCooldown <= 0 && b.shootCooldown <= 0) {
              const mx = b.x + Math.cos(b.angle) * 16;
              const my = b.y + Math.sin(b.angle) * 16;
              const blockedMap = this.map.segmentHitsWall(mx, my, surgeTarget.x, surgeTarget.y);
              if (!blockedMap) {
                const wallHit = this.builds.raycastWalls(mx, my, surgeTarget.x, surgeTarget.y, b.id, true);
                if (wallHit && wallHit.piece.ownerId === b.id && b.editCooldown <= 0) {
                  if (this.builds.requestEdit(wallHit.piece, 0.6)) {
                    this.stats.editsDone++;
                    b.editCooldown = 3.6;
                  }
                }
                const weapon = b.slots[3]?.kind === 'sniper' && bestSurgeD2 > 280 * 280
                  ? b.slots[3]
                  : (b.slots[0] || this._chooseCombatWeapon(b, Math.sqrt(bestSurgeD2)));
                if (weapon && (!wallHit || wallHit.piece.editTimer > 0)) {
                  const stat = WEAPON_STATS[weapon.kind];
                  const rIdx = weapon.rarity;
                  const dist = Math.sqrt(bestSurgeD2);
                  // Tags mesurés pour préserver 55-65 joueurs en vie jusqu'en Phase 5 !
                  const tagMult = isCautiousLobby ? 0.25 : 0.45;
                  this._spawnTracer(
                    mx, my,
                    surgeTarget.x + (Math.random() - 0.5) * dist * 0.08,
                    surgeTarget.y + (Math.random() - 0.5) * dist * 0.08,
                    b.id, Math.max(6, Math.round(stat.dmg[rIdx] * tagMult)), false, false, true
                  );
                  b.activeSlot = getSlotForKind(weapon.kind);
                  b.muzzleFlash = 0.07;
                  b.surgeCooldown = phase <= 4 ? 7.5 + Math.random() * 4.0 : 3.2 + Math.random() * 2.0;
                  b.shootCooldown = 2.0;
                }
              } else {
                b.surgeCooldown = 1.6;
              }
            }
          } else {
            b.angle = Math.atan2(anchorY - b.y, anchorX - b.x) + Math.sin(this.matchTime * 2.1 + b.id) * 0.85;
          }
        } else {
          b.roamTimer -= dt;
          if (b.roamTimer <= 0 || Math.hypot(b.roamX - b.x, b.roamY - b.y) < 35) {
            const ang = Math.random() * Math.PI * 2;
            const rad = Math.random() * Math.max(18, anchorRadius * 0.85);
            b.roamX = anchorX + Math.cos(ang) * rad;
            b.roamY = anchorY + Math.sin(ang) * rad;
            b.roamTimer = 3.5 + Math.random() * 4.0;
          }
          const rx = b.roamX - b.x, ry = b.roamY - b.y, rLen = Math.hypot(rx, ry) || 1;
          const baseX = rx / rLen, baseY = ry / rLen;
          const weave = Math.sin(this.matchTime * 2.7 + b.id) * 0.2;
          moveX = baseX - baseY * weave;
          moveY = baseY + baseX * weave;
          b.angle = Math.atan2(baseY, baseX) + Math.sin(this.matchTime * 2.2 + b.id) * 0.35;
        }
      }

      if (isMoving) {
        let waterBoost = 1.0;
        const doorExit = this.map.getBuildingExitPoint(b.x, b.y, b.x + moveX * 180, b.y + moveY * 180);
        if (doorExit) {
          const dxD = doorExit.x - b.x;
          const dyD = doorExit.y - b.y;
          const dLen = Math.hypot(dxD, dyD) || 1;
          moveX = dxD / dLen;
          moveY = dyD / dLen;
          b.angle = Math.atan2(moveY, moveX);
          b.detourTimer = 0;
        } else if (mustRotateToNext && this.map.getWaterCrossingPoint) {
          const bridgeCross = this.map.getWaterCrossingPoint(b.x, b.y, b.x + moveX * 260, b.y + moveY * 260);
          if (bridgeCross) {
            const dxW = bridgeCross.x - b.x;
            const dyW = bridgeCross.y - b.y;
            const wLen = Math.hypot(dxW, dyW) || 1;
            moveX = dxW / wLen;
            moveY = dyW / wLen;
            b.angle = Math.atan2(moveY, moveX);
            waterBoost = bridgeCross.speedBoost || 1.0;
          }
        }
        const mLen = Math.hypot(moveX, moveY) || 1;
        const speedBoost = (mustRotateToNext && phase <= 4 ? 1.32 : 1.0) * waterBoost;
        const step = b.speed * speedBoost * dt;
        const rawDirX = moveX / mLen;
        const rawDirY = moveY / mLen;
        b.lastMoveDirX = rawDirX;
        b.lastMoveDirY = rawDirY;
        const dirX = b.detourTimer > 0
          ? rawDirX * 0.35 - rawDirY * b.strafeDir * 0.93
          : rawDirX;
        const dirY = b.detourTimer > 0
          ? rawDirY * 0.35 + rawDirX * b.strafeDir * 0.93
          : rawDirY;
        let nx = b.x + dirX * step;
        let ny = b.y + dirY * step;

        let mapRes = this.map.resolveCollisions(nx, ny, 10.5);
        let buildRes = this.builds.resolveCollisions(mapRes.x, mapRes.y, 10.5, b.id);
        nx = buildRes.x;
        ny = buildRes.y;

        if (Math.hypot(nx - b.x, ny - b.y) < step * 0.45) {
          const blocking = this.builds.findBlockingWallAhead(b.x, b.y, rawDirX, rawDirY, 32);
          if (blocking) {
            if (blocking.ownerId === b.id) {
              this.builds.requestEdit(blocking, 0.6);
            } else {
              b.pickaxeFlash = 0.25;
              const broken = this.builds.damagePiece(blocking, 240 * dt);
              if (broken) this._spawnSparks(blocking.cx, blocking.cy, '#d99b52', 8);
            }
          } else {
            // Contournement Steering Behavior (90°)
            const t1x = b.x - rawDirY * b.strafeDir * step;
            const t1y = b.y + rawDirX * b.strafeDir * step;
            mapRes = this.map.resolveCollisions(t1x, t1y, 10.5);
            buildRes = this.builds.resolveCollisions(mapRes.x, mapRes.y, 10.5, b.id);
            if (Math.hypot(buildRes.x - b.x, buildRes.y - b.y) >= step * 0.45) {
              nx = buildRes.x;
              ny = buildRes.y;
              b.detourTimer = 0.85;
            } else {
              b.strafeDir = -b.strafeDir;
              b.detourTimer = 0.85;
            }
          }
        }

        b.x = nx;
        b.y = ny;

        // Watchdog Anti-Stuck (0.5s check < 5px -> 90° steer ; 1.0–1.2s -> Casse le mur/obstacle à la pioche !)
        const holdingInOwnBox = b.zoneBoxPhase === phase && !mustRotateToNext && !targetLoot && !farmTarget && !nearestEnemy;
        if (!holdingInOwnBox) {
          b.watchdogTimer += dt;
          if (b.watchdogTimer >= 0.5) {
            const displaced = Math.hypot(b.x - b.watchdogX, b.y - b.watchdogY);
            b.watchdogX = b.x;
            b.watchdogY = b.y;
            b.watchdogTimer = 0;

            if (displaced < 5) {
              b.stuckAccum += 0.5;
              b.detourTimer = 0.85;
              b.strafeDir = -b.strafeDir;

              if (b.stuckAccum >= 1.0) {
                // Coincé > 1.0–1.2s : sort la Pioche et détruit tout obstacle devant lui, puis fonce tout droit !
                b.pickaxeFlash = 0.35;
                b.detourTimer = 0;
                const bw =
                  this.builds.findBlockingWallAhead(b.x, b.y, b.lastMoveDirX, b.lastMoveDirY, 48) ||
                  this.builds.findBlockingWallAhead(b.x, b.y, dirX, dirY, 48);
                if (bw) {
                  if (bw.ownerId === b.id && bw.editTimer <= 0) {
                    this.builds.requestEdit(bw, 0.8);
                  } else {
                    this.builds.damagePiece(bw, 999);
                  }
                  this._spawnSparks(bw.cx, bw.cy, '#38bdf8', 9);
                }
                const mw =
                  this.map.breakWallAhead(b.x, b.y, b.lastMoveDirX, b.lastMoveDirY, 56) ||
                  this.map.breakWallAhead(b.x, b.y, dirX, dirY, 56) ||
                  this.map.breakWallAhead(b.x, b.y, 0, 0, 50);
                if (mw) {
                  this._spawnSparks(b.x + b.lastMoveDirX * 18, b.y + b.lastMoveDirY * 18, '#cbd5e1', 10);
                } else if (!bw) {
                  for (let t = 0; t < this.map.trees.length; t++) {
                    const tr = this.map.trees[t];
                    if (tr.woodLeft > 0 && (tr.x - b.x) ** 2 + (tr.y - b.y) ** 2 < 48 * 48) {
                      b.mats.wood = Math.min(500, b.mats.wood + tr.woodLeft);
                      tr.woodLeft = 0;
                      this._spawnSparks(tr.x, tr.y, '#8b5a2b', 8);
                      break;
                    }
                  }
                  for (let r = 0; r < this.map.rocks.length; r++) {
                    const rk = this.map.rocks[r];
                    if (rk.brickLeft > 0 && (rk.x - b.x) ** 2 + (rk.y - b.y) ** 2 < 48 * 48) {
                      b.mats.brick = Math.min(500, b.mats.brick + rk.brickLeft);
                      rk.brickLeft = 0;
                      this._spawnSparks(rk.x, rk.y, '#94a3b8', 8);
                      break;
                    }
                  }
                  for (let c = 0; c < this.map.cars.length; c++) {
                    const cr = this.map.cars[c];
                    if (cr.metalLeft > 0 && (cr.x - b.x) ** 2 + (cr.y - b.y) ** 2 < 48 * 48) {
                      b.mats.metal = Math.min(500, b.mats.metal + cr.metalLeft);
                      cr.metalLeft = 0;
                      this._spawnSparks(cr.x, cr.y, '#38bdf8', 8);
                      break;
                    }
                  }
                }
                b.stuckAccum = 0.25;
              }
            } else {
              b.stuckAccum = 0;
            }
          }
        } else {
          b.watchdogTimer = 0;
          b.watchdogX = b.x;
          b.watchdogY = b.y;
          b.stuckAccum = 0;
        }
      }
    }

    this._updateTracers(dt);
    this._updateSparks(dt);
  }

  _updateTracers(dt) {
    for (let t = this.tracers.length - 1; t >= 0; t--) {
      const tr = this.tracers[t];
      const ox = tr.x, oy = tr.y;
      tr.x += tr.vx * dt;
      tr.y += tr.vy * dt;
      tr.life -= dt;

      // 1. Mur de bâtiment solide
      if (this.map.segmentHitsWall(ox, oy, tr.x, tr.y)) {
        this._spawnSparks((ox + tr.x) * 0.5, (oy + tr.y) * 0.5, '#cbd5e1', 3);
        this.tracers.splice(t, 1);
        continue;
      }

      // 2. Murs de BuildGrid2D (bloque sauf fenêtre d'Edit bleue ou High Ground par-dessus mur adjacent !)
      const nearOrigin = tr.shooterHighGround && Math.hypot(ox - tr.originX, oy - tr.originY) <= 84;
      const buildHit = this.builds.raycastWalls(ox, oy, tr.x, tr.y, tr.shooterId, nearOrigin);
      const maxT = buildHit ? buildHit.t : 1.0;

      // 3. Touche un bot avant le mur ?
      let botHit = null;
      let bestT = maxT;
      if (!tr.targetWallOnly) {
        const sx = tr.x - ox, sy = tr.y - oy;
        const sLenSq = sx * sx + sy * sy || 1;
        for (let j = 0; j < BOT_COUNT; j++) {
          const target = this.bots[j];
          if (!target.alive || target.state !== 'ground' || target.id === tr.shooterId) continue;
          const proj = ((target.x - ox) * sx + (target.y - oy) * sy) / sLenSq;
          if (proj < 0 || proj > bestT) continue;
          const px = ox + sx * proj;
          const py = oy + sy * proj;
          if ((target.x - px) ** 2 + (target.y - py) ** 2 < 14 * 14) {
            bestT = proj;
            botHit = target;
          }
        }
      }

      if (botHit) {
        this._damageBot(botHit, tr.damage, tr.shooterId, ox, oy, false);
        this._spawnSparks(botHit.x, botHit.y, '#ef4444', 4);
        this.tracers.splice(t, 1);
        continue;
      }

      if (buildHit) {
        const hx = ox + (tr.x - ox) * buildHit.t;
        const hy = oy + (tr.y - oy) * buildHit.t;
        const wall = buildHit.piece;
        const broken = this.builds.damagePiece(wall, Math.max(12, tr.damage * 1.4));
        this._spawnSparks(hx, hy, broken ? '#facc15' : '#38bdf8', broken ? 8 : 3);
        this.tracers.splice(t, 1);
        continue;
      }

      if (tr.life <= 0) this.tracers.splice(t, 1);
    }
  }

  _updateSparks(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vx *= 0.9;
      sp.vy *= 0.9;
      sp.life -= dt;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }
  }

  render(ctx, view, zoom, watchedIndex) {
    const pad = 120;
    const minX = view.minX - pad, maxX = view.maxX + pad;
    const minY = view.minY - pad, maxY = view.maxY + pad;

    // 1. Ondes sonores de combat (Third-Party radar subtil)
    if (zoom > 0.2) {
      for (let i = 0; i < this.combatZones.length; i++) {
        const cz = this.combatZones[i];
        const alpha = (cz.timer / cz.maxTimer) * 0.25;
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.lineWidth = Math.max(2, 2 / zoom);
        ctx.beginPath();
        ctx.arc(cz.x, cz.y, cz.radius * (1 - (cz.timer / cz.maxTimer) * 0.35), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 2. Joueurs (Adaptatif : Points tactiques FNCS en dézoomé vs Personnages ZombsRoyale/Surviv.io en zoomé)
    const dotMode = zoom < 0.34;
    for (let i = 0; i < BOT_COUNT; i++) {
      const b = this.bots[i];
      if (!b.alive || b.state === 'bus') continue;
      if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;

      const isWatched = i === watchedIndex;

      if (dotMode) {
        const r = isWatched ? 8 / zoom : 5.2 / zoom;
        if (isWatched) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.arc(b.x, b.y, r * 1.65, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = b.teamColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isWatched ? '#ffffff' : '#0f172a';
        ctx.lineWidth = (isWatched ? 2.5 : 1.2) / zoom;
        ctx.stroke();
      } else {
        ctx.save();
        ctx.translate(b.x, b.y);
        const airScale = (1 + b.altitude * 0.008) * (b.state === 'ground' ? 1 + (b.hopHeight || 0) * 0.11 : 1);
        ctx.scale(airScale, airScale);

        // Halo blanc si joueur suivi
        if (isWatched) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 17, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Planeur déployé
        if (b.state === 'glider') {
          ctx.save();
          ctx.rotate(b.angle);
          ctx.fillStyle = b.teamColor;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        ctx.rotate(b.angle);
        // Ombre au sol
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.arc(3, 3, 11, 0, Math.PI * 2);
        ctx.fill();

        // Pioche active (récolte ou casse de mur bloquant)
        if (b.pickaxeFlash > 0 && b.state === 'ground') {
          ctx.save();
          ctx.rotate(-0.6 + b.pickaxeFlash * 4.0);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(22, 0);
          ctx.stroke();
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(19, -7, 4, 14);
          ctx.restore();
        } else {
          // Arme tenue en main (+X local = devant)
          const active = b.slots[b.activeSlot];
          if (active && b.state === 'ground') {
            if (active.kind === 'mini' || active.kind === 'bigpot' || active.kind === 'medkit' || active.kind === 'fish') {
              ctx.fillStyle = active.kind === 'medkit' ? '#ef4444' : '#38bdf8';
              ctx.beginPath();
              ctx.arc(13, 4, 4.5, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = '#0f172a';
              const len = active.kind === 'sniper' ? 24 : active.kind === 'ar' ? 19 : active.kind === 'shotgun' ? 16 : 14;
              ctx.fillRect(6, 2, len, 4.2);
              ctx.fillStyle = RARITY_COLORS[active.rarity].hex;
              ctx.fillRect(8, 2.5, 6, 3.2);
              if (b.muzzleFlash > 0) {
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.arc(6 + len + 4, 4, 6, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // Mains + Corps + Tête (style Surviv.io / ZombsRoyale)
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(10, 6, 3.8, 0, Math.PI * 2);
        ctx.arc(9, -6, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : b.teamColor;
        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(1, 0, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Pseudo Esport + mini barre PV/Shield en vue rapprochée
        if (zoom >= 0.45) {
          ctx.save();
          ctx.font = '800 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          const tagY = b.y - 20;
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.strokeText(b.name, b.x, tagY);
          ctx.fillStyle = isWatched ? '#fde047' : '#ffffff';
          ctx.fillText(b.name, b.x, tagY);

          // Mini barres PV & Shield sous le pseudo
          const bw = 28;
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect(b.x - bw * 0.5, tagY + 3, bw, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(b.x - bw * 0.5, tagY + 3, bw * Math.max(0, b.hp / 100), 3);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(b.x - bw * 0.5, tagY + 6, bw * Math.max(0, b.shield / 100), 3);
          ctx.restore();
        }
      }
    }

    // 3. Traînées de balles & Étincelles
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = Math.max(2, 2.2 / zoom);
    for (let i = 0; i < this.tracers.length; i++) {
      const tr = this.tracers[i];
      ctx.beginPath();
      ctx.moveTo(tr.x, tr.y);
      ctx.lineTo(tr.x - tr.vx * 0.025, tr.y - tr.vy * 0.025);
      ctx.stroke();
    }

    for (let i = 0; i < this.sparks.length; i++) {
      const sp = this.sparks[i];
      ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(2.5, 3.5 / Math.max(0.4, zoom)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

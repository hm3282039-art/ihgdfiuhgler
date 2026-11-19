export const MAP_SIZE = 8000;
export const MAP_CENTER = 4000;
export const ISLAND_RADIUS = 3450;

export const RARITY_COLORS = [
  { name: 'Commun', hex: '#7f8c8d', glow: 'rgba(127, 140, 141, 0.45)' },
  { name: 'Typique', hex: '#2ecc71', glow: 'rgba(46, 204, 113, 0.55)' },
  { name: 'Rare', hex: '#3498db', glow: 'rgba(52, 152, 219, 0.60)' },
  { name: 'Épique', hex: '#9b59b6', glow: 'rgba(155, 89, 182, 0.65)' },
  { name: 'Légendaire', hex: '#f1c40f', glow: 'rgba(241, 196, 15, 0.72)' }
];

// 12 Villes Originales réparties asymétriquement par quartiers & biomes
export const POIS = [
  { id: 0,  name: 'Apex Citadel',   x: 3920, y: 3960, radius: 245, color: '#38bdf8', theme: 'citadel', layout: 'citadel',  angle: 0.08 },
  { id: 1,  name: 'Hyperion Plaza', x: 2560, y: 2940, radius: 285, color: '#e879f9', theme: 'plaza',   layout: 'grid',     angle: -0.18 },
  { id: 2,  name: 'Neon District',  x: 5380, y: 3420, radius: 290, color: '#22d3ee', theme: 'neon',    layout: 'avenue',   angle: 0.34 },
  { id: 3,  name: 'Echo Valley',    x: 4220, y: 1860, radius: 260, color: '#86efac', theme: 'valley',  layout: 'mainst',   angle: -0.25 },
  { id: 4,  name: 'Lotus Temple',   x: 2040, y: 1820, radius: 250, color: '#f87171', theme: 'temple',  layout: 'temple',   angle: 0.14 },
  { id: 5,  name: 'Solar Factory',  x: 5840, y: 1880, radius: 270, color: '#facc15', theme: 'factory', layout: 'industry', angle: -0.32 },
  { id: 6,  name: 'Dusty Canyon',   x: 1580, y: 4680, radius: 265, color: '#fb923c', theme: 'canyon',  layout: 'canyon',   angle: 0.42 },
  { id: 7,  name: 'Emerald Woods',  x: 6420, y: 4460, radius: 260, color: '#4ade80', theme: 'woods',   layout: 'lodges',   angle: -0.12 },
  { id: 8,  name: 'Velvet Palms',   x: 2240, y: 6080, radius: 265, color: '#fde047', theme: 'palms',   layout: 'strip',    angle: 0.22 },
  { id: 9,  name: 'Crystal Bay',    x: 4420, y: 6280, radius: 260, color: '#67e8f9', theme: 'bay',     layout: 'promenade',angle: -0.22 },
  { id: 10, name: 'Cyber Port',     x: 6180, y: 5840, radius: 275, color: '#a78bfa', theme: 'port',    layout: 'docks',    angle: 0.15 },
  { id: 11, name: 'Shadow Docks',   x: 3120, y: 6760, radius: 245, color: '#94a3b8', theme: 'docks',   layout: 'swampdock',angle: -0.38 }
];

// 4 Petites îles secondaires autour de l'île principale (ponts ou tyroliennes)
const SATELLITE_ISLANDS = [
  { x: 1040, y: 1320, rx: 320, ry: 230, rot: -0.45, bridgeTo: [1480, 1740], link: 'bridge', name: 'Îlot Boréal' },
  { x: 7160, y: 2440, rx: 280, ry: 310, rot: 0.35,  bridgeTo: [6620, 2680], link: 'zipline', name: 'Récif Solaire' },
  { x: 6960, y: 6680, rx: 310, ry: 250, rot: -0.25, bridgeTo: [6480, 6200], link: 'bridge', name: 'Cap Cyber' },
  { x: 1140, y: 6560, rx: 270, ry: 290, rot: 0.52,  bridgeTo: [1680, 6120], link: 'zipline', name: 'Atoll Brûlant' }
];

// Bruit 2D déterministe multi-fréquences pour côtes, biomes et courbes de niveau
function hash2(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noise2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2D(x, y) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    val += amp * noise2D(x * freq, y * freq);
    freq *= 2.04;
    amp *= 0.5;
  }
  return val; // [0..0.94]
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function segmentIntersectsSegment(ax, ay, bx, by, cx, cy, dx, dy) {
  const ccw = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  return (
    ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
    ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
  );
}

function sampleCubicBezier(p0, p1, p2, p3, steps) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    out.push([x, y]);
  }
  return out;
}

export class Map2D {
  constructor() {
    this.pois = POIS;
    this.satellites = SATELLITE_ISLANDS;
    this.lakeCenter = { x: 3920, y: 3960 };
    this.rivers = this._buildRiverPaths();
    this.highwaySegments = this._buildHighwayCurves();
    this.spurRoads = this._buildSpurRoads();
    this.bridges = [];
    this.ziplines = [];
    this.streets = [];
    this.parkingLots = [];
    this.smallSpawns = [];
    this.buildings = [];
    this.wallSegments = [];
    this.trees = [];
    this.rocks = [];
    this.cars = [];
    this.chests = [];
    this.floorLoot = [];

    this.gridCell = 250;
    this.gridDim = Math.ceil(MAP_SIZE / this.gridCell);
    this.wallBuckets = Array.from({ length: this.gridDim * this.gridDim }, () => []);

    this._generateSmallSpawns();
    this._generateBuildingsAndSpawns();
    this._generateProps();
    this._generateChests();
    this._generateFloorLoot();
    this._buildBridgesAndZiplines();
    this.terrainCanvas = this._bakeTerrainBitmap();
  }

  // Distance côtière très asymétrique (8 ondes sinusoïdales + bruit 2D -> baies, péninsules & criques)
  getCoastRadius(angle) {
    return (
      ISLAND_RADIUS *
      (0.95 +
        0.13 * Math.sin(angle * 2.0 - 0.8) +
        0.095 * Math.cos(angle * 3.0 + 0.55) +
        0.07 * Math.sin(angle * 4.0 + 1.9) +
        0.055 * Math.cos(angle * 5.0 - 1.1) +
        0.04 * Math.sin(angle * 7.0 + 0.3) +
        0.03 * Math.cos(angle * 9.0 + 2.2) +
        0.022 * Math.sin(angle * 11.0 - 0.6) +
        0.015 * Math.cos(angle * 13.0 + 1.4))
    );
  }

  // Distance côtière du Grand Lac Central (style Loot Lake) et de son îlot central
  getLakeOuterRadius(angle) {
    return 520 + 62 * Math.sin(angle * 3 + 0.7) + 38 * Math.cos(angle * 5 - 1.2) + 22 * Math.sin(angle * 7 + 0.2);
  }

  getLakeIslandRadius(angle) {
    return 255 + 24 * Math.sin(angle * 3 - 0.5) + 15 * Math.cos(angle * 5 + 1.1);
  }

  // Élévation normalisée [0..1] pour relief & courbes de niveau
  getElevation(x, y) {
    const n = fbm2D(x * 0.00055 + 11.3, y * 0.00055 + 4.7);
    const neMountain = Math.max(0, 1 - Math.hypot(x - 5450, y - 1650) / 1950);
    const nwRidge = Math.max(0, 1 - Math.hypot(x - 2150, y - 1750) / 1450);
    const swMesa = Math.max(0, 1 - Math.hypot(x - 1620, y - 4750) / 1200);
    const lakeBowl = Math.max(0, 1 - Math.hypot(x - this.lakeCenter.x, y - this.lakeCenter.y) / 760);
    return Math.max(0, Math.min(1, n * 0.55 + neMountain * 0.45 + nwRidge * 0.22 + swMesa * 0.18 - lakeBowl * 0.35));
  }

  _isOnSatelliteIsland(x, y) {
    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      const dx = x - sat.x;
      const dy = y - sat.y;
      const ca = Math.cos(-sat.rot), sa = Math.sin(-sat.rot);
      const lx = dx * ca - dy * sa;
      const ly = dx * sa + dy * ca;
      const ang = Math.atan2(ly, lx);
      const wob = 1 + 0.12 * Math.sin(ang * 3 + i) + 0.07 * Math.cos(ang * 5 - i);
      const norm = Math.hypot(lx / (sat.rx * wob), ly / (sat.ry * wob));
      if (norm < 1.0) return sat;
    }
    return null;
  }

  _isMainIslandShape(x, y) {
    const dx = x - MAP_CENTER;
    const dy = y - MAP_CENTER;
    const r = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const n = (fbm2D(x * 0.00065 + 3.1, y * 0.00065 + 8.4) - 0.47) * 380;
    return r < this.getCoastRadius(ang) + n;
  }

  isInCentralLake(x, y) {
    const dx = x - this.lakeCenter.x;
    const dy = y - this.lakeCenter.y;
    const r = Math.hypot(dx, dy);
    if (r > 620) return false;
    const ang = Math.atan2(dy, dx);
    return r < this.getLakeOuterRadius(ang) && r > this.getLakeIslandRadius(ang);
  }

  isLand(x, y) {
    if (x < 90 || x > MAP_SIZE - 90 || y < 90 || y > MAP_SIZE - 90) return false;
    if (this._isOnSatelliteIsland(x, y)) return true;
    if (!this._isMainIslandShape(x, y)) return false;
    // Le lac central est de l'eau, sauf sur l'îlot d'Apex Citadel ou sur les ponts
    if (this.isInCentralLake(x, y)) return false;
    return true;
  }

  // Terrain sec incluant les ponts du lac pour le placement des bâtiments et routes
  isDryOrBridge(x, y) {
    if (this.isLand(x, y)) return true;
    for (let i = 0; i < this.bridges.length; i++) {
      const br = this.bridges[i];
      if (Math.hypot(x - br.x, y - br.y) < 85) return true;
    }
    return false;
  }

  isBeach(x, y) {
    const sat = this._isOnSatelliteIsland(x, y);
    if (sat) {
      const dx = x - sat.x, dy = y - sat.y;
      return Math.hypot(dx / sat.rx, dy / sat.ry) > 0.78;
    }
    if (!this._isMainIslandShape(x, y)) return false;
    // Petite plage sablonneuse autour du lac central et du littoral
    const ldx = x - this.lakeCenter.x, ldy = y - this.lakeCenter.y;
    const lr = Math.hypot(ldx, ldy);
    const lAng = Math.atan2(ldy, ldx);
    if (lr >= this.getLakeOuterRadius(lAng) - 22 && lr < this.getLakeOuterRadius(lAng) + 48) return true;

    const dx = x - MAP_CENTER, dy = y - MAP_CENTER;
    const r = Math.hypot(dx, dy);
    const coast = this.getCoastRadius(Math.atan2(dy, dx)) + (fbm2D(x * 0.00065 + 3.1, y * 0.00065 + 8.4) - 0.47) * 380;
    return r >= coast - 110 && r < coast;
  }

  // Biomes 100 % organiques pilotés par coordonnées + bruit multi-fréquences (ZÉRO ronds !)
  getBiome(x, y) {
    if (!this.isLand(x, y)) return 'water';
    if (this.isBeach(x, y)) return 'sand';

    const warpX = (fbm2D(x * 0.00045 + 1.2, y * 0.00045 + 5.9) - 0.47) * 950;
    const warpY = (fbm2D(x * 0.00045 + 7.7, y * 0.00045 + 2.3) - 0.47) * 950;
    const wx = x + warpX;
    const wy = y + warpY;

    // Nord-Est : Montagnes enneigées
    if (wx > 3750 && wy < 3250 && (wx * 0.55 - wy) > 120) return 'snow';
    // Péninsule Sud-Ouest : Désert aride
    if (wx < 3250 && wy > 3950 && (wy - wx * 0.65) > 2250) return 'desert';
    // Marais du Sud / Sud-Est
    if (wy > 5350 && wx >= 3050 && wx < 5950) return 'swamp';
    // Forêt dense à l'Est
    if (wx > 5300 && wy >= 3100 && wy < 5800) return 'forest';
    return 'grass';
  }

  _buildRiverPaths() {
    // 3 rivières naturelles sinueuses partant du Grand Lac Central vers l'océan
    const rNorth = [
      [3860, 3440], [3640, 2980], [3380, 2520], [3620, 2020],
      [3460, 1480], [3180, 980], [3260, 420]
    ];
    const rEast = [
      [4450, 3980], [4920, 4180], [5380, 3960], [5920, 4240],
      [6480, 4050], [7080, 4260], [7680, 4120]
    ];
    const rSouth = [
      [3980, 4480], [3820, 4980], [4120, 5480], [3760, 6020],
      [3980, 6580], [4280, 7120], [4420, 7720]
    ];
    return [rNorth, rEast, rSouth];
  }

  _buildHighwayCurves() {
    // UNE grande autoroute principale qui serpente en boucle asymétrique via courbes de Bézier cubiques
    return [
      { p0: [2480, 2050], p1: [3450, 1420], p2: [4650, 1520], p3: [5680, 2040] },
      { p0: [5680, 2040], p1: [6480, 2550], p2: [6520, 3780], p3: [6180, 4620] },
      { p0: [6180, 4620], p1: [5860, 5480], p2: [5280, 6220], p3: [4280, 6320] },
      { p0: [4280, 6320], p1: [3220, 6440], p2: [2150, 6040], p3: [1740, 4880] },
      { p0: [1740, 4880], p1: [1420, 3920], p2: [1820, 2680], p3: [2480, 2050] }
    ];
  }

  _buildSpurRoads() {
    // Chemins secondaires sinueux reliant l'autoroute principale aux villes (zéro toile d'araignée)
    const samples = [];
    for (const seg of this.highwaySegments) {
      samples.push(...sampleCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, 18));
    }

    const spurs = [];
    for (const poi of this.pois) {
      let best = samples[0];
      let bestD = Infinity;
      for (const s of samples) {
        const d = Math.hypot(s[0] - poi.x, s[1] - poi.y);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (bestD < 110) continue;
      const mx = (best[0] + poi.x) * 0.5 + Math.sin(poi.id * 2.1) * 140;
      const my = (best[1] + poi.y) * 0.5 + Math.cos(poi.id * 1.7) * 140;
      spurs.push({ x1: best[0], y1: best[1], cx: mx, cy: my, x2: poi.x, y2: poi.y });
    }
    return spurs;
  }

  getRiverDistance(x, y) {
    let minD = 99999;
    for (let r = 0; r < this.rivers.length; r++) {
      const pts = this.rivers[r];
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distToSegment(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        if (d < minD) minD = d;
      }
    }
    // Distance aux rives du lac central
    const dl = Math.hypot(x - this.lakeCenter.x, y - this.lakeCenter.y);
    const lAng = Math.atan2(y - this.lakeCenter.y, x - this.lakeCenter.x);
    const outer = this.getLakeOuterRadius(lAng);
    const inner = this.getLakeIslandRadius(lAng);
    if (dl > inner && dl < outer) return 0;
    if (dl <= inner) minD = Math.min(minD, inner - dl);
    else if (dl >= outer) minD = Math.min(minD, dl - outer);
    return minD;
  }

  // Génère exactement 45 Petits Spawns (Split Drops) sur l'île principale et les 4 îles secondaires
  _generateSmallSpawns() {
    const spawns = [];
    const types = ['house', 'station', 'camp', 'radio', 'barn', 'lighthouse'];
    const golden = 2.399963229728653;

    // 1 Petit Spawn dédié sur chacune des 4 petites îles secondaires
    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      spawns.push({
        id: 100 + spawns.length,
        name: sat.name,
        type: i % 2 === 0 ? 'lighthouse' : 'camp',
        x: sat.x,
        y: sat.y,
        radius: 95
      });
    }

    let step = 0;
    while (spawns.length < 45 && step < 5000) {
      step++;
      const isCoastal = spawns.length < 13;
      const rNorm = (spawns.length + 0.5) / 45;
      const r = isCoastal
        ? 2480 + ((step * 113) % 860)
        : 640 + ((step * 179) % 2450) * 0.88 + Math.sqrt(rNorm) * 420;
      const ang = step * golden + (step % 7) * 0.19;
      const sx = Math.round(MAP_CENTER + Math.cos(ang) * r);
      const sy = Math.round(MAP_CENTER + Math.sin(ang) * r);

      if (!this.isLand(sx, sy) || this.isBeach(sx, sy)) continue;
      if (this.getRiverDistance(sx, sy) < 95) continue;

      let bad = false;
      for (const p of this.pois) {
        if (Math.hypot(sx - p.x, sy - p.y) < p.radius + 235) { bad = true; break; }
      }
      if (bad) continue;

      const minDist = step > 1000 ? 310 : 395;
      for (const s of spawns) {
        if (Math.hypot(sx - s.x, sy - s.y) < minDist) { bad = true; break; }
      }
      if (bad) continue;

      const type = isCoastal ? (spawns.length % 2 === 0 ? 'lighthouse' : 'camp') : types[spawns.length % 5];
      spawns.push({
        id: 100 + spawns.length,
        name: `Avant-Poste ${spawns.length + 1}`,
        type,
        x: sx,
        y: sy,
        radius: 95
      });
    }
    this.smallSpawns = spawns;
    return spawns;
  }

  _registerWallSeg(x1, y1, x2, y2, thickness, color) {
    const seg = { x1, y1, x2, y2, thickness, color, alive: true };
    this.wallSegments.push(seg);
    this._indexWallSeg(seg);
    return seg;
  }

  _indexWallSeg(seg) {
    const minGx = Math.max(0, Math.floor((Math.min(seg.x1, seg.x2) - 24) / this.gridCell));
    const maxGx = Math.min(this.gridDim - 1, Math.floor((Math.max(seg.x1, seg.x2) + 24) / this.gridCell));
    const minGy = Math.max(0, Math.floor((Math.min(seg.y1, seg.y2) - 24) / this.gridCell));
    const maxGy = Math.min(this.gridDim - 1, Math.floor((Math.max(seg.y1, seg.y2) + 24) / this.gridCell));
    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        this.wallBuckets[gy * this.gridDim + gx].push(seg);
      }
    }
  }

  // Permet aux bots bloqués de casser à la pioche le mur de bâtiment juste devant eux !
  breakWallAhead(x, y, dirX, dirY, range = 36) {
    const cgx = Math.max(0, Math.min(this.gridDim - 1, Math.floor(x / this.gridCell)));
    const cgy = Math.max(0, Math.min(this.gridDim - 1, Math.floor(y / this.gridCell)));
    let bestSeg = null;
    let bestDist = range;
    const px = x + dirX * 14;
    const py = y + dirY * 14;
    for (let gy = Math.max(0, cgy - 1); gy <= Math.min(this.gridDim - 1, cgy + 1); gy++) {
      for (let gx = Math.max(0, cgx - 1); gx <= Math.min(this.gridDim - 1, cgx + 1); gx++) {
        const bucket = this.wallBuckets[gy * this.gridDim + gx];
        for (let i = 0; i < bucket.length; i++) {
          const s = bucket[i];
          if (!s.alive) continue;
          const d = distToSegment(px, py, s.x1, s.y1, s.x2, s.y2);
          if (d < bestDist) {
            bestDist = d;
            bestSeg = s;
          }
        }
      }
    }
    if (bestSeg) {
      bestSeg.alive = false;
      return bestSeg;
    }
    return null;
  }

  _addBuilding(cx, cy, w, h, floorColor, roofColor, wallColor, poiId, style = 'flat', shape = 'rect') {
    if (!this.isLand(cx, cy) || this.getRiverDistance(cx, cy) < 42) return null;

    const x = cx - w * 0.5;
    const y = cy - h * 0.5;
    const doorGap = 48;
    const localWalls = [];
    const doors = [];

    const pushWallWithDoor = (ax, ay, bx, by, hasDoor, outNx, outNy) => {
      const len = Math.hypot(bx - ax, by - ay);
      if (!hasDoor || len < doorGap + 14) {
        localWalls.push(this._registerWallSeg(ax, ay, bx, by, 7, wallColor));
        return;
      }
      const t1 = (len * 0.5 - doorGap * 0.5) / len;
      const t2 = (len * 0.5 + doorGap * 0.5) / len;
      const mx1 = ax + (bx - ax) * t1;
      const my1 = ay + (by - ay) * t1;
      const mx2 = ax + (bx - ax) * t2;
      const my2 = ay + (by - ay) * t2;
      localWalls.push(this._registerWallSeg(ax, ay, mx1, my1, 7, wallColor));
      localWalls.push(this._registerWallSeg(mx2, my2, bx, by, 7, wallColor));
      doors.push({
        x: (ax + bx) * 0.5,
        y: (ay + by) * 0.5,
        outX: (ax + bx) * 0.5 + outNx * 22,
        outY: (ay + by) * 0.5 + outNy * 22
      });
    };

    const rects = [{ x, y, w, h }];
    if (shape === 'L' && w >= 66 && h >= 66) {
      // Bâtiment en forme de L : aile principale + aile perpendiculaire accolée
      const wingW = Math.round(w * 0.54);
      const wingH = Math.round(h * 0.56);
      const bx = x + w - 4;
      const by = y + h - wingH;
      rects.push({ x: bx, y: by, w: wingW, h: wingH });

      // Périmètre propre du bâtiment en L avec portes larges
      pushWallWithDoor(x, y, x + w, y, true, 0, -1);
      pushWallWithDoor(x + w, y, x + w, by, false, 1, 0);
      pushWallWithDoor(x + w, by, bx + wingW, by, true, 0, -1);
      pushWallWithDoor(bx + wingW, by, bx + wingW, by + wingH, true, 1, 0);
      pushWallWithDoor(x, y + h, bx + wingW, y + h, true, 0, 1);
      pushWallWithDoor(x, y, x, y + h, true, -1, 0);
    } else {
      pushWallWithDoor(x, y, x + w, y, true, 0, -1);
      pushWallWithDoor(x, y + h, x + w, y + h, true, 0, 1);
      pushWallWithDoor(x, y, x, y + h, true, -1, 0);
      pushWallWithDoor(x + w, y, x + w, y + h, true, 1, 0);
    }

    const b = {
      cx, cy, x, y, w, h,
      rects,
      floorColor,
      roofColor,
      wallColor,
      poiId,
      style,
      walls: localWalls,
      doors
    };
    this.buildings.push(b);
    return b;
  }

  // Génère des quartiers réalistes : rues orthogonales/avenues, trottoirs gris, parkings et bâtiments alignés (rect & L)
  _generateBuildingsAndSpawns() {
    const palettes = {
      citadel: { floor: '#cbd5e1', roof: '#1e3a5f', wall: '#0f172a' },
      plaza:   { floor: '#e2e8f0', roof: '#6b21a8', wall: '#1e293b' },
      neon:    { floor: '#334155', roof: '#0e7490', wall: '#090d16' },
      valley:  { floor: '#fef3c7', roof: '#991b1b', wall: '#451a03' },
      temple:  { floor: '#fee2e2', roof: '#b91c1c', wall: '#450a0a' },
      factory: { floor: '#94a3b8', roof: '#1d4ed8', wall: '#1e293b' },
      canyon:  { floor: '#fed7aa', roof: '#9a3412', wall: '#431407' },
      woods:   { floor: '#d6d3d1', roof: '#166534', wall: '#3f2e1d' },
      palms:   { floor: '#fef9c3', roof: '#0f766e', wall: '#134e4a' },
      bay:     { floor: '#e0f2fe', roof: '#0284c7', wall: '#0c4a6e' },
      port:    { floor: '#64748b', roof: '#4338ca', wall: '#0f172a' },
      docks:   { floor: '#475569', roof: '#334155', wall: '#0f172a' }
    };

    const addStreet = (x, y, w, h, hasSidewalk = true) => {
      this.streets.push({ x, y, w, h, hasSidewalk });
    };
    const addParking = (x, y, w, h) => {
      this.parkingLots.push({ x, y, w, h });
      this.cars.push({ id: this.cars.length, x: x + w * 0.3, y: y + h * 0.5, angle: 0, metalLeft: 120, color: '#ef4444' });
      if (w > 80) {
        this.cars.push({ id: this.cars.length, x: x + w * 0.72, y: y + h * 0.5, angle: 0, metalLeft: 120, color: '#3b82f6' });
      }
    };

    for (const poi of this.pois) {
      const pal = palettes[poi.theme] || palettes.citadel;
      const cx = poi.x;
      const cy = poi.y;

      if (poi.layout === 'grid') {
        // Quartier en quadrillage urbain (rues + trottoirs + parkings + blocs en L)
        addStreet(cx - 210, cy - 22, 420, 44);
        addStreet(cx - 22, cy - 210, 44, 420);
        addParking(cx - 175, cy + 40, 105, 58);
        addParking(cx + 70, cy - 102, 105, 58);

        this._addBuilding(cx - 125, cy - 115, 96, 84, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'L');
        this._addBuilding(cx + 125, cy - 165, 92, 68, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx - 125, cy + 165, 96, 68, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx + 120, cy + 115, 92, 84, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'L');
        this._addBuilding(cx - 245, cy - 12, 62, 110, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx + 245, cy + 12, 62, 110, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
      } else if (poi.layout === 'avenue') {
        // Grande avenue centrale + 2 contre-allées + parkings
        addStreet(cx - 240, cy - 26, 480, 52);
        addStreet(cx - 95, cy - 170, 34, 340);
        addStreet(cx + 75, cy - 170, 34, 340);
        addParking(cx - 195, cy - 125, 86, 62);
        addParking(cx + 115, cy + 68, 86, 62);

        this._addBuilding(cx - 15, cy - 110, 86, 94, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'L');
        this._addBuilding(cx - 15, cy + 110, 96, 74, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx + 165, cy - 105, 88, 82, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'L');
        this._addBuilding(cx - 165, cy + 105, 84, 82, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx + 255, cy - 22, 64, 112, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
      } else if (poi.layout === 'mainst' || poi.layout === 'canyon' || poi.layout === 'strip') {
        // Rue principale commerçante / village alignée avec trottoirs et parkings latéraux
        addStreet(cx - 255, cy - 24, 510, 48);
        addParking(cx - 42, cy - 112, 92, 54);
        addParking(cx - 42, cy + 60, 92, 54);

        const st = poi.layout === 'mainst' ? 'pitched' : 'flat';
        this._addBuilding(cx - 165, cy - 92, 92, 68, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
        this._addBuilding(cx + 135, cy - 96, 98, 72, pal.floor, pal.roof, pal.wall, poi.id, st, 'L');
        this._addBuilding(cx - 155, cy + 92, 96, 70, pal.floor, pal.roof, pal.wall, poi.id, st, 'L');
        this._addBuilding(cx + 145, cy + 94, 92, 68, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
        this._addBuilding(cx, cy - 185, 110, 62, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
        this._addBuilding(cx, cy + 185, 110, 62, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
      } else if (poi.layout === 'industry' || poi.layout === 'docks' || poi.layout === 'swampdock') {
        // Entrepôts industriels / quais avec cour pavée et grands hangars en L
        addStreet(cx - 210, cy - 190, 420, 380, false);
        addParking(cx - 185, cy - 165, 110, 56);
        addParking(cx + 85, cy + 110, 110, 56);

        this._addBuilding(cx - 95, cy - 55, 118, 78, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'L');
        this._addBuilding(cx + 115, cy - 90, 102, 86, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx - 115, cy + 105, 112, 74, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
        this._addBuilding(cx + 105, cy + 32, 84, 58, pal.floor, pal.roof, pal.wall, poi.id, 'flat', 'rect');
      } else {
        // Citadelle sur l'îlot central, Temple à ailes, Lodges ou Promenade côtière
        addStreet(cx - 180, cy - 22, 360, 44);
        addStreet(cx - 22, cy - 160, 44, 320);
        addParking(cx - 160, cy + 52, 86, 50);

        const st = poi.layout === 'temple' ? 'pagoda' : poi.layout === 'lodges' ? 'pitched' : 'flat';
        this._addBuilding(cx, cy, 96, 86, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
        this._addBuilding(cx - 118, cy - 96, 78, 74, pal.floor, pal.roof, pal.wall, poi.id, st, 'L');
        this._addBuilding(cx + 118, cy - 96, 82, 66, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
        this._addBuilding(cx + 115, cy + 98, 84, 72, pal.floor, pal.roof, pal.wall, poi.id, st, 'L');
        this._addBuilding(cx - 115, cy + 128, 76, 56, pal.floor, pal.roof, pal.wall, poi.id, st, 'rect');
      }
    }

    // Structures des 45 Petits Spawns (Maisons, Stations-service avec parking & voitures, Phares, Camps)
    for (let i = 0; i < this.smallSpawns.length; i++) {
      const sp = this.smallSpawns[i];
      if (sp.type === 'station') {
        addParking(sp.x - 52, sp.y + 12, 104, 48);
        this._addBuilding(sp.x, sp.y - 26, 88, 52, '#e2e8f0', '#dc2626', '#1e293b', sp.id, 'flat', 'rect');
        this._addBuilding(sp.x, sp.y + 42, 92, 30, '#94a3b8', '#b91c1c', '#334155', sp.id, 'flat', 'rect');
      } else if (sp.type === 'barn') {
        this._addBuilding(sp.x, sp.y, 96, 74, '#fde68a', '#991b1b', '#450a0a', sp.id, 'pitched', 'L');
      } else if (sp.type === 'lighthouse') {
        this._addBuilding(sp.x - 18, sp.y, 44, 44, '#f8fafc', '#ef4444', '#1e293b', sp.id, 'lighthouse', 'rect');
        this._addBuilding(sp.x + 38, sp.y + 12, 60, 48, '#fef3c7', '#0284c7', '#1e293b', sp.id, 'pitched', 'rect');
      } else if (sp.type === 'radio') {
        this._addBuilding(sp.x - 16, sp.y, 68, 56, '#cbd5e1', '#334155', '#0f172a', sp.id, 'flat', 'rect');
      } else if (sp.type === 'camp') {
        this._addBuilding(sp.x - 26, sp.y - 14, 46, 38, '#d9f99d', '#15803d', '#14532d', sp.id, 'pitched', 'rect');
        this._addBuilding(sp.x + 28, sp.y + 16, 48, 38, '#fef08a', '#b45309', '#451a03', sp.id, 'pitched', 'rect');
      } else {
        this._addBuilding(sp.x - 20, sp.y, 70, 58, '#f5f5f4', '#7c2d12', '#292524', sp.id, 'pitched', i % 2 === 0 ? 'L' : 'rect');
      }
    }
  }

  _generateProps() {
    // 720 Arbres (Bois), 360 Rochers (Brique), et Voitures additionnelles le long de l'autoroute (Métal)
    for (let i = 0; i < 720; i++) {
      const a = i * 2.3999632;
      const r = Math.sqrt((i + 1) / 720) * (ISLAND_RADIUS * 0.94);
      const tx = MAP_CENTER + Math.cos(a) * r + Math.sin(i * 17) * 55;
      const ty = MAP_CENTER + Math.sin(a) * r + Math.cos(i * 13) * 55;
      if (!this.isLand(tx, ty) || this.getRiverDistance(tx, ty) < 52) continue;

      let skip = false;
      for (const p of this.pois) {
        if (Math.hypot(tx - p.x, ty - p.y) < p.radius * 0.95 && p.theme !== 'woods' && p.theme !== 'palms') {
          skip = true; break;
        }
      }
      if (skip) continue;

      const biome = this.getBiome(tx, ty);
      this.trees.push({
        id: this.trees.length,
        x: tx, y: ty,
        radius: 14 + (i % 9),
        biome,
        woodLeft: 120
      });
    }

    for (let i = 0; i < 360; i++) {
      const a = i * 2.3999632 + 0.9;
      const r = Math.sqrt((i + 1) / 360) * (ISLAND_RADIUS * 0.93);
      const rx = MAP_CENTER + Math.cos(a) * r + Math.cos(i * 19) * 50;
      const ry = MAP_CENTER + Math.sin(a) * r + Math.sin(i * 23) * 50;
      if (!this.isLand(rx, ry) || this.getRiverDistance(rx, ry) < 46) continue;

      let skip = false;
      for (const p of this.pois) {
        if (Math.hypot(rx - p.x, ry - p.y) < p.radius * 0.90 && p.theme !== 'canyon') {
          skip = true; break;
        }
      }
      if (skip) continue;

      this.rocks.push({
        id: this.rocks.length,
        x: rx, y: ry,
        radius: 14 + (i % 8),
        brickLeft: 100
      });
    }

    // Voitures disséminées le long de l'autoroute pour farmer du Métal
    const carColors = ['#ef4444', '#3b82f6', '#facc15', '#10b981', '#e2e8f0', '#f97316'];
    for (let s = 0; s < this.highwaySegments.length; s++) {
      const seg = this.highwaySegments[s];
      const pts = sampleCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, 8);
      for (let k = 1; k < pts.length - 1; k += 2) {
        const pt = pts[k];
        if (!this.isLand(pt[0], pt[1]) || this.getRiverDistance(pt[0], pt[1]) < 60) continue;
        const nxt = pts[k + 1];
        this.cars.push({
          id: this.cars.length,
          x: pt[0] + (k % 4 === 1 ? 14 : -14),
          y: pt[1],
          angle: Math.atan2(nxt[1] - pt[1], nxt[0] - pt[0]),
          metalLeft: 120,
          color: carColors[(s + k) % carColors.length]
        });
      }
    }
  }

  _generateChests() {
    let id = 0;
    for (const poi of this.pois) {
      for (let k = 0; k < 11; k++) {
        const ang = (k / 11) * Math.PI * 2 + 0.25;
        const rad = 28 + ((k * 47) % (poi.radius * 0.72));
        const cx = poi.x + Math.cos(ang) * rad;
        const cy = poi.y + Math.sin(ang) * rad;
        if (!this.isLand(cx, cy)) continue;
        const rRoll = (id * 37) % 100;
        const rarity = rRoll > 80 ? 4 : rRoll > 48 ? 3 : rRoll > 18 ? 2 : 1;
        this.chests.push({ id: id++, x: cx, y: cy, rarity, opened: false });
      }
    }

    for (let s = 0; s < this.smallSpawns.length; s++) {
      const sp = this.smallSpawns[s];
      const chestCount = 2 + (s % 3); // 2 à 4 coffres par Petit Spawn
      for (let k = 0; k < chestCount; k++) {
        const ang = (k / chestCount) * Math.PI * 2 + 0.35;
        const cx = sp.x + Math.cos(ang) * 26;
        const cy = sp.y + Math.sin(ang) * 26;
        const rarity = k === 0 ? 3 : (s + k) % 2 === 0 ? 3 : 2;
        this.chests.push({ id: id++, x: cx, y: cy, rarity, opened: false });
      }
    }
  }

  _generateFloorLoot() {
    let id = 0;
    const pushLoot = (lx, ly, seed) => {
      if (!this.isLand(lx, ly)) return;
      const kRoll = (seed * 29) % 100;
      const kind =
        kRoll < 22 ? 'ar'
        : kRoll < 44 ? 'shotgun'
        : kRoll < 60 ? 'smg'
        : kRoll < 68 ? 'sniper'
        : kRoll < 82 ? 'mini'
        : kRoll < 90 ? 'bigpot'
        : kRoll < 95 ? 'medkit'
        : 'fish';

      let rarity = 0;
      if (kind === 'sniper') rarity = seed % 2 === 0 ? 4 : 3;
      else if (kind === 'bigpot' || kind === 'medkit') rarity = 2;
      else if (kind === 'mini' || kind === 'fish') rarity = 1;
      else {
        const r = (seed * 41) % 100;
        rarity = r > 88 ? 4 : r > 68 ? 3 : r > 40 ? 2 : r > 15 ? 1 : 0;
      }

      const count = kind === 'mini' ? 3 : kind === 'fish' ? 2 : 1;
      this.floorLoot.push({ id: id++, x: lx, y: ly, kind, rarity, count, picked: false });
    };

    let seed = 1;
    for (const poi of this.pois) {
      for (let k = 0; k < 18; k++) {
        seed++;
        const ang = (k / 18) * Math.PI * 2 + seed * 0.1;
        const rad = 22 + ((seed * 61) % (poi.radius * 0.8));
        pushLoot(poi.x + Math.cos(ang) * rad, poi.y + Math.sin(ang) * rad, seed);
      }
    }
    for (const sp of this.smallSpawns) {
      for (let k = 0; k < 5; k++) {
        seed++;
        const ang = (k / 5) * Math.PI * 2 + 0.5;
        pushLoot(sp.x + Math.cos(ang) * 44, sp.y + Math.sin(ang) * 44, seed);
      }
    }
  }

  resetMatch() {
    for (let i = 0; i < this.chests.length; i++) this.chests[i].opened = false;
    for (let i = 0; i < this.floorLoot.length; i++) this.floorLoot[i].picked = false;
    for (let i = 0; i < this.trees.length; i++) this.trees[i].woodLeft = 120;
    for (let i = 0; i < this.rocks.length; i++) this.rocks[i].brickLeft = 100;
    for (let i = 0; i < this.cars.length; i++) this.cars[i].metalLeft = 120;
    for (let i = 0; i < this.wallSegments.length; i++) this.wallSegments[i].alive = true;
  }

  _buildBridgesAndZiplines() {
    this.bridges = [];
    this.ziplines = [];
    const hwSamples = [];
    for (const seg of this.highwaySegments) hwSamples.push(...sampleCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, 24));
    for (let i = 0; i < hwSamples.length - 1; i++) {
      const p = hwSamples[i];
      if (this.getRiverDistance(p[0], p[1]) < 48) {
        const q = hwSamples[i + 1];
        const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const tooClose = this.bridges.some((b) => Math.hypot(b.x - p[0], b.y - p[1]) < 240);
        if (!tooClose) this.bridges.push({ x: p[0], y: p[1], angle: ang, len: 165 });
      }
    }
    // 2 Ponts reliant l'îlot d'Apex Citadel au continent
    this.bridges.push({ x: 3560, y: 3960, angle: 0, len: 290 });
    this.bridges.push({ x: 4280, y: 3960, angle: 0, len: 290 });

    // Ponts & Tyroliennes vers les 4 petites îles
    for (const sat of this.satellites) {
      const ang = Math.atan2(sat.bridgeTo[1] - sat.y, sat.bridgeTo[0] - sat.x);
      const mx = (sat.x + sat.bridgeTo[0]) * 0.5;
      const my = (sat.y + sat.bridgeTo[1]) * 0.5;
      const len = Math.hypot(sat.bridgeTo[0] - sat.x, sat.bridgeTo[1] - sat.y) * 0.72;
      if (sat.link === 'bridge') {
        this.bridges.push({ x: mx, y: my, angle: ang, len });
      } else {
        this.ziplines.push({ x1: sat.x, y1: sat.y, x2: sat.bridgeTo[0], y2: sat.bridgeTo[1] });
      }
    }
  }

  // Pré-rendu organique pixel par pixel (bruit 2D, courbes de niveau, zéro cercle de biome) + rivières + autoroute Bézier
  _bakeTerrainBitmap() {
    if (typeof document === 'undefined') return null;
    const res = 1024;
    const scale = res / MAP_SIZE;
    const off = document.createElement('canvas');
    off.width = res;
    off.height = res;
    const ctx = off.getContext('2d');
    if (!ctx || typeof ctx.createImageData !== 'function') return off;

    const img = ctx.createImageData(res, res);
    const data = img.data;

    // 1. Rastérisation organique par pixel : Océan, Récifs, Plages, 4 Biomes + Courbes de niveau !
    for (let py = 0; py < res; py++) {
      const wy = (py + 0.5) / scale;
      for (let px = 0; px < res; px++) {
        const wx = (px + 0.5) / scale;
        const idx = (py * res + px) * 4;

        const biome = this.getBiome(wx, wy);
        if (biome === 'water') {
          const distEdge = this.isInCentralLake(wx, wy)
            ? 0.65
            : Math.max(0, 1 - Math.abs(Math.hypot(wx - MAP_CENTER, wy - MAP_CENTER) - this.getCoastRadius(Math.atan2(wy - MAP_CENTER, wx - MAP_CENTER))) / 420);
          data[idx] = Math.round(7 + distEdge * 18);
          data[idx + 1] = Math.round(58 + distEdge * 88);
          data[idx + 2] = Math.round(108 + distEdge * 95);
          data[idx + 3] = 255;
          continue;
        }

        const elev = this.getElevation(wx, wy);
        const band = Math.floor(elev * 6);
        const contour = Math.abs((elev * 6) - band - 0.5) > 0.44 ? -12 : 0;
        const shade = (band - 2.5) * 7 + contour;

        let r = 74, g = 156, b = 60;
        if (biome === 'sand') {
          r = 228; g = 204; b = 142;
        } else if (biome === 'snow') {
          r = 226; g = 238; b = 250;
        } else if (biome === 'desert') {
          r = 206; g = 142; b = 84;
        } else if (biome === 'swamp') {
          r = 53; g = 98; b = 76;
        } else if (biome === 'forest') {
          r = 46; g = 108; b = 52;
        }

        data[idx] = Math.max(0, Math.min(255, r + shade));
        data[idx + 1] = Math.max(0, Math.min(255, g + shade));
        data[idx + 2] = Math.max(0, Math.min(255, b + shade));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    ctx.save();
    ctx.scale(scale, scale);

    // 2. Rivières sinueuses partant du lac central vers l'océan
    for (const pts of this.rivers) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(194, 178, 128, 0.72)';
      ctx.lineWidth = 118;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) * 0.5;
        const yc = (pts[i][1] + pts[i + 1][1]) * 0.5;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.stroke();

      ctx.strokeStyle = '#1986cf';
      ctx.lineWidth = 82;
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 28;
      ctx.stroke();
    }

    // 3. Chemins secondaires sinueux vers les villes
    ctx.lineCap = 'round';
    for (const sp of this.spurRoads) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(sp.x1, sp.y1);
      ctx.quadraticCurveTo(sp.cx, sp.cy, sp.x2, sp.y2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 16]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. GRANDE AUTOROUTE PRINCIPALE EN COURBES DE BÉZIER
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 56;
    ctx.beginPath();
    ctx.moveTo(this.highwaySegments[0].p0[0], this.highwaySegments[0].p0[1]);
    for (const seg of this.highwaySegments) {
      ctx.bezierCurveTo(seg.p1[0], seg.p1[1], seg.p2[0], seg.p2[1], seg.p3[0], seg.p3[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 44;
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.setLineDash([28, 24]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Ponts & Tyroliennes
    for (const br of this.bridges) {
      ctx.save();
      ctx.translate(br.x, br.y);
      ctx.rotate(br.angle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-br.len * 0.5, -34, br.len, 68);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-br.len * 0.5, -36, br.len, 7);
      ctx.fillRect(-br.len * 0.5, 29, br.len, 7);
      ctx.restore();
    }

    for (const z of this.ziplines) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 7;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(z.x1, z.y1);
      ctx.lineTo(z.x2, z.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Rues de quartiers, trottoirs gris & parkings dans chaque ville
    for (const st of this.streets) {
      if (st.hasSidewalk) {
        ctx.fillStyle = '#94a3b8'; // Trottoirs gris
        ctx.fillRect(st.x - 10, st.y - 10, st.w + 20, st.h + 20);
      }
      ctx.fillStyle = '#334155'; // Asphalte
      ctx.fillRect(st.x, st.y, st.w, st.h);
    }

    for (const pk of this.parkingLots) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(pk.x, pk.y, pk.w, pk.h);
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
      ctx.lineWidth = 2;
      for (let x = pk.x + 18; x < pk.x + pk.w - 8; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, pk.y + 4);
        ctx.lineTo(x, pk.y + pk.h - 4);
        ctx.stroke();
      }
    }

    ctx.restore();
    return off;
  }

  resolveCollisions(nx, ny, radius) {
    let x = nx;
    let y = ny;

    const gx = Math.max(0, Math.min(this.gridDim - 1, Math.floor(x / this.gridCell)));
    const gy = Math.max(0, Math.min(this.gridDim - 1, Math.floor(y / this.gridCell)));
    const bucket = this.wallBuckets[gy * this.gridDim + gx];

    for (let i = 0; i < bucket.length; i++) {
      const s = bucket[i];
      if (!s.alive) continue;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / lenSq));
      const cx = s.x1 + t * dx;
      const cy = s.y1 + t * dy;
      const px = x - cx;
      const py = y - cy;
      const distSq = px * px + py * py;
      const minD = radius + s.thickness * 0.5;
      if (distSq < minD * minD && distSq > 1e-6) {
        const d = Math.sqrt(distSq);
        const push = minD - d;
        x += (px / d) * push;
        y += (py / d) * push;
      }
    }

    for (let i = 0; i < this.trees.length; i++) {
      const tr = this.trees[i];
      if (tr.woodLeft <= 0) continue;
      const dx = x - tr.x, dy = y - tr.y;
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) continue;
      const minD = radius + tr.radius * 0.45;
      const dSq = dx * dx + dy * dy;
      if (dSq < minD * minD && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        x += (dx / d) * (minD - d);
        y += (dy / d) * (minD - d);
      }
    }

    for (let i = 0; i < this.rocks.length; i++) {
      const rk = this.rocks[i];
      if (rk.brickLeft <= 0) continue;
      const dx = x - rk.x, dy = y - rk.y;
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) continue;
      const minD = radius + rk.radius * 0.72;
      const dSq = dx * dx + dy * dy;
      if (dSq < minD * minD && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        x += (dx / d) * (minD - d);
        y += (dy / d) * (minD - d);
      }
    }

    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      if (c.metalLeft <= 0) continue;
      const dx = x - c.x, dy = y - c.y;
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) continue;
      const minD = radius + 13;
      const dSq = dx * dx + dy * dy;
      if (dSq < minD * minD && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        x += (dx / d) * (minD - d);
        y += (dy / d) * (minD - d);
      }
    }

    return { x, y };
  }

  getBuildingExitPoint(x, y, targetX, targetY) {
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      let inside = false;
      let targetInside = false;
      for (let r = 0; r < b.rects.length; r++) {
        const rc = b.rects[r];
        if (x >= rc.x - 4 && x <= rc.x + rc.w + 4 && y >= rc.y - 4 && y <= rc.y + rc.h + 4) inside = true;
        if (targetX >= rc.x && targetX <= rc.x + rc.w && targetY >= rc.y && targetY <= rc.y + rc.h) targetInside = true;
      }
      if (inside) {
        if (targetInside) return null;
        let best = null;
        let bestScore = Infinity;
        for (let d = 0; d < b.doors.length; d++) {
          const dr = b.doors[d];
          const score = Math.hypot(dr.x - x, dr.y - y) * 0.7 + Math.hypot(targetX - dr.outX, targetY - dr.outY);
          if (score < bestScore) { bestScore = score; best = dr; }
        }
        if (best) return { x: best.outX, y: best.outY };
      }
    }
    return null;
  }

  // Guide les bots des îles satellites ou de l'îlot central vers le pont ou la tyrolienne la plus proche
  getWaterCrossingPoint(x, y, targetX, targetY) {
    const dx = targetX - x, dy = targetY - y;
    const len = Math.hypot(dx, dy);
    if (len < 70) return null;
    const probeX = x + (dx / len) * 58;
    const probeY = y + (dy / len) * 58;
    if (this.isDryOrBridge(probeX, probeY)) return null;

    let bestPt = null;
    let bestScore = Infinity;
    for (let i = 0; i < this.bridges.length; i++) {
      const br = this.bridges[i];
      const d = Math.hypot(br.x - x, br.y - y);
      if (d < 620 && d > 24) {
        const score = d + Math.hypot(targetX - br.x, targetY - br.y) * 0.6;
        if (score < bestScore) { bestScore = score; bestPt = { x: br.x, y: br.y, speedBoost: 1.0 }; }
      }
    }
    for (let i = 0; i < this.ziplines.length; i++) {
      const z = this.ziplines[i];
      const d1 = Math.hypot(z.x1 - x, z.y1 - y);
      const d2 = Math.hypot(z.x2 - x, z.y2 - y);
      const nearEnd = d1 < d2 ? { x: z.x2, y: z.y2, d: d1 } : { x: z.x1, y: z.y1, d: d2 };
      if (nearEnd.d < 650) {
        const score = nearEnd.d + Math.hypot(targetX - nearEnd.x, targetY - nearEnd.y) * 0.6;
        if (score < bestScore) { bestScore = score; bestPt = { x: nearEnd.x, y: nearEnd.y, speedBoost: 1.45 }; }
      }
    }
    return bestPt;
  }

  segmentHitsWall(ax, ay, bx, by) {
    const minGx = Math.max(0, Math.floor(Math.min(ax, bx) / this.gridCell));
    const maxGx = Math.min(this.gridDim - 1, Math.floor(Math.max(ax, bx) / this.gridCell));
    const minGy = Math.max(0, Math.floor(Math.min(ay, by) / this.gridCell));
    const maxGy = Math.min(this.gridDim - 1, Math.floor(Math.max(ay, by) / this.gridCell));

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const bucket = this.wallBuckets[gy * this.gridDim + gx];
        for (let i = 0; i < bucket.length; i++) {
          const s = bucket[i];
          if (!s.alive) continue;
          if (segmentIntersectsSegment(ax, ay, bx, by, s.x1, s.y1, s.x2, s.y2)) return true;
        }
      }
    }
    return false;
  }

  renderWorld(ctx, view, zoom, watchedBot, nowSec) {
    if (this.terrainCanvas) ctx.drawImage(this.terrainCanvas, 0, 0, MAP_SIZE, MAP_SIZE);

    const pad = 180;
    const minX = view.minX - pad, maxX = view.maxX + pad;
    const minY = view.minY - pad, maxY = view.maxY + pad;

    // 1. Bâtiments (Sols intérieurs rect/L & murs avec portes ou brèches de pioche)
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.x + b.w + 80 < minX || b.x > maxX || b.y + b.h + 80 < minY || b.y > maxY) continue;

      ctx.fillStyle = b.floorColor;
      for (let r = 0; r < b.rects.length; r++) {
        const rc = b.rects[r];
        ctx.fillRect(rc.x, rc.y, rc.w, rc.h);
      }

      if (zoom > 0.38) {
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let gx = b.x + 16; gx < b.x + b.w; gx += 16) {
          ctx.beginPath(); ctx.moveTo(gx, b.y); ctx.lineTo(gx, b.y + b.h); ctx.stroke();
        }
        for (let gy = b.y + 16; gy < b.y + b.h; gy += 16) {
          ctx.beginPath(); ctx.moveTo(b.x, gy); ctx.lineTo(b.x + b.w, gy); ctx.stroke();
        }
      }

      ctx.strokeStyle = b.wallColor;
      ctx.lineWidth = 7;
      ctx.lineCap = 'square';
      for (let w = 0; w < b.walls.length; w++) {
        const seg = b.walls[w];
        if (!seg.alive) continue;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
    }

    // 2. Voitures (Métal), Rochers (Brique) & Arbres (Bois)
    if (zoom > 0.16) {
      for (let i = 0; i < this.cars.length; i++) {
        const c = this.cars[i];
        if (c.metalLeft <= 0 || c.x < minX || c.x > maxX || c.y < minY || c.y > maxY) continue;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.fillStyle = c.color;
        ctx.fillRect(-14, -8, 28, 16);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(-6, -6, 14, 12);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-14, -8, 28, 16);
        ctx.restore();
      }

      for (let i = 0; i < this.rocks.length; i++) {
        const rk = this.rocks[i];
        if (rk.brickLeft <= 0 || rk.x < minX || rk.x > maxX || rk.y < minY || rk.y > maxY) continue;
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, rk.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (let i = 0; i < this.trees.length; i++) {
        const tr = this.trees[i];
        if (tr.woodLeft <= 0 || tr.x < minX || tr.x > maxX || tr.y < minY || tr.y > maxY) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.arc(tr.x + 4, tr.y + 4, tr.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tr.biome === 'snow' ? '#cbd5e1' : tr.biome === 'forest' ? '#14532d' : tr.biome === 'swamp' ? '#1e3a2f' : '#166534';
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, tr.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tr.biome === 'snow' ? '#f8fafc' : tr.biome === 'swamp' ? '#4d7c5b' : '#22c55e';
        ctx.beginPath();
        ctx.arc(tr.x - 2, tr.y - 2, tr.radius * 0.56, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Coffres dorés brillants & Loot au sol coloré
    if (zoom > 0.22) {
      const pulse = 0.65 + 0.35 * Math.sin(nowSec * 4.2);
      for (let i = 0; i < this.chests.length; i++) {
        const ch = this.chests[i];
        if (ch.opened || ch.x < minX || ch.x > maxX || ch.y < minY || ch.y > maxY) continue;

        ctx.fillStyle = `rgba(250, 204, 21, ${0.28 * pulse})`;
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d97706';
        ctx.fillRect(ch.x - 8, ch.y - 6, 16, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(ch.x - 7, ch.y - 5, 14, 5);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(ch.x - 8, ch.y - 6, 16, 12);
      }

      for (let i = 0; i < this.floorLoot.length; i++) {
        const l = this.floorLoot[i];
        if (l.picked || l.x < minX || l.x > maxX || l.y < minY || l.y > maxY) continue;
        const rCol = RARITY_COLORS[l.rarity];

        ctx.fillStyle = rCol.glow;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rCol.hex;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  renderRoofs(ctx, view, zoom, watchedBot) {
    const pad = 180;
    const minX = view.minX - pad, maxX = view.maxX + pad;
    const minY = view.minY - pad, maxY = view.maxY + pad;

    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.x + b.w + 80 < minX || b.x > maxX || b.y + b.h + 80 < minY || b.y > maxY) continue;

      const watchedInside =
        watchedBot &&
        watchedBot.alive &&
        watchedBot.x >= b.x - 28 &&
        watchedBot.x <= b.x + b.w + 68 &&
        watchedBot.y >= b.y - 28 &&
        watchedBot.y <= b.y + b.h + 28;

      ctx.save();
      ctx.globalAlpha = watchedInside ? 0.18 : zoom > 1.1 ? 0.78 : 0.94;
      ctx.fillStyle = b.roofColor;
      for (let r = 0; r < b.rects.length; r++) {
        const rc = b.rects[r];
        ctx.fillRect(rc.x - 2, rc.y - 2, rc.w + 4, rc.h + 4);
      }

      if (b.style === 'pitched' || b.style === 'pagoda') {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + 8, b.y + b.h * 0.5);
        ctx.lineTo(b.x + b.w - 8, b.y + b.h * 0.5);
        ctx.stroke();
      } else if (b.style === 'lighthouse') {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderPoiLabels(ctx, zoom) {
    if (zoom > 0.85) return;
    ctx.save();
    const fontSize = Math.max(22, Math.min(76, Math.round(13 / Math.max(0.08, zoom))));
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const p of this.pois) {
      ctx.lineWidth = Math.max(4, fontSize * 0.22);
      ctx.strokeStyle = 'rgba(7, 12, 24, 0.9)';
      ctx.strokeText(p.name.toUpperCase(), p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.name.toUpperCase(), p.x, p.y);
    }
    ctx.restore();
  }
}

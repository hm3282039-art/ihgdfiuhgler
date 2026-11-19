import { getItemDisplayName, getItemShortName } from './Bot2D.js';

const ITEM_SVGS = {
  ar: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M2 10h13l2-2h5v2h-4v2h2v2h-3l-2 2H9l-1 4H5l1-4H2v-6z"/></svg>',
  shotgun: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M2 11h17v2H2v-2zm17-1h3v4h-3v-4zM5 13h5v3l-3 3H4l1-6z"/></svg>',
  smg: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M4 9h12v3H4V9zm12 1h5v2h-5v-2zM7 12h3v7H7v-7zm5 0h3l-1 5h-2v-5z"/></svg>',
  sniper: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M1 12h15v2H1v-2zm15 0h7v1.5h-7V12zM7 9h6v2H7V9zm-2 5h4l-1 5H5l0-5z"/></svg>',
  mini: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#7dd3fc" d="M9 3h6v2H9V3zm1 3h4l3 4v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l3-4z"/></svg>',
  bigpot: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#38bdf8" d="M9 2h6v3H9V2zm-2 4h10l3 5v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8l3-5z"/></svg>',
  medkit: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm5-3h6v2H9V3zm2 6v3H8v2h3v3h2v-3h3v-2h-3V9h-2z"/></svg>',
  fish: '<svg class="slot-svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#38bdf8" d="M21 12c-3-4-8-6-13-4L3 5v14l5-3c5 2 10 0 13-4z"/></svg>'
};

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export class HUD {
  constructor() {
    this.elMatchTimer = document.getElementById('match-timer');
    this.elPhaseLabel = document.getElementById('phase-label');
    this.elPhaseTimer = document.getElementById('phase-timer');
    this.elAliveDot = document.getElementById('alive-dot');
    this.elAliveText = document.getElementById('alive-text');
    this.elStormBadge = document.getElementById('storm-badge');
    this.elKillfeed = document.getElementById('killfeed');
    this.elToast = document.getElementById('switch-toast');

    this.elBtnBus = document.getElementById('btn-cam-bus');
    this.elBtnFree = document.getElementById('btn-cam-free');
    this.elBtnPlayer = document.getElementById('btn-cam-player');
    this.elBtnMap = document.getElementById('btn-cam-map');
    this.elBtnPrev = document.getElementById('btn-prev-bot');
    this.elBtnNext = document.getElementById('btn-next-bot');
    this.elBtnRestart = document.getElementById('btn-restart');

    this.speedButtons = [
      { speed: 1, el: document.getElementById('btn-speed-1') },
      { speed: 2, el: document.getElementById('btn-speed-2') },
      { speed: 5, el: document.getElementById('btn-speed-5') },
      { speed: 10, el: document.getElementById('btn-speed-10') }
    ];

    this.elPlayerNav = document.getElementById('player-nav');
    this.elPlayerHud = document.getElementById('player-hud');
    this.elWatchedWeapon = document.getElementById('watched-weapon');
    this.elWatchedName = document.getElementById('watched-name');
    this.elWatchedKills = document.getElementById('watched-kills');
    this.elShieldBar = document.getElementById('watched-shield-bar');
    this.elShieldText = document.getElementById('watched-shield-text');
    this.elHpBar = document.getElementById('watched-hp-bar');
    this.elHpText = document.getElementById('watched-hp-text');

    this.elInvSlots = [
      document.getElementById('inv-slot-0'),
      document.getElementById('inv-slot-1'),
      document.getElementById('inv-slot-2'),
      document.getElementById('inv-slot-3'),
      document.getElementById('inv-slot-4')
    ];

    this.elMatWood = document.getElementById('mat-wood-val');
    this.elMatBrick = document.getElementById('mat-brick-val');
    this.elMatMetal = document.getElementById('mat-metal-val');

    this.elVictory = document.getElementById('victory-banner');
    this.elVictorySub = document.getElementById('victory-sub');

    this.toastTimer = 0;
  }

  bindControls({ onViewMode, onCyclePlayer, onSpeedChange, onReplay }) {
    this.elBtnBus?.addEventListener('click', () => onViewMode('bus'));
    this.elBtnFree?.addEventListener('click', () => onViewMode('free'));
    this.elBtnPlayer?.addEventListener('click', () => onViewMode('player'));
    this.elBtnMap?.addEventListener('click', () => onViewMode('map'));
    this.elBtnPrev?.addEventListener('click', () => onCyclePlayer(-1));
    this.elBtnNext?.addEventListener('click', () => onCyclePlayer(1));
    this.elBtnRestart?.addEventListener('click', () => onReplay());

    for (const s of this.speedButtons) {
      s.el?.addEventListener('click', () => onSpeedChange(s.speed));
    }
  }

  syncSpeed(speed) {
    for (const s of this.speedButtons) {
      s.el?.classList.toggle('active', s.speed === speed);
    }
  }

  syncViewMode(mode, busActive) {
    this.elBtnBus?.classList.toggle('active', mode === 'bus');
    this.elBtnFree?.classList.toggle('active', mode === 'free');
    this.elBtnPlayer?.classList.toggle('active', mode === 'player');
    this.elBtnMap?.classList.toggle('active', mode === 'map');

    if (this.elBtnBus) this.elBtnBus.disabled = !busActive;

    const showPlayerHud = mode === 'player';
    this.elPlayerNav?.classList.toggle('visible', showPlayerHud);
    this.elPlayerHud?.classList.toggle('visible', showPlayerHud);
  }

  showToast(text) {
    if (!this.elToast) return;
    this.elToast.textContent = text;
    this.elToast.classList.add('show');
    this.toastTimer = 3.2;
  }

  addKill(killerName, victimName, isStorm) {
    if (!this.elKillfeed) return;
    const entry = document.createElement('div');
    entry.className = 'kill-entry' + (isStorm ? ' storm-kill' : '');

    if (isStorm) {
      entry.innerHTML = `<span class="victim">${victimName}</span> éliminé par <span class="storm-src">la Tempête</span>`;
    } else {
      entry.innerHTML = `<span class="killer">${killerName}</span> a éliminé <span class="victim">${victimName}</span>`;
    }

    this.elKillfeed.prepend(entry);
    while (this.elKillfeed.children.length > 5) {
      this.elKillfeed.removeChild(this.elKillfeed.lastChild);
    }
  }

  showVictory(winnerName, kills) {
    if (this.elVictorySub) {
      this.elVictorySub.textContent = `Gagnant : ${winnerName} (${kills} Kill${kills > 1 ? 's' : ''})`;
    }
    this.elVictory?.classList.add('visible');
  }

  resetForNewMatch() {
    if (this.elKillfeed) this.elKillfeed.innerHTML = '';
    this.elVictory?.classList.remove('visible');
    if (this.elBtnBus) this.elBtnBus.disabled = false;
  }

  update(rawDt, botManager, storm, camera) {
    if (this.toastTimer > 0) {
      this.toastTimer -= rawDt;
      if (this.toastTimer <= 0) this.elToast?.classList.remove('show');
    }

    if (this.elMatchTimer) this.elMatchTimer.textContent = formatClock(botManager.matchTime);
    if (this.elAliveText) this.elAliveText.textContent = `En vie : ${botManager.aliveCount} / 100`;
    this.elAliveDot?.classList.toggle('low', botManager.aliveCount <= 25);

    const status = storm.getStatusLabel();
    if (this.elPhaseLabel) {
      this.elPhaseLabel.textContent = `${status.title} / 8`;
      this.elPhaseLabel.classList.toggle('moving', status.isMoving);
    }
    if (this.elPhaseTimer) {
      this.elPhaseTimer.textContent = botManager.bus.active
        ? `Bus (${Math.max(0, Math.ceil(botManager.bus.duration - botManager.bus.elapsed))}s)`
        : `${status.sub} : ${status.timerText}`;
    }
    if (this.elStormBadge) {
      this.elStormBadge.textContent = `Zone : ${Math.round(storm.radius)}m`;
    }

    const watched = botManager.bots[botManager.watchedBotIndex];
    if (camera.mode === 'player' && watched) {
      if (this.elWatchedName) this.elWatchedName.textContent = watched.name;
      if (this.elWatchedKills) this.elWatchedKills.textContent = `${watched.kills} Kill${watched.kills > 1 ? 's' : ''}`;

      const activeItem = watched.slots[watched.activeSlot];
      if (this.elWatchedWeapon) {
        this.elWatchedWeapon.textContent = activeItem ? getItemDisplayName(activeItem) : 'Pioche';
      }

      const shieldVal = Math.max(0, Math.round(watched.shield));
      const hpVal = Math.max(0, Math.round(watched.hp));
      if (this.elShieldBar) this.elShieldBar.style.width = `${Math.min(100, shieldVal)}%`;
      if (this.elShieldText) this.elShieldText.textContent = `${shieldVal} / 100`;
      if (this.elHpBar) this.elHpBar.style.width = `${Math.min(100, hpVal)}%`;
      if (this.elHpText) this.elHpText.textContent = `${hpVal} / 100`;

      for (let s = 0; s < 5; s++) {
        const slotEl = this.elInvSlots[s];
        if (!slotEl) continue;
        const item = watched.slots[s];
        const isActive = watched.activeSlot === s;

        slotEl.className = 'inv-slot';
        if (item) {
          slotEl.classList.add(`rarity-${item.rarity}`);
          if (isActive) slotEl.classList.add('active-slot');
          const countHtml = item.count > 1 ? `<span class="slot-count">x${item.count}</span>` : '';
          slotEl.innerHTML =
            `<span class="slot-key">${s + 1}</span>` +
            countHtml +
            (ITEM_SVGS[item.kind] || '') +
            `<span class="slot-name">${getItemShortName(item)}</span>`;
        } else {
          slotEl.classList.add('empty');
          if (isActive) slotEl.classList.add('active-slot');
          slotEl.innerHTML = `<span class="slot-key">${s + 1}</span>`;
        }
      }

      if (this.elMatWood) this.elMatWood.textContent = String(Math.floor(watched.mats.wood));
      if (this.elMatBrick) this.elMatBrick.textContent = String(Math.floor(watched.mats.brick));
      if (this.elMatMetal) this.elMatMetal.textContent = String(Math.floor(watched.mats.metal));
    }
  }
}

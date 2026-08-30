/** Game audio — MP3 assets in /assets/audio/, three-state mute control. */
(function () {
  const STORAGE_KEY = 'dinnertime-court-audio-mode';
  const LEGACY_KEY = 'dinnertime-court-muted';
  const MUSIC_VOL = 0.38;
  const TITLE_MUSIC_SCALE = 0.5;
  const SFX_VOL = 0.72;

  /** full → no-bgm (SFX only) → muted → full */
  const MODES = ['full', 'no-bgm', 'muted'];

  const FILES = {
    bgm: '/assets/audio/vifotofreesounds-funny-medieval-instrumental-486733.mp3',
    click: '/assets/audio/universfield-mouse-click-117076.mp3',
    cardDeal: '/assets/audio/oxidvideos-taking-playing-card-522520.mp3',
    coin: '/assets/audio/freesound_gamestudio-drop-coin-384921.mp3',
    foodPlay: '/assets/audio/virtual_vibes-thud-impact-sound-sfx-379990.mp3',
    foodCreate: '/assets/audio/biappsolutions-short-and-bubbly-120528.mp3',
    gavel: '/assets/audio/freesound_community-pounding-one-time-on-a-wooden-table-102847.mp3',
    openingBell: '/assets/audio/u_7xr5ffk4oq-opening-bell-421471.mp3',
    rollingDice: '/assets/audio/freesound_community-rolling-dice-2-102706.mp3',
  };

  let mode = 'full';
  let ctx = null;
  let musicEl = null;
  let musicStarted = false;
  let musicVolumeScale = TITLE_MUSIC_SCALE;

  function loadMode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (MODES.includes(saved)) return saved;
      if (localStorage.getItem(LEGACY_KEY) === '1') return 'muted';
    } catch (_) {
      /* ignore */
    }
    return 'full';
  }

  function saveMode() {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  mode = loadMode();

  function sfxAllowed() {
    return mode !== 'muted';
  }

  function bgmAllowed() {
    return mode === 'full';
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  async function unlock() {
    ensureCtx();
    if (ctx?.state === 'suspended') await ctx.resume();
  }

  function playOneShot(src, volume = SFX_VOL) {
    if (!sfxAllowed() || !src) return;
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  }

  function applyMusicVolume() {
    if (musicEl) musicEl.volume = MUSIC_VOL * musicVolumeScale;
  }

  function setMusicVolumeScale(scale) {
    musicVolumeScale = Number.isFinite(scale) ? scale : 1;
    applyMusicVolume();
  }

  function startMusic() {
    if (!musicEl) {
      musicEl = new Audio(FILES.bgm);
      musicEl.loop = true;
    }
    applyMusicVolume();
    musicStarted = true;
    if (bgmAllowed()) musicEl.play().catch(() => {});
  }

  function stopMusic() {
    musicStarted = false;
    if (musicEl) {
      musicEl.pause();
      musicEl.currentTime = 0;
    }
  }

  function applyBgmState() {
    if (!bgmAllowed()) {
      if (musicEl) musicEl.pause();
      return;
    }
    if (!musicStarted) {
      startMusic();
      return;
    }
    if (musicEl) musicEl.play().catch(() => {});
  }

  function setMode(next) {
    if (!MODES.includes(next)) next = 'full';
    mode = next;
    saveMode();
    applyBgmState();
    updateButton();
  }

  function cycleMode() {
    const idx = MODES.indexOf(mode);
    setMode(MODES[(idx + 1) % MODES.length]);
  }

  function getMode() {
    return mode;
  }

  function isMuted() {
    return mode === 'muted';
  }

  function updateButton() {
    const btn = document.getElementById('btn-mute');
    if (!btn) return;
    btn.dataset.audioMode = mode;
    btn.classList.remove('is-muted', 'is-no-bgm');
    if (mode === 'muted') btn.classList.add('is-muted');
    if (mode === 'no-bgm') btn.classList.add('is-no-bgm');

    const labels = {
      full: { text: 'Sound', title: 'Full sound — click for SFX only', aria: 'Full sound. Click to mute background music only.' },
      'no-bgm': { text: 'SFX only', title: 'SFX only — click to mute all', aria: 'Background music muted. Click to mute all sound.' },
      muted: { text: 'Muted', title: 'Muted — click for full sound', aria: 'All sound muted. Click for full sound.' },
    };
    const info = labels[mode] || labels.full;
    btn.title = info.title;
    btn.setAttribute('aria-label', info.aria);
    btn.setAttribute('aria-pressed', String(mode !== 'full'));
    const label = btn.querySelector('.mute-label');
    if (label) label.textContent = info.text;
  }

  function init() {
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.addEventListener('click', async () => {
        await unlock();
        cycleMode();
      });
    }
    updateButton();
    startMusic();
  }

  window.GameAudio = {
    unlock,
    startMusic,
    stopMusic,
    setMusicVolumeScale,
    getMode,
    setMode,
    cycleMode,
    isMuted,
    playButton() {
      playOneShot(FILES.click, 0.55);
    },
    playCardDeal() {
      playOneShot(FILES.cardDeal, SFX_VOL * 0.5);
    },
    playCoin() {
      playOneShot(FILES.coin);
    },
    playFoodCreate() {
      playOneShot(FILES.foodCreate);
    },
    playFoodPlay() {
      playOneShot(FILES.foodPlay);
    },
    playGavel() {
      playOneShot(FILES.gavel, 0.85);
    },
    playGavelTriple() {
      if (!sfxAllowed()) return;
      playOneShot(FILES.gavel, 0.85);
      setTimeout(() => playOneShot(FILES.gavel, 0.85), 180);
      setTimeout(() => playOneShot(FILES.gavel, 0.85), 360);
    },
    playOpeningBell() {
      playOneShot(FILES.openingBell, SFX_VOL * 0.5);
    },
    playRollingDice() {
      playOneShot(FILES.rollingDice);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

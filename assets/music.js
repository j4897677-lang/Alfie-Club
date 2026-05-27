/* =========================================
   Alfie Club — Ambient Music Player (v2)
   - Always tries assets/ambient.mp3 first (works on file:// + http://)
   - Synth fallback only if mp3 actually errors
   - Floating toggle button bottom-right, golden, with playing pulse
   - State persisted in localStorage (default: off)
   ========================================= */
(function () {
  const KEY = 'alfie-music';
  const TRACK_URL = 'assets/ambient.mp3';

  const ICON_PLAY  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  const ICON_PAUSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  let audio = null;
  let synth = null;
  let mp3Failed = false;
  let isPlaying = false;
  let btn = null;

  function mount() {
    // Create the audio element eagerly; let it negotiate the file directly
    audio = new Audio(TRACK_URL);
    audio.loop = true;
    audio.volume = 0.55;          // louder default
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      mp3Failed = true;
      console.warn('[Alfie] ambient.mp3 unavailable, will use synth fallback');
    });
    audio.addEventListener('ended', () => { isPlaying = false; setButton(false); });

    // Build the floating button
    btn = document.createElement('button');
    btn.className = 'music-toggle';
    btn.type = 'button';
    btn.innerHTML = ICON_PLAY;
    btn.setAttribute('aria-label', 'Play ambient music');
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);

    // Auto-resume on first user gesture if user previously enabled
    if (localStorage.getItem(KEY) === 'on') {
      const startOnce = () => { play(); document.removeEventListener('click', startOnce); };
      document.addEventListener('click', startOnce, { once: true });
    }
  }

  function setButton(playing) {
    if (!btn) return;
    btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    btn.classList.toggle('playing', playing);
    const en = window.AlfieI18n && window.AlfieI18n.getLang() === 'en';
    btn.setAttribute('aria-label',
      playing
        ? (en ? 'Pause ambient music' : '暂停背景音乐')
        : (en ? 'Play ambient music' : '播放背景音乐'));
  }

  function play() {
    if (!mp3Failed && audio) {
      audio.play().then(() => {
        isPlaying = true;
        setButton(true);
        localStorage.setItem(KEY, 'on');
      }).catch((err) => {
        console.warn('[Alfie] audio.play() rejected:', err && err.name);
        // Browser blocked autoplay OR file failed; try synth as backup
        mp3Failed = true;
        startSynth();
        isPlaying = true;
        setButton(true);
        localStorage.setItem(KEY, 'on');
      });
    } else {
      startSynth();
      isPlaying = true;
      setButton(true);
      localStorage.setItem(KEY, 'on');
    }
  }

  function pause() {
    if (audio && !audio.paused) audio.pause();
    stopSynth();
    isPlaying = false;
    setButton(false);
    localStorage.setItem(KEY, 'off');
  }

  function toggle() { isPlaying ? pause() : play(); }

  // ---------- Synth fallback (richer, more audible than before) ----------
  function startSynth() {
    if (synth) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.8);
    master.connect(ctx.destination);

    // Filtered noise for snowy wind
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 700;
    nf.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.value = 0.35;
    noise.connect(nf).connect(ng).connect(master);
    noise.start();

    // Open A-major pad with detuned oscillators
    const freqs = [110, 220, 330, 440];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + Math.random() * 0.05;
      const lg = ctx.createGain();
      lg.gain.value = 0.04;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(master);
      o.start();
      return { o, lfo };
    });

    // Bell chimes
    const chimeT = setInterval(() => {
      if (!synth) return;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 660 + Math.random() * 660;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 4);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 4.2);
    }, 9000 + Math.random() * 5000);

    synth = { ctx, master, noise, oscs, chimeT };
  }

  function stopSynth() {
    if (!synth) return;
    const { ctx, master, noise, oscs, chimeT } = synth;
    clearInterval(chimeT);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    setTimeout(() => {
      try { noise.stop(); oscs.forEach(({ o, lfo }) => { o.stop(); lfo.stop(); }); ctx.close(); } catch (e) {}
      synth = null;
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

// Snowfall
(function snow() {
  const layer = document.querySelector('.snow');
  if (!layer) return;
  const flakes = ['❅', '❆', '❄'];
  const count = window.innerWidth < 700 ? 18 : 36;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'snowflake';
    s.textContent = flakes[i % flakes.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.fontSize = (10 + Math.random() * 14) + 'px';
    s.style.opacity = 0.4 + Math.random() * 0.5;
    s.style.animationDuration = (8 + Math.random() * 12) + 's';
    s.style.animationDelay = -Math.random() * 15 + 's';
    layer.appendChild(s);
  }
})();

// Reveal-on-scroll
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// Mobile nav
(function mobileNav() {
  const t = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!t || !links) return;
  t.addEventListener('click', () => links.classList.toggle('open'));
})();

// Form submit alert (uses i18n)
(function formAlert() {
  document.querySelectorAll('form[data-i18n-alert]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      alert(f.dataset.alertText || 'Thank you!');
    });
  });
})();

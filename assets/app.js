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

// ===================================================
// Form submission — dual channel: Formspree (email) + Feishu (group bot)
// ===================================================
const FORM_CONFIG = {
  formspreeId: '',
  feishuWebhook: 'https://open.feishu.cn/open-apis/bot/v2/hook/f0559ef3-62d7-4a08-9624-d678a5c2321f',
};

(function formSubmit() {
  const forms = document.querySelectorAll('form[data-i18n-alert]');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalBtnText = btn ? btn.textContent : '';
      const lang = window.AlfieI18n && window.AlfieI18n.getLang() === 'en' ? 'en' : 'zh';

      const inputs = form.querySelectorAll('input, select, textarea');
      const labels = form.querySelectorAll('label');
      const data = {};
      inputs.forEach((inp, i) => {
        const lab = labels[i];
        const k = lab ? lab.textContent.replace(/\s*\*\s*$/, '').trim() : (inp.name || `field_${i}`);
        data[k] = inp.value;
      });

      if (btn) {
        btn.disabled = true;
        btn.textContent = lang === 'en' ? 'Sending…' : '提交中…';
      }

      const tasks = [];

      if (FORM_CONFIG.formspreeId) {
        const url = `https://formspree.io/f/${FORM_CONFIG.formspreeId}`;
        tasks.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, _subject: '🎿 Alfie Club 新预约', source: location.href })
          }).then(r => ({ name: 'formspree', ok: r.ok }))
            .catch(err => ({ name: 'formspree', ok: false, err }))
        );
      }

      if (FORM_CONFIG.feishuWebhook) {
        const lines = Object.entries(data).map(([k, v]) => `**${k}**: ${v || '—'}`).join('\n');
        const card = {
          msg_type: 'interactive',
          card: {
            header: { template: 'blue', title: { tag: 'plain_text', content: '🎿 Alfie Club 新预约' } },
            elements: [
              { tag: 'div', text: { tag: 'lark_md', content: lines } },
              { tag: 'hr' },
              { tag: 'note', elements: [{ tag: 'plain_text', content: `来源：${location.href}` }] }
            ]
          }
        };
        tasks.push(
          fetch(FORM_CONFIG.feishuWebhook, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(card)
          }).then(() => ({ name: 'feishu', ok: true }))
            .catch(err => ({ name: 'feishu', ok: false, err }))
        );
      }

      if (!tasks.length) {
        console.warn('[Alfie] No form endpoints configured. See FORM_CONFIG in app.js');
      }

      const results = await Promise.all(tasks);
      const anyOk = !tasks.length || results.some(r => r.ok);

      if (btn) {
        btn.disabled = false;
        btn.textContent = originalBtnText;
      }

      if (anyOk) {
        alert(form.dataset.alertText || (lang === 'en' ? 'Thank you! We will be in touch.' : '感谢您的提交！我们会尽快与您联系。'));
        form.reset();
      } else {
        console.error('[Alfie] All submission channels failed:', results);
        alert(lang === 'en'
          ? 'Submission failed. Please try again, or contact us at alfie-jojo@alfieclub.cn'
          : '提交失败，请重试，或直接邮件至 alfie-jojo@alfieclub.cn');
      }
    });
  });
})();

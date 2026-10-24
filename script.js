// ---------- theme ----------
const root = document.documentElement;
const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
if (savedTheme) root.dataset.theme = savedTheme;
else if (matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme = 'light';

document.getElementById('themeBtn').addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
});

// ---------- nav: shadow, burger, active section ----------
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  navLinks.classList.remove('open');
}));

const links = [...navLinks.querySelectorAll('a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

// ---------- reveal + counters ----------
const numFmt = dec => new Intl.NumberFormat(document.documentElement.lang, { minimumFractionDigits: dec, maximumFractionDigits: dec });
const countUp = el => {
  const target = parseFloat(el.dataset.count);
  const dec = +(el.dataset.dec || 0);
  const t0 = performance.now();
  const step = t => {
    const p = Math.min((t - t0) / 1400, 1);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = numFmt(dec).format(v);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = Math.min(siblings.indexOf(el), 6) * 70 + 'ms';
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(el);
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- typed role ----------
// Typed lines come from the page so each language version keeps its own wording.
const roles = JSON.parse(document.getElementById('typed').dataset.roles);
const typed = document.getElementById('typed');
let ri = 0, ci = roles[0].length, deleting = true;
const tick = () => {
  const word = roles[ri];
  ci += deleting ? -1 : 1;
  typed.textContent = word.slice(0, ci);
  let delay = deleting ? 35 : 70;
  if (!deleting && ci === word.length) { deleting = true; delay = 2200; }
  else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 300; }
  setTimeout(tick, delay);
};
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(tick, 2600);

// ---------- lightbox ----------
// Each certificate or picture opens with its group (certificates, gallery, or one project) so arrows page through it.
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('figcaption');
let group = [], gi = 0;
const show = () => {
  const { src, cap } = group[gi];
  lbImg.src = src;
  lbCap.innerHTML = cap;
};
const openLb = (items, i) => {
  group = items; gi = i; show();
  lb.classList.toggle('single', items.length < 2);
  lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
};
const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
const step = d => { gi = (gi + d + group.length) % group.length; show(); };

const certs = [...document.querySelectorAll('.cert')];
const certItems = certs.map(b => ({ src: b.dataset.src, cap: b.querySelector('span').innerHTML }));
certs.forEach((b, i) => b.addEventListener('click', () => openLb(certItems, i)));

document.querySelectorAll('[data-zoom]').forEach(img => img.addEventListener('click', () => {
  const scope = img.closest('.gallery, .project, .grid-3') || document.body;
  const imgs = [...scope.querySelectorAll('[data-zoom]')];
  const items = imgs.map(el => ({ src: el.src, cap: el.closest('figure')?.querySelector('figcaption')?.textContent || el.alt }));
  openLb(items, imgs.indexOf(img));
}));

lb.addEventListener('click', e => {
  if (e.target.closest('.lb-nav')) step(e.target.closest('.prev') ? -1 : 1);
  else if (e.target !== lbImg) closeLb();
});
addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
let touchX = null;
lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  touchX = null;
});

// ---------- copy email ----------
const toast = document.getElementById('toast');
document.getElementById('copyMail').addEventListener('click', async e => {
  const mail = e.currentTarget.dataset.mail;
  try { await navigator.clipboard.writeText(mail); }
  catch { location.href = 'mailto:' + mail; return; }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
});

// ---------- timeline: event photos and certificates ----------
document.querySelectorAll('.tl-card[data-photos]').forEach(card => {
  const items = card.dataset.photos.split(';').map(p => {
    const [src, cap] = p.split('|');
    return { src, cap: `${card.dataset.title}<small>${cap}</small>` };
  });
  const thumbs = document.createElement('div');
  thumbs.className = 'tl-thumbs';
  items.slice(0, 3).forEach(({ src }) => {
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.loading = 'lazy';
    thumbs.append(img);
  });
  card.append(thumbs);
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `${card.dataset.title}: ${document.documentElement.lang === 'en' ? 'photos' : 'фото'}`);
  card.addEventListener('click', () => openLb(items, 0));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(items, 0); } });
});

// ---------- screen recordings: play only while visible ----------
const videoIo = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {});
    else target.pause();
  });
}, { threshold: .25 });
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[data-inview]').forEach(v => videoIo.observe(v));
}

// ---------- scroll progress ----------
const progress = document.getElementById('progress');
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();

// ---------- scroll-linked: timeline line and project parallax ----------
const timeline = document.getElementById('timeline');
const tlItems = timeline ? [...timeline.querySelectorAll('.tl-item')] : [];
const visuals = [...document.querySelectorAll('.project .project-visual, .proj-wide .lab-img')];
const calm = matchMedia('(prefers-reduced-motion: reduce)');
let ticking = false;
const onScroll = () => {
  ticking = false;
  const mark = innerHeight * 0.6;
  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const p = Math.min(Math.max((mark - r.top) / r.height, 0), 1);
    timeline.style.setProperty('--tl', p.toFixed(3));
    tlItems.forEach(item => item.classList.toggle('lit', item.getBoundingClientRect().top + 30 < mark));
  }
  if (!calm.matches && innerWidth > 1020) {
    visuals.forEach(v => {
      const r = v.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -0.06;
      v.style.transform = `translateY(${offset.toFixed(1)}px)`;
    });
  }
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('list');
  const qEl = document.getElementById('q');
  const catEl = document.getElementById('cat');

  let PRODUCTS = [];

  fetch('products.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('products.json を取得できませんでした');
      return r.json();
    })
    .then(data => {
      PRODUCTS = Array.isArray(data) ? data : [];
      buildCategoryOptions(PRODUCTS);
      render(PRODUCTS);
    })
    .catch(err => {
      listEl.innerHTML = `<p style="color:#b00;">読み込みエラー：${escapeHtml(err.message)}</p>`;
    });

  qEl.addEventListener('input', debounce(applyFilters, 150));
  catEl.addEventListener('change', applyFilters);

  function applyFilters() {
    const q = (qEl.value || '').trim().toLowerCase();
    const cat = (catEl.value || '').trim();
    const filtered = PRODUCTS.filter(p => {
      const name = (p.name || '').toLowerCase();
      const jan = String(p.jan || '');
      const category = String(p.category || '').trim();
      const matchQ = !q || name.includes(q) || jan.includes(q);
      const matchC = !cat || category === cat;
      return matchQ && matchC;
    });
    render(filtered);
  }

  function buildCategoryOptions(items) {
    const cats = [...new Set(items.map(p => (p.category || '').trim()).filter(Boolean))].sort();
    for (const c of cats) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      catEl.appendChild(opt);
    }
  }

  function render(items) {
    if (!items.length) {
      listEl.innerHTML = `<p>対象商品がありません。</p>`;
      return;
    }
    listEl.innerHTML = '';

    for (const p of items) {
      const card = document.createElement('div');
      card.className = 'card';

      const janText = String(p.jan ?? '');
      const janHtml = `
        <span>${janText}</span>
        <button class="copy-btn" data-jan="${janText}">コピー</button>
      `;

      card.innerHTML = `
        <div class="meta">カテゴリ：${escapeHtml(p.category ?? '-')}</div>
        <h3>${escapeHtml(p.name ?? '(無題)')}</h3>
        <div class="meta">JAN：${janHtml}</div>
        <div class="media"></div>
      `;

const media = card.querySelector('.media');
const imgPath = String(p.image || '').trim();

if (imgPath) {
  const img = new Image();
  img.loading = 'lazy';
  img.alt = p.name || '商品画像';
  img.addEventListener('error', () => {
    // ブラウザが解決した“最終URL”を表示
    const resolved = new URL(imgPath, document.baseURI).href;
    console.error('画像を読み込めません:', resolved);
    media.innerHTML =
      `<small style="color:#b00;">画像を読み込めませんでした<br>${escapeHtml(resolved)}</small>`;
  });
  img.src = imgPath;
  media.appendChild(img);
} else {
  media.innerHTML = '<small>画像なし</small>';
}

      listEl.appendChild(card);
    }

    listEl.onclick = (e) => {
      const btn = e.target.closest('.copy-btn');
      if (!btn) return;
      const jan = btn.dataset.jan || '';
      if (!jan) return;
      navigator.clipboard?.writeText(jan).then(() => {
        btn.textContent = 'コピー済み';
        setTimeout(() => (btn.textContent = 'コピー'), 1200);
      });
    };
  }

  function debounce(fn, wait = 200) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }
  function escapeHtml(s='') {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
});

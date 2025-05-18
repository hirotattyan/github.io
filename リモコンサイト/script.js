fetch('products.json')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('product-list');
    data.forEach(product => {
      const card = `
        <div class="product-card">
          <img src="images/${product.image}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <p class="price">¥${product.price}</p>
        </div>
      `;
      list.innerHTML += card;
    });
  })
  .catch(error => {
    console.error("商品データの読み込みに失敗しました：", error);
  });

  let allProducts = []; // 全商品のキャッシュ用

// 商品を描画する関数
function renderProducts(products) {
  const list = document.getElementById('product-list');
  list.innerHTML = ""; // 一旦リセット

   if (products.length === 0) {
    list.innerHTML = `
      <div class="not-found">
        <p>該当する商品は見つかりませんでした。</p>
        <img src="images/notfound.jpg" alt="該当なし" style="max-width: 300px;">
      </div>
    `;
    return;
  }

  products.forEach(product => {
    const card = `
      <div class="product-card">
        <img src="images/${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">¥${product.price}</p>
      </div>
    `;
    list.innerHTML += card;
  });
}

// 商品データを読み込み＋初期表示
fetch('products.json')
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    renderProducts(allProducts);
  })
  .catch(error => {
    console.error("商品データの読み込みに失敗しました：", error);
  });

// 検索ボタンを押したときの処理
document.getElementById('search-button').addEventListener('click', () => {
  const keyword = document.getElementById('search-input').value.trim().toLowerCase();

  const filtered = allProducts.filter(product => {
    return (
      product.name.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword)
    );
  });

  renderProducts(filtered);
});

const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

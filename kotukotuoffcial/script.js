"use strict";

// 製品情報の価格を、冒頭などの価格表示にも反映します。
// 価格の変更箇所：index.html の id="product-price"。
const productPrice = document.getElementById("product-price");
if (productPrice) {
  document.querySelectorAll("[data-product-price]").forEach((element) => {
    element.textContent = productPrice.textContent.trim();
  });
}

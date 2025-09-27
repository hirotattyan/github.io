  const form = document.getElementById('add-product-form');
  const output = document.getElementById('json-output');
  const downloadBtn = document.getElementById('download-json');
  let products = JSON.parse(localStorage.getItem('products')) || [];
  output.textContent = JSON.stringify(products, null, 2); // 表示更新

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const jan = document.getElementById('jan').value.trim();
    const name = document.getElementById('name').value.trim();
    const image = "images/" + document.getElementById('image').value.trim();
    const category = document.getElementById('category').value;

    const newProduct = { jan, name, image, category };
    products.push(newProduct);

     localStorage.setItem('products', JSON.stringify(products));
     output.textContent = JSON.stringify(products, null, 2);


    form.reset();
  });

  downloadBtn.addEventListener('click',function(){
    const jsonData = JSON.stringify(products,null,2);
    const blob = new Blob([jsonData],{ type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link =document.createElement('a');
    link.href = url;
    link.download = 'products.json';
    link.click();
  });
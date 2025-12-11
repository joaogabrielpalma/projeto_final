const API = 'http://localhost:3000';

let currentCartId = null;
let cartCount = 0;

// LOAD PIZZAS
async function fetchPizzas() {
  const res = await fetch(API + '/pizzas');
  const pizzas = await res.json();
  renderPizzas(pizzas);
}

function renderPizzas(pizzas) {
  const container = document.getElementById('pizzas');
  container.innerHTML = '';

  pizzas.forEach(p => {
    const c = document.createElement('div');
    c.className = "card";
    c.innerHTML = `
      <img src="${p.image_url}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <strong>R$ ${p.price}</strong><br>
      <button onclick="addToCart(${p.id})">Adicionar</button>
    `;
    container.appendChild(c);
  });
}

async function ensureCart() {
  if (currentCartId) return currentCartId;
  const res = await fetch(API + '/cart', { method:'POST', headers:{'Content-Type':'application/json'} });
  const cart = await res.json();
  currentCartId = cart.id;
  return cart.id;
}

async function addToCart(id) {
  const cartId = await ensureCart();
  await fetch(`${API}/cart/${cartId}/items`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ pizza_id:id, quantity:1 })
  });
  cartCount++;
  document.getElementById('cart-count').textContent = cartCount;
}

async function viewCart() {
  const res = await fetch(`${API}/cart/${currentCartId}`);
  const data = await res.json();

  document.getElementById('pizzas-section').classList.add('hidden');
  document.getElementById('cart-section').classList.remove('hidden');

  const area = document.getElementById('cart-contents');
  area.innerHTML = '';

  data.items.forEach(it => {
    const row = document.createElement('div');
    row.innerHTML = `
      <strong>${it.pizza.name}</strong> — R$ ${it.pizza.price}
      <br>
      <button class="remove-btn" onclick="removeItem(${it.id})">Remover</button>
      <hr>
    `;
    area.appendChild(row);
  });
}

async function removeItem(id) {
  await fetch(`${API}/cart/items/${id}`, { method:'DELETE' });
  cartCount--;
  document.getElementById('cart-count').textContent = cartCount;
  viewCart();
}

document.getElementById('view-cart-btn').onclick = viewCart;
document.getElementById('back-to-shop-btn').onclick = () => {
  document.getElementById('cart-section').classList.add('hidden');
  document.getElementById('pizzas-section').classList.remove('hidden');
};

document.getElementById('checkout-btn').onclick = checkout;

async function checkout() {
  const res = await fetch(`${API}/checkout/${currentCartId}`, { method:'POST' });
  const data = await res.json();

  document.getElementById('checkout-result').innerHTML = `
    <h3>Compra Finalizada!</h3>
    <p>Total: R$ ${data.total}</p>
    <p>Status: ${data.status}</p>
  `;
  currentCartId = null;
  cartCount = 0;
  document.getElementById('cart-count').textContent = 0;
  document.getElementById('cart-contents').innerHTML = "";
}

fetchPizzas();
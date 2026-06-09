const products = [
  {
    id: 'shirt-01',
    name: 'Kemeja Batik Premium',
    price: 189000,
    category: 'Atasan',
    description: 'Kemeja batik modern dengan bahan adem dan potongan slim fit.',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1520975924654-0c2d9c91b73b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jacket-02',
    name: 'Jaket Denim Lokal',
    price: 249000,
    category: 'Jaket',
    description: 'Jaket denim unisex dengan detail bordir Jawa Timur.',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'polo-03',
    name: 'Polo Classic Merah',
    price: 129000,
    category: 'Atasan',
    description: 'Polo shirt nyaman untuk gaya kasual dan formal ringan.',
    badge: 'Limited',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'dress-04',
    name: 'Dress Santai Bali',
    price: 215000,
    category: 'Dress',
    description: 'Dress motif tropis yang ringan cocok untuk liburan.',
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hoodie-05',
    name: 'Hoodie Street Style',
    price: 179000,
    category: 'Jaket',
    description: 'Hoodie oversize dengan desain minimalis dan nyaman.',
    badge: 'Promo',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80'
  }
];

const cart = {};
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartToggle = document.getElementById('cart-toggle');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

function renderProducts(list) {
  productGrid.innerHTML = '';

  list.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-content">
        <span class="badge">${product.badge}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="price">${formatCurrency(product.price)}</div>
        <button class="btn btn-primary" data-id="${product.id}">Tambah ke Keranjang</button>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function updateCartSummary() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartTotal.textContent = formatCurrency(Object.values(cart).reduce((sum, item) => sum + item.quantity * item.price, 0));
}

function renderCart() {
  cartItems.innerHTML = '';

  if (Object.keys(cart).length === 0) {
    cartItems.innerHTML = '<p style="color: var(--muted);">Keranjang masih kosong.</p>';
    cartTotal.textContent = formatCurrency(0);
    return;
  }

  Object.values(cart).forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="details">
        <strong>${item.name}</strong>
        <small>${formatCurrency(item.price)}</small>
        <div class="quantity">
          <button data-action="decrement" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button data-action="increment" data-id="${item.id}">+</button>
        </div>
      </div>
    `;
    cartItems.appendChild(row);
  });

  updateCartSummary();
}

function addProductToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!cart[productId]) {
    cart[productId] = { ...product, quantity: 0 };
  }
  cart[productId].quantity += 1;
  renderCart();
}

function changeQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].quantity += delta;

  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  renderCart();
}

function showCart() {
  cartPanel.classList.add('open');
}

function hideCart() {
  cartPanel.classList.remove('open');
}

function showModal() {
  modal.classList.add('open');
}

function hideModal() {
  modal.classList.remove('open');
}

function handleProductActions(event) {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  const productId = button.dataset.id;
  addProductToCart(productId);
}

function handleCartActions(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'increment') changeQuantity(id, 1);
  if (action === 'decrement') changeQuantity(id, -1);
}

function handleSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.description.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

productGrid.addEventListener('click', handleProductActions);
cartItems.addEventListener('click', handleCartActions);
cartToggle.addEventListener('click', showCart);
cartClose.addEventListener('click', hideCart);
checkoutButton.addEventListener('click', () => {
  if (Object.keys(cart).length === 0) return;
  showModal();
  Object.keys(cart).forEach(key => delete cart[key]);
  renderCart();
});
modalClose.addEventListener('click', hideModal);
modal.addEventListener('click', event => {
  if (event.target === modal) hideModal();
});
searchInput.addEventListener('input', handleSearch);

renderProducts(products);
renderCart();

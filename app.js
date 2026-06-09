const products = [
  {
    id: 'shirt-01',
    name: 'Kemeja Batik Premium',
    price: 189000,
    category: 'Atasan',
    description: 'Kemeja batik modern dengan bahan adem dan potongan slim fit.',
    badge: 'Best Seller',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1520975924654-0c2d9c91b73b?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'jacket-02',
    name: 'Jaket Denim Lokal',
    price: 249000,
    category: 'Jaket',
    description: 'Jaket denim unisex dengan detail bordir Jawa Timur.',
    badge: 'New',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'polo-03',
    name: 'Polo Classic Merah',
    price: 129000,
    category: 'Atasan',
    description: 'Polo shirt nyaman untuk gaya kasual dan formal ringan.',
    badge: 'Limited',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'dress-04',
    name: 'Dress Santai Bali',
    price: 215000,
    category: 'Dress',
    description: 'Dress motif tropis yang ringan cocok untuk liburan.',
    badge: 'Trending',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'hoodie-05',
    name: 'Hoodie Street Style',
    price: 179000,
    category: 'Jaket',
    description: 'Hoodie oversize dengan desain minimalis dan nyaman.',
    badge: 'Promo',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'skirt-06',
    name: 'Rok Midi Tenun',
    price: 139000,
    category: 'Bawahan',
    description: 'Rok midi tenun tradisional ringan dan elegan untuk acara kasual.',
    badge: 'New',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1520962912226-0d5d7da2b5fe?auto=format&fit=crop&w=900&q=80'
  }
];

const categories = ['All', 'Atasan', 'Jaket', 'Dress', 'Bawahan'];
const cart = JSON.parse(localStorage.getItem('njiCart')) || {};
let activeCategory = 'All';

const productGrid = document.getElementById('products');
const categoryFilter = document.getElementById('category-filter');
const cartCount = document.getElementById('cart-count');
const cartToggle = document.getElementById('cart-toggle');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartItemsCount = document.getElementById('cart-items-count');
const checkoutButton = document.getElementById('checkout-button');
const searchInput = document.getElementById('search-input');
const heroShop = document.getElementById('hero-shop');
const footerShop = document.getElementById('footer-shop');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

function saveCart() {
  localStorage.setItem('njiCart', JSON.stringify(cart));
}

function getFilteredProducts() {
  const query = searchInput.value.toLowerCase().trim();
  return products.filter(product => {
    const categoryMatch = activeCategory === 'All' || product.category === activeCategory;
    const queryMatch = product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);
    return categoryMatch && queryMatch;
  });
}

function renderFilters() {
  categoryFilter.innerHTML = categories.map(category => {
    const activeClass = category === activeCategory ? 'filter-chip active' : 'filter-chip';
    return `<button class="${activeClass}" data-category="${category}">${category}</button>`;
  }).join('');
}

function renderProducts(list) {
  productGrid.innerHTML = list.map(product => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-content">
        <div class="product-meta">
          <span>${product.category}</span>
          <span>${product.rating.toFixed(1)} ★</span>
        </div>
        <span class="badge">${product.badge}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="price">${formatCurrency(product.price)}</div>
        <div class="product-actions">
          <button class="btn btn-secondary" data-action="details" data-id="${product.id}">Lihat</button>
          <button class="btn btn-primary" data-action="add" data-id="${product.id}">Tambah ke Keranjang</button>
        </div>
      </div>
    </article>
  `).join('');
}

function updateCartSummary() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartCount.textContent = totalItems;
  cartItemsCount.textContent = `${totalItems} item`;
  cartTotal.textContent = formatCurrency(totalPrice);
}

function renderCart() {
  cartItems.innerHTML = '';

  if (Object.keys(cart).length === 0) {
    cartItems.innerHTML = '<p style="color: var(--muted); margin: 1rem 0;">Keranjang masih kosong. Tambahkan produk terlebih dahulu.</p>';
    updateCartSummary();
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
  saveCart();
  renderCart();
}

function changeQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].quantity += delta;

  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  saveCart();
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

function handleProductGridClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const productId = button.dataset.id;
  if (action === 'add') {
    addProductToCart(productId);
    return;
  }

  if (action === 'details') {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    alert(`${product.name}\n\n${product.description}\n\nHarga: ${formatCurrency(product.price)}`);
  }
}

function handleCartActions(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const productId = button.dataset.id;
  if (action === 'increment') changeQuantity(productId, 1);
  if (action === 'decrement') changeQuantity(productId, -1);
}

function handleSearch() {
  renderProducts(getFilteredProducts());
}

function handleCategoryClick(event) {
  const button = event.target.closest('button[data-category]');
  if (!button) return;

  activeCategory = button.dataset.category;
  renderFilters();
  renderProducts(getFilteredProducts());
}

function handleCheckout() {
  if (Object.keys(cart).length === 0) {
    alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');
    return;
  }

  showModal();
  Object.keys(cart).forEach(id => delete cart[id]);
  saveCart();
  renderCart();
}

function init() {
  renderFilters();
  renderProducts(getFilteredProducts());
  renderCart();

  categoryFilter.addEventListener('click', handleCategoryClick);
  productGrid.addEventListener('click', handleProductGridClick);
  cartItems.addEventListener('click', handleCartActions);
  cartToggle.addEventListener('click', showCart);
  cartClose.addEventListener('click', hideCart);
  checkoutButton.addEventListener('click', handleCheckout);
  searchInput.addEventListener('input', handleSearch);
  heroShop.addEventListener('click', () => {
    window.location.hash = '#products';
  });
  footerShop.addEventListener('click', () => {
    window.location.hash = '#products';
  });
  modalClose.addEventListener('click', hideModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) hideModal();
  });
}

init();

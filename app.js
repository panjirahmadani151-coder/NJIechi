const products = [
  {
    id: 'shirt-01',
    name: 'Kemeja Batik Premium',
    price: 189000,
    category: 'Atasan',
    description: 'Kemeja batik modern dengan bahan adem dan potongan slim fit.',
    badge: 'Best Seller',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1520975924654-0c2d9c91b73b?auto=format&fit=crop&w=900&q=80',
    variants: [
      { id: 's-white', name: 'Putih / S', price: 189000 },
      { id: 'm-blue', name: 'Biru / M', price: 199000 },
      { id: 'l-black', name: 'Hitam / L', price: 199000 }
    ]
  },
  {
    id: 'jacket-02',
    name: 'Jaket Denim Lokal',
    price: 249000,
    category: 'Jaket',
    description: 'Jaket denim unisex dengan detail bordir Jawa Timur.',
    badge: 'New',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    variants: [
      { id: 'm-indigo', name: 'Indigo / M', price: 249000 },
      { id: 'l-indigo', name: 'Indigo / L', price: 259000 }
    ]
  },
  {
    id: 'polo-03',
    name: 'Polo Classic Merah',
    price: 129000,
    category: 'Atasan',
    description: 'Polo shirt nyaman untuk gaya kasual dan formal ringan.',
    badge: 'Limited',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80',
    variants: [
      { id: 'm-red', name: 'Merah / M', price: 129000 },
      { id: 'l-red', name: 'Merah / L', price: 139000 }
    ]
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
const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const checkoutCancel = document.getElementById('checkout-cancel');
const paymentMethodEl = document.getElementById('payment-method');
const attachmentEl = document.getElementById('attachment');
const productModal = document.getElementById('product-modal');
const detailImage = document.getElementById('detail-image');
const detailName = document.getElementById('detail-name');
const detailDesc = document.getElementById('detail-desc');
const variantSelect = document.getElementById('variant-select');
const variantQty = document.getElementById('variant-qty');
const addVariantCart = document.getElementById('add-variant-cart');
const productCancel = document.getElementById('product-cancel');

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
  Object.entries(cart).forEach(([key, item]) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const variantLabel = item.variant_name ? `<div style="font-size:0.85rem;color:var(--muted)">${item.variant_name}</div>` : '';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="details">
        <strong>${item.name}</strong>
        ${variantLabel}
        <small>${formatCurrency(item.price)}</small>
        <div class="quantity">
          <button data-action="decrement" data-id="${key}">-</button>
          <span>${item.quantity}</span>
          <button data-action="increment" data-id="${key}">+</button>
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
  // default add without variant uses key 'productId::default'
  const key = `${productId}::default`;
  if (!cart[key]) {
    cart[key] = { id: key, product_id: productId, variant_id: null, name: product.name, variant_name: null, price: product.price, image: product.image, quantity: 0 };
  }
  cart[key].quantity += 1;
  saveCart();
  renderCart();
}

function changeQuantity(itemKey, delta) {
  if (!cart[itemKey]) return;
  cart[itemKey].quantity += delta;

  if (cart[itemKey].quantity <= 0) {
    delete cart[itemKey];
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
    const product = products.find(p => p.id === productId);
    if (product && product.variants && product.variants.length) {
      openProductModal(productId);
    } else {
      addProductToCart(productId);
    }
    return;
  }

  if (action === 'details') {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    openProductModal(productId);
  }
}

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  detailImage.src = product.image;
  detailName.textContent = product.name;
  detailDesc.textContent = product.description;
  variantSelect.innerHTML = '';
  if (product.variants && product.variants.length) {
    product.variants.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.name} — ${formatCurrency(v.price)}`;
      opt.dataset.price = v.price;
      variantSelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = 'default';
    opt.textContent = `${product.name} — ${formatCurrency(product.price)}`;
    opt.dataset.price = product.price;
    variantSelect.appendChild(opt);
  }
  variantQty.value = 1;
  productModal.classList.add('open');
  // attach handler
  addVariantCart.onclick = () => {
    const vid = variantSelect.value;
    const qty = parseInt(variantQty.value, 10) || 1;
    addVariantToCart(productId, vid, qty);
    productModal.classList.remove('open');
  };
}

productCancel && productCancel.addEventListener('click', () => productModal.classList.remove('open'));

function addVariantToCart(productId, variantId, qty) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  let variant = null;
  if (product.variants && product.variants.length) variant = product.variants.find(v => v.id === variantId);
  const key = `${productId}::${variant ? variant.id : 'default'}`;
  if (!cart[key]) {
    cart[key] = {
      id: key,
      product_id: productId,
      variant_id: variant ? variant.id : null,
      name: product.name,
      variant_name: variant ? variant.name : null,
      price: variant ? variant.price : product.price,
      image: product.image,
      quantity: 0
    };
  }
  cart[key].quantity += qty;
  saveCart();
  renderCart();
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
  checkoutModal.classList.add('open');
}

// Simulate payment integration and settlement
function processPayment(order) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let payment_status = 'COMPLETED';
      let order_status = 'PROCESSING';
      let title = 'Pembayaran Berhasil';
      let message = `Order ${order.order_id} berhasil, total ${formatCurrency(order.total)}.`;

      if (order.payment_method === 'cod') {
        payment_status = 'PENDING_COD';
        order_status = 'AWAITING_COD_COLLECTION';
        title = 'Pesanan Dikonfirmasi (COD)';
        message = `Order ${order.order_id} telah dikonfirmasi. Bayar saat barang diterima (COD).`;
      }

      if (order.payment_method === 'va') {
        payment_status = 'AWAITING_VA';
        order_status = 'UNPAID';
        title = 'Virtual Account Dibuat';
        message = `Virtual Account telah dibuat. Silakan lakukan pembayaran melalui bank. Order ID: ${order.order_id}`;
      }

      resolve({ payment_status, order_status, title, message });
    }, 900);
  });
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
  // If returning from payment simulator, show confirmation modal
  const params = new URLSearchParams(window.location.search);
  const paidOrderId = params.get('paid_order');
  if (paidOrderId) {
    const all = JSON.parse(localStorage.getItem('njiOrders') || '[]');
    const o = all.find(x => x.order_id === paidOrderId);
    if (o) {
      document.getElementById('modal-title').textContent = 'Pembayaran Sukses';
      document.getElementById('modal-body').textContent = `Pembayaran untuk order ${paidOrderId} telah diterima. Terima kasih.`;
      showModal();
    }
    // remove query param to avoid repeat
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('paid_order');
      window.history.replaceState({}, document.title, url.toString());
    }
  }
  // checkout modal handlers
  checkoutCancel.addEventListener('click', () => checkoutModal.classList.remove('open'));
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(checkoutForm);
    const customer = {
      name: form.get('name'),
      phone: form.get('phone'),
      address: form.get('address'),
      city: form.get('city'),
      postal: form.get('postal')
    };
    const payment_method = form.get('payment_method');
    const attachmentFile = attachmentEl.files && attachmentEl.files[0];

    const orderId = 'ORD-' + Date.now();
    const items = Object.values(cart).map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));
    const total = Object.values(cart).reduce((s, it) => s + it.quantity * it.price, 0);
    const order = {
      order_id: orderId,
      items,
      total,
      customer,
      payment_method,
      payment_status: 'PENDING',
      attachment: null,
      status: 'UNPAID',
      created_at: new Date().toISOString()
    };

    if (attachmentFile) {
      order.attachment = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(attachmentFile);
      });
    }

    const orders = JSON.parse(localStorage.getItem('njiOrders') || '[]');
    // mark awaiting for non-cod payments
    if (payment_method !== 'cod') {
      order.payment_status = 'AWAITING_PAYMENT';
      order.status = 'AWAITING_PAYMENT';
    }
    orders.unshift(order);
    localStorage.setItem('njiOrders', JSON.stringify(orders));

    // Redirect to local Payment Simulator for non-COD methods
    if (payment_method !== 'cod') {
      // clear cart (we move to payment flow)
      Object.keys(cart).forEach(id => delete cart[id]);
      saveCart();
      renderCart();
      checkoutModal.classList.remove('open');
      // navigate to payment simulator with order id and method
      window.location.href = `payment.html?order_id=${encodeURIComponent(order.order_id)}&method=${encodeURIComponent(payment_method)}`;
      return;
    }

    // COD: keep existing simulation locally
    processPayment(order).then((res) => {
      const all = JSON.parse(localStorage.getItem('njiOrders') || '[]');
      const idx = all.findIndex(o => o.order_id === order.order_id);
      if (idx >= 0) {
        all[idx].payment_status = res.payment_status;
        all[idx].status = res.order_status;
        localStorage.setItem('njiOrders', JSON.stringify(all));
      }

      Object.keys(cart).forEach(id => delete cart[id]);
      saveCart();
      renderCart();
      checkoutModal.classList.remove('open');
      document.getElementById('modal-title').textContent = res.title;
      document.getElementById('modal-body').textContent = res.message;
      showModal();
    });
  });
}

init();

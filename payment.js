// Payment Simulator script
(function(){
  function qs(param){
    return new URLSearchParams(window.location.search).get(param);
  }

  const orderId = qs('order_id');
  const method = qs('method');
  const titleEl = document.getElementById('pay-title');
  const descEl = document.getElementById('pay-desc');
  const infoEl = document.getElementById('order-info');
  const payBtn = document.getElementById('pay-now');
  const cancelBtn = document.getElementById('cancel');

  if (!orderId) {
    titleEl.textContent = 'Order tidak ditemukan';
    descEl.textContent = 'Parameter order_id tidak disediakan.';
    payBtn.disabled = true;
    throw new Error('order_id missing');
  }

  const orders = JSON.parse(localStorage.getItem('njiOrders') || '[]');
  const order = orders.find(o => o.order_id === orderId);
  if (!order) {
    titleEl.textContent = 'Order tidak ditemukan';
    descEl.textContent = `Order ${orderId} tidak ada di storage.`;
    payBtn.disabled = true;
  } else {
    titleEl.textContent = `Pembayaran ${method.toUpperCase()}`;
    descEl.textContent = `Order: ${orderId} • Total: ${new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR'}).format(order.total)}`;
    infoEl.innerHTML = `<strong>Nama:</strong> ${order.customer.name} <br/><strong>Metode:</strong> ${method}`;
    // For VA simulate account number
    if (method === 'va') {
      const va = 'VA' + (Math.floor(Math.random()*900000)+100000);
      infoEl.innerHTML += `<br/><strong>Virtual Account:</strong> ${va}`;
    }
  }

  payBtn.addEventListener('click', () => {
    payBtn.disabled = true;
    payBtn.textContent = 'Memproses...';
    setTimeout(() => {
      // update order status in localStorage
      const all = JSON.parse(localStorage.getItem('njiOrders') || '[]');
      const idx = all.findIndex(o => o.order_id === orderId);
      if (idx >= 0) {
        all[idx].payment_status = 'COMPLETED';
        all[idx].status = 'PROCESSING';
        // award reward coins (1% cashback of final_total or total)
        const base = all[idx].final_total !== undefined ? all[idx].final_total : all[idx].total;
        const reward = Math.max(0, Math.floor(base * 0.01));
        all[idx].reward = reward;
        // add to user's coin balance
        const cur = JSON.parse(localStorage.getItem('njiCoins') || '0');
        localStorage.setItem('njiCoins', JSON.stringify(cur + reward));
        localStorage.setItem('njiOrders', JSON.stringify(all));
      }
      // redirect back with success flag
      window.location.href = `index.html?paid_order=${encodeURIComponent(orderId)}`;
    }, 1200);
  });

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
})();

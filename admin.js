// Minimal Admin dashboard to manage orders stored in localStorage (njiOrders)
(function(){
  const root = document.getElementById('orders-root');
  const searchInput = document.getElementById('admin-search');
  const statusFilter = document.getElementById('admin-status-filter');
  const totalOrdersElem = document.getElementById('total-orders');
  const pendingOrdersElem = document.getElementById('pending-orders');
  const completedOrdersElem = document.getElementById('completed-orders');
  const returnRequestsElem = document.getElementById('return-requests');

  function formatCurrency(v){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(v); }

  function loadOrders(){ return JSON.parse(localStorage.getItem('njiOrders') || '[]'); }
  function saveOrders(o){ localStorage.setItem('njiOrders', JSON.stringify(o)); }

  function getFilteredOrders(){
    const orders = loadOrders();
    const query = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    return orders.filter(o => {
      const customerName = (o.customer && o.customer.name) ? o.customer.name : '';
      const matchesQuery = !query || o.order_id.toLowerCase().includes(query) || customerName.toLowerCase().includes(query) || (o.name || '').toLowerCase().includes(query);
      const matchesStatus = !status || o.status === status;
      return matchesQuery && matchesStatus;
    });
  }

  function renderSummary(){
    const orders = loadOrders();
    const pending = orders.filter(o => ['UNPAID','AWAITING_COD_COLLECTION','PROCESSING'].includes(o.status)).length;
    const completed = orders.filter(o => ['DELIVERED','COMPLETED'].includes(o.status)).length;
    const requests = orders.filter(o => o.return && o.return.status === 'REQUESTED').length;
    totalOrdersElem.textContent = orders.length;
    pendingOrdersElem.textContent = pending;
    completedOrdersElem.textContent = completed;
    returnRequestsElem.textContent = requests;
  }

  function render(){
    renderSummary();
    const orders = getFilteredOrders();
    if (!orders.length) { root.innerHTML = '<p class="small">Tidak ada order yang sesuai filter.</p>'; return; }

    const rows = orders.map(o => {
      const items = o.items.map(i => `${i.name} x${i.quantity}`).join('<br/>');
      const attachThumb = o.attachment ? `<img src="${o.attachment}" class="attachment" />` : '';
      const returnInfo = o.return ? `<div class="small">Retur: <strong>${o.return.status}</strong> • ${o.return.reason || ''}</div>` : '';
      const finalTotal = o.final_total !== undefined ? o.final_total : o.total;
      const discounts = o.discounts || 0;
      const vouchersApplied = o.applied_vouchers ? Object.values(o.applied_vouchers).filter(Boolean).join(', ') : '-';
      const coinsUsed = o.coins_used || 0;
      return `
        <div class="admin-order-card">
          <div class="admin-order-header">
            <div>
              <strong>${o.order_id}</strong>
              <div class="small">${new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div class="admin-status-group">
              <span class="admin-badge admin-badge-status">${o.status}</span>
              <span class="admin-badge admin-badge-payment">${o.payment_status}</span>
            </div>
          </div>
          <div class="admin-order-body">
            <div class="admin-order-meta">
              <div><strong>Pelanggan</strong><br/>${o.customer && o.customer.name ? o.customer.name : o.name || '-'}</div>
              <div><strong>Items</strong><br/>${items}</div>
              <div><strong>Total akhir</strong><br/>${formatCurrency(finalTotal)}</div>
            </div>
            <div class="admin-order-right">
              <div class="small">Voucher: ${vouchersApplied}</div>
              <div class="small">Koin digunakan: ${formatCurrency(coinsUsed)}</div>
              <div class="small">Diskon: ${formatCurrency(discounts)}</div>
            </div>
          </div>
          <div class="actions admin-action-row">
            <button data-action="release" data-id="${o.order_id}" class="btn">Release Escrow</button>
            <button data-action="ship" data-id="${o.order_id}" class="btn">Mark Shipped</button>
            <button data-action="deliver" data-id="${o.order_id}" class="btn">Mark Delivered</button>
            <button data-action="approve-return" data-id="${o.order_id}" class="btn">Approve Return</button>
            <button data-action="reject-return" data-id="${o.order_id}" class="btn">Reject Return</button>
            <button data-action="view-attach" data-id="${o.order_id}" class="btn">View Attachment</button>
            <button data-action="delete" data-id="${o.order_id}" class="btn btn-secondary">Delete</button>
          </div>
          ${returnInfo}
        </div>
      `;
    }).join('');

    root.innerHTML = rows;
    root.querySelectorAll('button[data-action]').forEach(b => b.addEventListener('click', onAction));
  }

  function onAction(e){
    const button = e.currentTarget;
    const action = button.dataset.action;
    const id = button.dataset.id;
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.order_id === id);
    if (idx < 0) return alert('Order tidak ditemukan');

    if (action === 'release'){
      orders[idx].payment_status = 'RELEASED';
      orders[idx].status = 'COMPLETED';
    }
    if (action === 'ship'){
      orders[idx].status = 'SHIPPED';
    }
    if (action === 'deliver'){
      orders[idx].status = 'DELIVERED';
      if (orders[idx].payment_method && orders[idx].payment_method !== 'cod') orders[idx].payment_status = 'RELEASED';
    }
    if (action === 'approve-return'){
      if (!orders[idx].return) return alert('Tidak ada pengajuan retur.');
      orders[idx].return.status = 'APPROVED';
      orders[idx].status = 'RETURN_APPROVED';
    }
    if (action === 'reject-return'){
      if (!orders[idx].return) return alert('Tidak ada pengajuan retur.');
      orders[idx].return.status = 'REJECTED';
    }
    if (action === 'view-attach'){
      const a = orders[idx].attachment || (orders[idx].return && orders[idx].return.attachment);
      if (!a) return alert('Tidak ada lampiran.');
      const w = window.open('about:blank');
      w.document.write(`<img src="${a}" style="max-width:100%">`);
    }
    if (action === 'delete'){
      if (!confirm('Hapus order ini?')) return;
      orders.splice(idx,1);
    }

    saveOrders(orders);
    render();
  }

  searchInput.addEventListener('input', render);
  statusFilter.addEventListener('change', render);

  render();
})();

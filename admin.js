// Minimal Admin dashboard to manage orders stored in localStorage (njiOrders)
(function(){
  const root = document.getElementById('orders-root');

  function formatCurrency(v){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(v); }

  function loadOrders(){ return JSON.parse(localStorage.getItem('njiOrders') || '[]'); }
  function saveOrders(o){ localStorage.setItem('njiOrders', JSON.stringify(o)); }

  function render(){
    const orders = loadOrders();
    if (!orders.length) { root.innerHTML = '<p class="small">Tidak ada order.</p>'; return; }

    const rows = orders.map(o => {
      const items = o.items.map(i => `${i.name} x${i.quantity}`).join('<br/>');
      const attachThumb = o.attachment ? `<img src="${o.attachment}" class="attachment" />` : '';
      const returnInfo = o.return ? `<div class="small">Retur: ${o.return.status} • ${o.return.reason || ''}</div>` : '';
      const finalTotal = o.final_total !== undefined ? o.final_total : o.total;
      const discounts = o.discounts || 0;
      const vouchersApplied = o.applied_vouchers ? Object.values(o.applied_vouchers).filter(Boolean).join(', ') : '-';
      const coinsUsed = o.coins_used || 0;
      return `
        <div style="border:1px solid #eee;padding:.8rem;margin-bottom:.6rem;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <strong>${o.order_id}</strong>
              <div class="small">${new Date(o.created_at).toLocaleString()}</div>
              <div style="margin-top:.5rem">${items}</div>
            </div>
            <div style="text-align:right">
              <div>Status: <strong>${o.status}</strong></div>
              <div>Pembayaran: <strong>${o.payment_status}</strong></div>
              <div style="margin-top:.5rem">Total awal: <strong>${formatCurrency(o.total)}</strong></div>
              <div class="small">Voucher: ${vouchersApplied} • Koin: ${formatCurrency(coinsUsed)}</div>
              <div>Diskon: <strong>${formatCurrency(discounts)}</strong> • Total akhir: <strong>${formatCurrency(finalTotal)}</strong></div>
            </div>
          </div>
          <div style="display:flex;gap:.6rem;margin-top:.6rem;align-items:center">
            ${attachThumb}
            <div class="actions">
              <button data-action="release" data-id="${o.order_id}" class="btn">Release Escrow</button>
              <button data-action="ship" data-id="${o.order_id}" class="btn">Mark Shipped</button>
              <button data-action="deliver" data-id="${o.order_id}" class="btn">Mark Delivered</button>
              <button data-action="approve-return" data-id="${o.order_id}" class="btn">Approve Return</button>
              <button data-action="reject-return" data-id="${o.order_id}" class="btn">Reject Return</button>
              <button data-action="view-attach" data-id="${o.order_id}" class="btn">View Attachment</button>
              <button data-action="delete" data-id="${o.order_id}" class="btn btn-secondary">Delete</button>
            </div>
          </div>
          ${returnInfo}
        </div>
      `;
    }).join('');

    root.innerHTML = rows;
    // attach handlers
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

  render();
})();

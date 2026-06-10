// Payment Simulator script
(async function(){
  function qs(param){
    return new URLSearchParams(window.location.search).get(param);
  }

  const orderId = qs('order_id');
  const method = qs('method');
  const titleEl = document.getElementById('pay-title');
  const descEl = document.getElementById('pay-desc');
  const infoEl = document.getElementById('order-info');
  const paymentFieldsEl = document.getElementById('payment-fields');
  const payBtn = document.getElementById('pay-now');
  const cancelBtn = document.getElementById('cancel');

  function renderPaymentFields(order) {
    if (!paymentFieldsEl) return;
    const details = order.payment_details || {};
    let html = '';
    if (method === 'dana') {
      html = `
        <div class="payment-field">
          <label for="dana-phone">Nomor DANA</label>
          <input id="dana-phone" type="tel" placeholder="08xxxxxxxxxx" value="${details.dana_phone || ''}" />
        </div>
        <div class="payment-field">
          <label for="dana-pin">PIN DANA (simulasi)</label>
          <input id="dana-pin" type="password" placeholder="****" value="${details.dana_pin || ''}" />
        </div>
      `;
    } else if (method === 'debit') {
      html = `
        <div class="payment-field">
          <label for="card-number">Nomor Kartu Debit</label>
          <input id="card-number" type="text" placeholder="1234 5678 9012 3456" value="${details.card_number || ''}" />
        </div>
        <div class="payment-field">
          <label for="card-holder">Nama Pemegang Kartu</label>
          <input id="card-holder" type="text" placeholder="Nama Sesuai Kartu" value="${details.card_holder || ''}" />
        </div>
        <div class="payment-field" style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;">
          <div>
            <label for="card-expiry">Masa Berlaku</label>
            <input id="card-expiry" type="text" placeholder="MM/YY" value="${details.card_expiry || ''}" />
          </div>
          <div>
            <label for="card-cvv">CVV</label>
            <input id="card-cvv" type="text" placeholder="123" value="${details.card_cvv || ''}" />
          </div>
        </div>
      `;
    } else if (method === 'ovo') {
      html = `
        <div class="payment-field">
          <label for="ovo-phone">Nomor OVO</label>
          <input id="ovo-phone" type="tel" placeholder="08xxxxxxxxxx" value="${details.ovo_phone || ''}" />
        </div>
      `;
    } else if (method === 'va') {
      html = `
        <div class="payment-field">
          <label for="bank-name">Bank</label>
          <input id="bank-name" type="text" placeholder="BCA / BNI / Mandiri" value="${details.bank_name || ''}" />
        </div>
        <div class="payment-field">
          <label for="va-number">Nomor Virtual Account</label>
          <input id="va-number" type="text" placeholder="1234567890" value="${details.va_number || ''}" />
        </div>
      `;
    }
    paymentFieldsEl.innerHTML = html;
  }

  function validatePaymentFields() {
    if (method === 'dana') {
      const phone = document.getElementById('dana-phone');
      const pin = document.getElementById('dana-pin');
      return phone && pin && phone.value.trim() && pin.value.trim();
    }
    if (method === 'debit') {
      const card = document.getElementById('card-number');
      const holder = document.getElementById('card-holder');
      const expiry = document.getElementById('card-expiry');
      const cvv = document.getElementById('card-cvv');
      return card && holder && expiry && cvv && card.value.trim() && holder.value.trim() && expiry.value.trim() && cvv.value.trim();
    }
    if (method === 'ovo') {
      const phone = document.getElementById('ovo-phone');
      return phone && phone.value.trim();
    }
    if (method === 'va') {
      const bank = document.getElementById('bank-name');
      const va = document.getElementById('va-number');
      return bank && va && bank.value.trim() && va.value.trim();
    }
    return true;
  }

  function collectPaymentFields() {
    if (method === 'dana') {
      return {
        dana_phone: document.getElementById('dana-phone')?.value.trim() || '',
        dana_pin: document.getElementById('dana-pin')?.value.trim() || ''
      };
    }
    if (method === 'debit') {
      return {
        card_number: document.getElementById('card-number')?.value.trim() || '',
        card_holder: document.getElementById('card-holder')?.value.trim() || '',
        card_expiry: document.getElementById('card-expiry')?.value.trim() || '',
        card_cvv: document.getElementById('card-cvv')?.value.trim() || ''
      };
    }
    if (method === 'ovo') {
      return { ovo_phone: document.getElementById('ovo-phone')?.value.trim() || '' };
    }
    if (method === 'va') {
      return {
        bank_name: document.getElementById('bank-name')?.value.trim() || '',
        va_number: document.getElementById('va-number')?.value.trim() || ''
      };
    }
    return {};
  }

  if (!orderId) {
    titleEl.textContent = 'Order tidak ditemukan';
    descEl.textContent = 'Parameter order_id tidak disediakan.';
    payBtn.disabled = true;
    throw new Error('order_id missing');
  }

  let order = null;
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    if (response.ok) {
      order = await response.json();
    }
  } catch (err) {
    console.error('Fetch order failed', err);
  }

  if (!order) {
    titleEl.textContent = 'Order tidak ditemukan';
    descEl.textContent = `Order ${orderId} tidak ada di storage backend.`;
    payBtn.disabled = true;
  } else {
    titleEl.textContent = `Pembayaran ${method.toUpperCase()}`;
    descEl.textContent = `Order: ${orderId} • Total: ${new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR'}).format(order.total)}`;
    infoEl.innerHTML = `<strong>Nama:</strong> ${order.customer.name} <br/><strong>Metode:</strong> ${method}`;
    if (method === 'va') {
      const va = order.payment_details?.va_number || order.payment_url || `VA${Math.floor(Math.random()*900000)+100000}`;
      infoEl.innerHTML += `<br/><strong>Virtual Account:</strong> ${va}`;
    }
    renderPaymentFields(order);
  }

  payBtn.addEventListener('click', async () => {
    if (!validatePaymentFields()) {
      alert('Silakan isi semua data pembayaran yang diperlukan sebelum melanjutkan.');
      payBtn.disabled = false;
      payBtn.textContent = 'Bayar Sekarang';
      return;
    }
    const newDetails = collectPaymentFields();
    payBtn.disabled = true;
    payBtn.textContent = 'Memproses...';

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_details: newDetails })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran');
      }
      window.location.href = `index.html?paid_order=${encodeURIComponent(orderId)}`;
    } catch (err) {
      alert(err.message);
      console.error(err);
      payBtn.disabled = false;
      payBtn.textContent = 'Bayar Sekarang';
    }
  });

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
})();

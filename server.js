const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;
const ORDERS_FILE = path.join(process.cwd(), 'backend-orders.json');

const vouchers = [
  { id: 'TOKO50', type: 'store', value: 50000 },
  { id: 'TOKO20', type: 'store', value: 20000 },
  { id: 'PLAT10', type: 'platform_percent', percent: 10, cap: 50000 },
  { id: 'PLAT50', type: 'platform_value', value: 50000 },
  { id: 'FREE50', type: 'shipping', value: 50000 }
];

function readOrders() {
  try {
    const content = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generateOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function calculateFinalTotal(order, useCoins = 0, storeVoucherId = '', platformVoucherId = '', shippingVoucherId = '') {
  const subtotal = order.items.reduce((s, item) => s + item.price * item.quantity, 0);
  let shipping = 20000;
  let discounts = 0;

  if (storeVoucherId) {
    const v = vouchers.find(x => x.id === storeVoucherId && x.type === 'store');
    if (v) discounts += v.value;
  }

  if (platformVoucherId) {
    const v = vouchers.find(x => x.id === platformVoucherId && (x.type === 'platform_percent' || x.type === 'platform_value'));
    if (v) {
      if (v.type === 'platform_value') discounts += v.value;
      if (v.type === 'platform_percent') {
        const val = Math.floor(subtotal * (v.percent / 100));
        discounts += Math.min(val, v.cap || val);
      }
    }
  }

  if (shippingVoucherId) {
    const v = vouchers.find(x => x.id === shippingVoucherId && x.type === 'shipping');
    if (v) {
      discounts += Math.min(shipping, v.value);
      shipping = Math.max(0, shipping - v.value);
    }
  }

  const coinsAvailable = 0;
  const maxCoinsUsable = Math.min(coinsAvailable, subtotal + shipping - discounts);
  const coinsUsed = Math.max(0, Math.min(useCoins || 0, maxCoinsUsable));
  const finalTotal = Math.max(0, subtotal + shipping - discounts - coinsUsed);

  return { subtotal, shipping, discounts, coinsUsed, finalTotal };
}

async function callSandboxGateway(payload) {
  const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || `http://localhost:${PORT}/sandbox/payments`;
  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.PAYMENT_GATEWAY_API_KEY || 'sandbox-key'
    },
    body: JSON.stringify(payload)
  });
  return response.json();
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), '')));

app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

app.get('/api/orders/:orderId', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
  res.json(order);
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { customer, items, payment_method, payment_details, vouchers: voucherSelection = {}, use_coins = 0, attachment } = req.body;
    if (!customer || !items || !payment_method) {
      return res.status(400).json({ error: 'Payload checkout tidak lengkap' });
    }

    const order = {
      order_id: generateOrderId(),
      customer,
      items,
      payment_method,
      payment_details: payment_details || {},
      attachment: attachment || null,
      applied_vouchers: {
        store: voucherSelection.store || '',
        platform: voucherSelection.platform || '',
        shipping: voucherSelection.shipping || ''
      },
      coins_used: Math.max(0, parseInt(use_coins, 10) || 0),
      created_at: new Date().toISOString(),
      reward: 0,
      gateway_response: null
    };

    const totals = calculateFinalTotal(order, order.coins_used, order.applied_vouchers.store, order.applied_vouchers.platform, order.applied_vouchers.shipping);
    order.total = totals.subtotal;
    order.shipping_cost = totals.shipping;
    order.discounts = totals.discounts;
    order.final_total = totals.finalTotal;

    if (payment_method === 'cod') {
      order.payment_status = 'PENDING_COD';
      order.status = 'AWAITING_COD_COLLECTION';
      order.message = 'Pesanan COD diterima. Bayar saat barang diterima.';
    } else {
      order.payment_status = 'AWAITING_PAYMENT';
      order.status = 'AWAITING_PAYMENT';
      const gatewayPayload = {
        order_id: order.order_id,
        amount: order.final_total,
        currency: 'IDR',
        payment_method,
        payment_details: order.payment_details,
        callback_url: `${req.protocol}://${req.get('host')}/api/orders/${order.order_id}/pay`
      };
      const gatewayResult = await callSandboxGateway(gatewayPayload);
      order.gateway_response = gatewayResult;
      order.payment_url = gatewayResult.payment_url || null;
      order.gateway_status = gatewayResult.status || 'pending';
      order.message = gatewayResult.message || 'Pembayaran sandbox dibuat.';
    }

    const orders = readOrders();
    orders.unshift(order);
    writeOrders(orders);

    return res.json({ order, payment_url: order.payment_url || null });
  } catch (err) {
    console.error('Checkout error', err);
    return res.status(500).json({ error: 'Gagal memproses checkout' });
  }
});

app.post('/api/orders/:orderId/pay', async (req, res) => {
  try {
    const orders = readOrders();
    const order = orders.find(o => o.order_id === req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    if (order.payment_status === 'COMPLETED') {
      return res.json({ order, message: 'Pembayaran sudah selesai.' });
    }

    const incomingPaymentDetails = req.body.payment_details || {};
    order.payment_details = { ...order.payment_details, ...incomingPaymentDetails };
    order.payment_status = 'COMPLETED';
    order.status = 'PROCESSING';
    const reward = Math.max(0, Math.floor(order.final_total * 0.01));
    order.reward = reward;
    order.gateway_response = order.gateway_response || {};
    order.gateway_response.settled_at = new Date().toISOString();
    writeOrders(orders);

    return res.json({ order, message: 'Pembayaran berhasil diproses.' });
  } catch (err) {
    console.error('Payment callback error', err);
    return res.status(500).json({ error: 'Gagal memproses pembayaran' });
  }
});

app.post('/sandbox/payments', (req, res) => {
  const { order_id, amount, currency, payment_method } = req.body;
  return res.json({
    status: 'ready',
    payment_id: `PAY-${Date.now()}`,
    payment_url: `http://localhost:${PORT}/payment.html?order_id=${encodeURIComponent(order_id)}&method=${encodeURIComponent(payment_method)}`,
    amount,
    currency,
    message: 'Sandbox payment created. Silakan lanjutkan ke halaman pembayaran.'
  });
});

app.listen(PORT, () => {
  console.log(`NusantaraMall backend berjalan di http://localhost:${PORT}`);
  console.log('API checkout: POST /api/checkout');
  console.log('Sandbox gateway: POST /sandbox/payments');
});

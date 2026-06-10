# NJIechi
Website toko baju demo dengan desain modern dan keranjang belanja.

## Cara menjalankan
1. Buka file `index.html` langsung di browser.
2. Atau jalankan server lokal dari root workspace:
   - `python3 -m http.server 8000`
   - buka `http://localhost:8000`
3. Jika menggunakan Node.js, jalankan:
   - `npm install`
   - `npm start`

### Backend API
Untuk menjalankan backend checkout dan sandbox payment gateway lokal:

- `npm run server`
- buka `http://localhost:8000`

Backend menyediakan endpoint berikut:

- `POST /api/checkout` — buat order dan panggil sandbox payment gateway
- `GET /api/orders/:orderId` — ambil data order
- `POST /api/orders/:orderId/pay` — selesaikan pembayaran order
- `POST /sandbox/payments` — contoh sandbox gateway internal

## Fitur yang tersedia
- Tampilan homepage modern dengan hero section dan fitur marketplace.
- Filter kategori produk dan pencarian cepat.
- Keranjang belanja dengan jumlah item dan total harga.
- Persistensi keranjang di `localStorage` sehingga data tetap tersimpan.
- Checkout sederhana dengan konfirmasi modal.
- Panel informasi baru di bagian bawah dengan tautan ke halaman `info.html`.

## File penting
- `index.html` — halaman web utama.
- `styles.css` — gaya tampilan responsif.
- `app.js` — logika produk, filter, keranjang, dan checkout.
- `NusantaraMall_Technical_Specification.md` — dokumen spesifikasi teknis platform.


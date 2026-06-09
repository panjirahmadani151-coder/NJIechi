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


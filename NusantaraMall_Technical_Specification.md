# NusantaraMall Technical Specification Document

## Ringkasan

NusantaraMall adalah platform hyper-scale e-commerce Indonesia yang mendukung 50+ juta active users, 5+ juta transaksi per hari, dan beban flash sale ekstrem. Dokumen ini menyajikan arsitektur enterprise multi-tenant marketplace, O2O, promosi agresif, live commerce, serta logistik dan pembayaran lokal.

---

## 1. MICROSERVICES ARCHITECTURE & DISTRIBUTED SYSTEMS

### 1.1 Pendekatan Microservices
Platform dibangun sebagai kumpulan layanan independen dengan tanggung jawab terpisah dan komunikasi melalui REST/gRPC dan event-driven Kafka. Setiap layanan memiliki bounded context, database sendiri, dan deployment pipeline tersendiri.

### 1.2 Daftar Layanan Utama

1. Auth & Identity Service
2. Product Catalog & Search Service
3. Inventory & Warehouse Management Service
4. Cart & Checkout Service
5. Order Management Service (OMS)
6. Payment & Ledger Service
7. Promo, Voucher, & Flash Sale Engine
8. Logistics & Shipping Service
9. Notification Service
10. User & Merchant Management Service
11. Live Streaming & Video Shopping Service
12. Gamification Service
13. Customer Service & Ticketing Service
14. Recommendation & Personalization Engine
15. Fraud Detection Service
16. Event Bus / Kafka Cluster (supporting event-driven integration)
17. Audit & Compliance Service
18. Business Intelligence Service
19. Batch ETL Service
20. API Gateway / Edge Proxy

> Minimal 15 service disetujui dengan tambahan layanan infrastruktur terpisah.

### 1.3 Detil Layanan dan Tanggung Jawab

#### Auth & Identity Service
- Tanggung jawab:
  - OIDC/OAuth2 authorization server
  - JWT issuance and validation
  - Session management untuk user dan merchant
  - MFA, password reset, social login, SSO marketplace partner
- Teknologi:
  - Keycloak / ORY Hydra + PostgreSQL
  - Redis untuk session dan token blacklist
  - OpenID Connect, OAuth2 Authorization Code + PKCE
  - JWT signed with RSA-256, refresh token rotation
- Pola komunikasi:
  - REST untuk login/registration/KYC flows
  - gRPC internal untuk validasi token dari service lain
  - Kafka events: `identity.user.created`, `identity.user.updated`, `identity.merchant.kyc_status_changed`

#### Product Catalog & Search Service
- Tanggung jawab:
  - Menyimpan dan mengelola jutaan SKU multi-tenant
  - Mendukung atribut dinamis per kategori (size, warna, bahan, dimensi)
  - Menyediakan indexing dan search untuk marketplace + O2O store
  - Menyimpan metadata produk, variant, taxonomy, harga global dan local
- Teknologi:
  - Elasticsearch/OpenSearch cluster untuk search dan faceted filtering
  - MongoDB / PostgreSQL JSONB untuk master catalog storage
  - Kafka events: `catalog.product.created`, `catalog.product.updated`, `catalog.product.deleted`
- Pola komunikasi:
  - REST API publik/internal untuk catalog CRUD
  - Event-driven update ke Search Service via Kafka
  - gRPC internal untuk Inventory Service load product metadata

#### Inventory & Warehouse Management Service
- Tanggung jawab:
  - Stok multi-gudang, multi-merchant, FC (fulfillment center), FBM
  - Distributed stock snapshot dan real-time stock reservation
  - Stok transaksional di flash sale dan preload untuk elastic availability
  - Fulfillment rule engine: FBL, FBM, O2O store pick-up
- Teknologi:
  - PostgreSQL + TimescaleDB / Cassandra untuk stock ledger
  - Redis Cluster untuk stock cache read-heavy
  - Kafka untuk event stock movement dan reservation
- Pola komunikasi:
  - REST internal untuk stock inquiry dan allocation
  - gRPC untuk latency-sensitive stock reservation
  - Event-driven: `inventory.stock.reserved`, `inventory.stock.released`, `inventory.stock.updated`

#### Cart & Checkout Service
- Tanggung jawab:
  - Keranjang multi-merchant, multi-wishlist, multi-device
  - Distributed locking untuk mencegah overselling
  - Checkout orchestration cross-seller
  - Precalculation biaya ongkir, voucher, promo, total harga
- Teknologi:
  - Redis Hash / RedisJSON untuk cart state
  - Redisson / Redis distributed locks untuk isolation
  - Kafka: `checkout.cart.checked_out`, `checkout.payment.requested`
- Pola komunikasi:
  - REST API untuk add/remove/update cart item
  - gRPC ke Product/Inventory/Promo untuk validasi real-time
  - Event-driven asynchronous order creation

#### Order Management Service (OMS)
- Tanggung jawab:
  - Mengelola state machine order lifecycle: `UNPAID`, `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `RETURN_REQUESTED`, `REFUNDED`, `COMPLETED`
  - Menangani split order multi-merchant dan multi-shipment
  - Orkestrasi fulfillment, invoice, resi, dan return flow
- Teknologi:
  - PostgreSQL / MySQL untuk transactional order state
  - Temporal / Camunda untuk workflow state machine
  - Kafka: `order.created`, `order.paid`, `order.shipped`, `order.refund.initiated`
- Pola komunikasi:
  - REST/gRPC untuk status order dan order validation
  - Event-driven worker orchestration ke Notification, Logistics, Payment

#### Payment & Ledger Service
- Tanggung jawab:
  - Integrasi payment gateway lokal, VA generation, e-wallet, kartu kredit, PayLater
  - Escrow account management dan settlement
  - General ledger untuk komisi platform, merchant payout, fee, cashback, refund
- Teknologi:
  - PostgreSQL + Ledger schemas
  - Kafka events: `payment.initiated`, `payment.completed`, `payment.failed`, `ledger.entry.posted`
  - Xendit/Midtrans/DOKU SDK serta custom adapter
- Pola komunikasi:
  - REST/gRPC untuk payment request dan reconciliation
  - Event-driven settlement dan punjukan invoice

#### Promo, Voucher, & Flash Sale Engine
- Tanggung jawab:
  - Validasi high-throughput voucher, promo stack, cashback, gratis ongkir
  - Rule engine for promotion combinatorics
  - Diskon real-time pada checkout dan flash sale bursts
- Teknologi:
  - Redis + Hazelcast untuk promo state cache dan rate-limit
  - Drools / custom rule engine + Kubernetes horizontal scaling
  - Kafka: `promo.voucher.redeemed`, `promo.flashsale.started`
- Pola komunikasi:
  - REST API untuk promo validation
  - gRPC ke Checkout/Order untuk cross-service promo computation
  - Event streams untuk promo state sync and inventory reservations

#### Logistics & Shipping Service
- Tanggung jawab:
  - Multi-courier aggregator, pickup scheduling, route optimization
  - Reconciliation resi, real-time shipment tracking, multi-warehouse order split
  - Volume matrix calculation and dynamic shipping fee
- Teknologi:
  - Graph database / routing engine untuk optimisasi jalur
  - Redis + Elasticsearch untuk cached rate matrix
  - Kafka: `shipping.label.created`, `shipping.status.updated`
- Pola komunikasi:
  - REST API untuk rate quote, create shipment, tracking
  - Event-driven update status ke Order dan Notification

#### Notification Service
- Tanggung jawab:
  - Multi-channel notifications via WhatsApp API, Firebase Push, Email, SMS
  - Marketing campaign blasts dan transactional alerts
  - Template management dan personalization
- Teknologi:
  - External integration: WhatsApp Business API, Firebase Cloud Messaging, SES, SMTP gateway
  - Kafka: `notification.email.send`, `notification.sms.send`, `notification.push.send`
- Pola komunikasi:
  - Event-driven architecture for all notification triggers
  - REST API for manual campaigns and templates

#### User & Merchant Management Service
- Tanggung jawab:
  - Profile, address, rating/review, accreditation, KYC, seller badge tiering
  - Merchant onboarding, store verification, policy compliance
  - Multi-tenant access control dan role management
- Teknologi:
  - PostgreSQL for profile and KYC entities
  - Kafka: `merchant.kyc.approved`, `merchant.store.updated`
- Pola komunikasi:
  - REST API untuk profile updates
  - Event-driven sync to Search and Recommendation

#### Live Streaming & Video Shopping Service
- Tanggung jawab:
  - Live video encoding, ingest, transcoding, HLS/RTMP/WebRTC
  - Pin product, shoppable overlays, real-time chat
  - Viewership metrics and flash sale concurrency
- Teknologi:
  - Media Server: NGINX RTMP / Janus / Wowza / AWS IVS
  - Redis Pub/Sub untuk chat and room state
  - Kafka for event aggregation: `live.event.started`, `live.product.pinned`
- Pola komunikasi:
  - REST APIs untuk event schedule and product linking
  - WebSocket / gRPC for real-time chat and viewer sync

#### Gamification Service
- Tanggung jawab:
  - Daily check-in, loyalty coins, rewards, wheel spin, quiz and game mechanics
  - Gamification wallet, expiration, and redemption rules
- Teknologi:
  - PostgreSQL + Redis for point balances and fast reads
  - Kafka: `gamification.coin.earned`, `gamification.coin.redeemed`
- Pola komunikasi:
  - REST APIs for user actions and status
  - Event-driven integration ke Promo dan Checkout

#### Customer Service & Ticketing Service
- Tanggung jawab:
  - Complaint case management, return requests, arbitration, live chat buyer-seller
  - SLA tracking dan resolution workflow
- Teknologi:
  - PostgreSQL + Elasticsearch untuk full-text ticket search
  - Kafka: `support.ticket.created`, `support.ticket.updated`
- Pola komunikasi:
  - REST API untuk customer service interface
  - Event-driven notifications ke agents and users

#### Recommendation & Personalization Engine
- Tanggung jawab:
  - AI/ML-driven product feeds, personalized homepage, propensity scoring
  - Collaborative filtering, content-based recommendation, session-based model
- Teknologi:
  - Spark / Ray / MLFlow for model training
  - Redis / Elasticsearch for feature store and low-latency retrieval
  - Kafka: `user.activity.viewed`, `user.activity.purchased`
- Pola komunikasi:
  - Event-driven feature ingest to model training
  - gRPC for realtime scoring in frontend services

#### Fraud Detection Service
- Tanggung jawab:
  - Deteksi akun bot, fake order, voucher abuse, payment anomaly
  - Device fingerprinting, velocity checks, abnormal purchase patterns
- Teknologi:
  - Python service with rules engine + ML anomaly detection
  - Redis for rate-limit and session fraud cache
  - Kafka: `fraud.alert.generated`, `fraud.transaction.reviewed`
- Pola komunikasi:
  - REST/gRPC for fraud check during checkout
  - Event-driven alerts to Operations and Order Management

### 1.4 Layanan Infrastruktural Pendukung
- Event Broker: Kafka cluster untuk message-driven integration.
- API Gateway / Edge Proxy: Envoy / Kong / NGINX untuk auth, routing, rate limit.
- Service Mesh: Istio / Linkerd untuk TLS internal, routing, observability.
- CI/CD Service: GitHub Actions / GitLab CI dan ArgoCD.
- Observability: Prometheus, Grafana, Jaeger, ELK / Loki.

### 1.5 Pola Komunikasi Antar-Layanan
- Synchronous: REST/gRPC untuk request-response dengan SLA rendah.
- Asynchronous: Kafka topics untuk event propagation dan decoupled workflows.
- Direct streaming: WebSocket / WebRTC untuk low-latency live commerce.

### 1.6 Event Schema and Topic Design
- Top-level event topics:
  - `identity.user.*`
  - `catalog.product.*`
  - `inventory.stock.*`
  - `checkout.*`
  - `order.*`
  - `payment.*`
  - `promo.*`
  - `shipping.*`
  - `notification.*`
  - `fraud.*`
  - `live.*`
  - `gamification.*`
- Event payload contract:
  - `event_id`: UUID
  - `source`: service name
  - `timestamp`: ISO8601
  - `correlation_id`: UUID
  - `payload`: service-specific JSON
- Idempotency:
  - consumer uses `event_id` dedupe cache in Redis for 24h.
  - payload versioning using `schema_version`.
- Compacted topics for reference state:
  - `catalog.product.latest`
  - `inventory.stock.snapshot`
  - `merchant.profile.latest`
- Partition strategy:
  - `order.*` partition by `order_id`
  - `inventory.stock.*` partition by `product_id`
  - `promo.*` partition by `voucher_id`
  - `shipping.*` partition by `tracking_number`

### 1.7 Deployment, Resilience, dan Scalability Patterns
- Health endpoints: `Liveness` dan `Readiness` untuk Kubernetes probe.
- Blue/Green dan Canary deployment melalui service mesh route weight control.
- Sidecar pattern untuk tracers, metrics, dan security policy enforcement.
- Circuit breaker pada gRPC dan REST client libraries untuk dependensi kritis.
- Graceful shutdown dan connection draining untuk `Order Management` dan `Payment`.
- Autoscaling policies:
  - `Cart`, `Checkout`, `Promo Engine`: HPA based on QPS and Redis latency.
  - `Inventory`, `Order`, `Payment`: CPU + queue-backed custom metric.
  - `Live Streaming`: concurrent viewer count and ingest throughput.

```
      +------------------+       +---------------------+
      |  API Gateway     |<----->| Auth & Identity Svc |
      +------------------+       +---------------------+
              |                          |
  +-----------+-----------+              |
  |   REST / gRPC         |              v
  |                       Kafka Events   +---------------------------+
  v                                    | Product Catalog & Search   |
+----------------+     +-------------+  +---------------------------+
| Cart Service   |<--->| Inventory    |           |
+----------------+     +-------------+           v
      |                         |        +-----------------------+
      v                         +------->| Order Management Svc  |
+----------------+                    +-----------------------+
      |      ^                                |       |
      |      |                                v       v
      |  +--------+                    +-----------+ +--------------+
      +->| Promo  |<------------------>| Payment   | | Logistics    |
         +--------+                    +-----------+ +--------------+
```

---

## 2. STRATEGI HIGH-CONCURRENCY & FLASH SALE HANDLING

### 2.1 Caching Strategy

#### Redis Cluster Architecture
- Redis Cluster disusun dalam 9 node: 3 master + 6 replica.
- Data sharding key berdasarkan `product_id` atau `merchant_id` menggunakan Redis Cluster hash slots.
- Master untuk write, replica untuk read-heavy requests.
- Redis Sentinel / Kubernetes operator untuk failover.

#### Redis digunakan untuk:
- Inventory snapshot: `stock:<product_id>:<warehouse_id>`
- Flash sale token bucket / stock inventory cache
- Promo qualification cache
- Session caching dan device fingerprint repository

#### Penanganan cache failure:
- Cache Avalanche:
  - Expiry staggering: TTL randomization 5-15%.
  - Warm-up cache load dari background loader.
  - Multi-layer caching: Redis + local in-process Caffeine.
- Cache Penetration:
  - Bloom Filter untuk memblok permintaan terhadap `product_id` invalid.
  - Negative cache entries dengan TTL pendek.
- Cache Stampede:
  - Locking stampede prevention menggunakan Redis lock / token bucket.
  - Request coalescing: hanya satu worker refill cache dari DB.
  - Early recomputation if TTL < threshold.

#### Stock read flow during flash sale:
1. Checkout service memanggil Redis stock read.
2. Jika cache hit, baca `stock.available` dan tentukan `reserve_token`.
3. Jika cache miss, fallback ke background loader dan gunakan stock safe guard.
4. Writes ke DB asynchronous: `inventory.stock.updated` event.

### 2.2 Concurrency Control

#### Distributed Locking
- Use Redisson distributed lock untuk critical section stock reservation dan cart checkout.
- Lock key: `lock:stock:<product_id>:<warehouse_id>`.
- TTL lock minimal 3s + auto-refresh.
- Lock granularity per SKU/warehouse, bukan per order.
- Untuk multi-SKU checkout, gunakan locking ordered by `product_id` to avoid deadlock.

#### Optimistic Locking
- Use optimistic locking on DB rows for inventory and order updates.
- PostgreSQL `version` column / `updated_at` and `WHERE version = ?`
- Flow:
  - Reserve stock in Redis first.
  - Persist final commit to DB with `UPDATE ... WHERE version = old_version`.
  - On conflict retry limited times.
- Digunakan di level `inventory_stock` dan `order_status` update.

### 2.3 Message Queue & Asynchronous Processing

#### Kafka Queue untuk checkout
- Topic: `checkout.orders`, `payment.requests`, `inventory.reservations`
- Partitioned berdasarkan `user_id`/`order_id` untuk ordering.
- In-flight order creation:
  1. Checkout service publishes `order.pending`
  2. OMS consumes event, creates order record, triggers payment request
  3. Payment service processes asynchronously, returns `payment.completed`

#### Throttling / Rate Limiting
- Kafka consumer groups dengan bounded concurrency.
- Consumer side rate limiter: `max.poll.records`, `pause()`/`resume()`.
- Backpressure: jika service load tinggi, producer menulis ke dead-letter or delayed topics.
- Separate flash sale queue `flashsale.orders` untuk high-priority burst.

### 2.4 Circuit Breaker & Rate Limiter

#### Envoy / Gateway
- Gateway policy: per-route rate limit + per-client quotas.
- Circuit breaker pada upstream cluster: `max_connections`, `max_pending_requests`, `max_requests`.
- Retry policy with exponential backoff untuk transient errors.

#### Resilience4j / Hystrix-like
- Each microservice uses circuit breakers at client side for external calls.
- Patterns: sliding window error rate, failure threshold, open/half-open/closed.
- Fallbacks to degraded behavior (cached product details, read-only mode) jika dependency down.

#### API Throttling
- Global rate limits for flash sale endpoints: e.g., 50 req/sec per IP/device.
- User-based rate limit for checkout/ voucher validation.
- Token bucket / leaky bucket implemented by API Gateway and Redis.

### 2.5 Flash Sale Admission and Queueing
- Admission queue: user entry requests queued before hitting checkout service.
- Queue tokens in Redis allow `n` concurrent checkout entry attempts per event window.
- Two-phase order creation:
  1. `flashsale.order.reserve` reserve token + reduced stock.
  2. `flashsale.order.commit` final payment and order persistence.
- Backstop queue drain: if checkout service saturates, token bucket continues to throttle and adds requests to delayed topic.
- Grace period for payment follow-up: if payment not completed in `x` minutes, stock release event is published.
- Bulk token minting and token redemption in Redis with Lua scripts for atomicity.

| Layer | Mechanism | Purpose |
|---|---|---|
| Edge | IP/device rate limit | Protect gateway and origin services |
| Cache | Redis stock snapshot | Avoid DB queries for inventory reads |
| Queue | Kafka flashsale.orders | Smooth order creation bursts |
| App | distributed locks | Prevent oversell during reservation |
| Failover | delayed retry topics | Handle temporary overload |

---

## 3. DATA ARCHITECTURE, POLYGLOT PERSISTENCE, & SKEMA DATABASE

### 3.1 Polyglot Persistence Rationale

1. SQL untuk konsistensi transaksi, relasi order, pembayaran, reconciliation.
2. NoSQL untuk katalog produk dinamis dan atribut variatif.
3. Redis untuk session, cart, leaderboard, stock cache.
4. Search engine untuk full-text search dan faceted navigation.
5. Time-series untuk telemetri, lead-time, price history.

### 3.2 Skema Modul Katalog Produk

#### Pilihan Database
- MongoDB / PostgreSQL JSONB.
- Gunakan MongoDB untuk schema-less attributes dan category-specific metadata.
- Alternatif: PostgreSQL with JSONB dan generated columns.

#### Skema MongoDB (Contoh)
- Koleksi: `products`
- Indeks: `sku`, `merchant_id`, `category_id`, `attributes.brand`, `attributes.size`, `attributes.color`, `visibility`

```
{
  _id: ObjectId,
  sku: String,
  merchant_id: UUID,
  category_id: UUID,
  name: String,
  description: String,
  price_base: Decimal128,
  brand: String,
  variants: [
    {
      variant_id: UUID,
      sku: String,
      attributes: {
        size: String,
        color: String,
        material: String,
        dimension: { length: Number, width: Number, height: Number },
        weight: Number
      },
      price: Decimal128,
      stock_status: String,
      images: [String]
    }
  ],
  attributes: {
    size: [String],
    color: [String],
    material: [String],
    fit: [String],
    pattern: [String]
  },
  taxonomy: {
    category_path: [String],
    tags: [String]
  },
  created_at: ISODate,
  updated_at: ISODate
}
```

#### Skema PostgreSQL JSONB (Contoh)
- Tabel: `product_catalog`
- Primary Key: `product_id`
- Indeks: `CREATE INDEX idx_catalog_category ON product_catalog USING GIN (category_attributes);`

```
CREATE TABLE product_catalog (
  product_id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  category_id UUID NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  price_base NUMERIC(18,2) NOT NULL,
  category_attributes JSONB,
  variants JSONB,
  taxonomy JSONB,
  availability_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_catalog_merchant ON product_catalog (merchant_id);
CREATE INDEX idx_product_catalog_brand ON product_catalog (brand);
CREATE INDEX idx_product_catalog_jsonb ON product_catalog USING GIN (category_attributes);
CREATE INDEX idx_product_catalog_variants ON product_catalog USING GIN (variants);
```

### 3.3 Skema Modul Transaksi Multi-Merchant

#### Pilihan Database
- PostgreSQL sebagai RDBMS utama untuk transaksi, order split, settlement.
- Multi-merchant order support melalui `order_header` dan `order_line`.

#### Skema SQL

```
CREATE TABLE order_header (
  order_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL,
  total_discount NUMERIC(18,2) NOT NULL,
  total_shipping NUMERIC(18,2) NOT NULL,
  total_platform_fee NUMERIC(18,2) NOT NULL,
  total_merchant_payout NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE TABLE order_store_split (
  order_split_id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES order_header(order_id),
  merchant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  split_amount NUMERIC(18,2) NOT NULL,
  split_shipping NUMERIC(18,2) NOT NULL,
  split_discount NUMERIC(18,2) NOT NULL,
  split_platform_fee NUMERIC(18,2) NOT NULL,
  split_merchant_payout NUMERIC(18,2) NOT NULL,
  voucher_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_line_item (
  line_item_id UUID PRIMARY KEY,
  order_split_id UUID NOT NULL REFERENCES order_store_split(order_split_id),
  product_id UUID NOT NULL,
  sku TEXT NOT NULL,
  merchant_id UUID NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(18,2) NOT NULL,
  line_discount NUMERIC(18,2) NOT NULL,
  shipping_fee NUMERIC(18,2) NOT NULL,
  tax_amount NUMERIC(18,2) NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL,
  return_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_shipping_split (
  shipping_split_id UUID PRIMARY KEY,
  order_split_id UUID NOT NULL REFERENCES order_store_split(order_split_id),
  courier_code TEXT NOT NULL,
  tracking_number TEXT,
  service_type TEXT NOT NULL,
  shipping_cost NUMERIC(18,2) NOT NULL,
  cod_amount NUMERIC(18,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_promo_allocation (
  allocation_id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES order_header(order_id),
  promo_type TEXT NOT NULL,
  promo_id UUID,
  scope TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_header_user ON order_header (user_id);
CREATE INDEX idx_order_split_order ON order_store_split (order_id);
CREATE INDEX idx_order_line_item_split ON order_line_item (order_split_id);
```

#### Mekanisme Checkout Multi-Merchant
- Single checkout menghasilkan `order_header` utama.
- `order_store_split` untuk setiap merchant/toko.
- `order_shipping_split` untuk setiap kurir atau gabungan resi multi-gudang.
- Voucher global vs voucher toko dialokasikan dalam `order_promo_allocation`.
- Biaya layanan platform dihitung per split merchant dan disimpan di `split_platform_fee`.

### 3.4 Skema Modul Keranjang Belanja

#### Pilihan Database
- Redis Hash / RedisJSON untuk cart item dan ephemeral state.
- Alternatif Cassandra untuk cart history dan ultra-low-latency write-heavy.

#### Skema Redis Hash
- Key: `cart:<user_id>`
- Field: `items`, `total_price`, `last_updated`, `promo_applied`
- Struktur `items` sebagai JSON serialized atau RedisJSON object

```
HSET cart:<user_id> items '{"product_id":"...","sku":"...","qty":2, ...}'
HSET cart:<user_id> total_price 350000
```

#### Skema RedisJSON (lebih optimal)
- Key: `cart:<user_id>`
- JSON Document:
  - `user_id`
  - `items`: array of {product_id, sku, merchant_id, qty, unit_price, weight, warehouse_id}
  - `promotion`: {voucher_ids, promo_id, discount_amount}
  - `shipping_estimates`
  - `updated_at`

#### Optimalisasi Read/Write
- Use Redis pipelining untuk batch cart ops.
- Use TTL 14 hari untuk inactive cart.
- Snapshots ke Cassandra / PostgreSQL via async job untuk analytics.

### 3.5 Strategi Database Scaling

#### Read-Write Splitting
- PostgreSQL primary for writes; replicas untuk read-only queries.
- Route read-heavy queries to replica cluster: product metadata, order history, recommendation snapshot.
- Use PgBouncer / HAProxy for connection pooling.

#### Database Sharding
- Shard berdasarkan `user_id` untuk user-centric data dan cart.
- Shard berdasarkan `merchant_id` untuk merchant store, inventory, merchant settlement.
- Shard key examples:
  - `user_shard = user_id % 32`
  - `merchant_shard = merchant_id % 16`
- Use application-level sharding middleware atau Vitess / Citus.

#### CDC to Data Warehouse/Data Lake
- Debezium dengan PostgreSQL connector untuk capture insert/update/delete.
- Sink ke Kafka topics, lalu ke Snowflake / BigQuery / AWS Redshift / Data Lake S3.
- Data flows:
  - `orders` -> analytical order fact
  - `payments` -> cashflow fact
  - `inventory` -> stock movement fact
  - `users` / `merchants` -> dimension tables

### 3.6 Additional SQL/NoSQL Schemas
#### Payment Ledger Schema
```
CREATE TABLE payment_ledger (
  ledger_id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES order_header(order_id),
  merchant_id UUID,
  account_type TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  related_transaction_id UUID,
  metadata JSONB
);
CREATE INDEX idx_payment_ledger_order ON payment_ledger(order_id);
CREATE INDEX idx_payment_ledger_merchant ON payment_ledger(merchant_id);
```

#### Promo and Voucher Schema
```
CREATE TABLE promo_campaign (
  promo_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  promo_type TEXT NOT NULL,
  discount_value NUMERIC(18,2),
  discount_pct INT,
  minimum_spend NUMERIC(18,2),
  max_discount NUMERIC(18,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  stackable BOOLEAN DEFAULT false,
  applicable_scopes TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE voucher_code (
  voucher_id UUID PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES promo_campaign(promo_id),
  code TEXT NOT NULL UNIQUE,
  usage_limit INT,
  used_count INT DEFAULT 0,
  user_restriction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE voucher_redemption (
  redemption_id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES voucher_code(voucher_id),
  order_id UUID NOT NULL REFERENCES order_header(order_id),
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL
);
```

#### Inventory Reservation Schema
```
CREATE TABLE inventory_reservation (
  reservation_id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES order_header(order_id),
  quantity INT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  reservation_status TEXT NOT NULL
);
CREATE INDEX idx_inventory_reservation_product ON inventory_reservation(product_id);
CREATE INDEX idx_inventory_reservation_order ON inventory_reservation(order_id);
```

#### Merchant and KYC Schema
```
CREATE TABLE merchant_profile (
  merchant_id UUID PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  merchant_type TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  kyc_status TEXT NOT NULL,
  tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kyc_document (
  document_id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchant_profile(merchant_id),
  document_type TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_kyc_document_merchant ON kyc_document(merchant_id);
```
|---|---|---|---|---|
| `product_id` | UUID | PK | yes | Product identity |
| `merchant_id` | UUID | FK | yes | Merchant owner |
| `sku` | TEXT | unique | yes | Stock keeping unit |
| `category_attributes` | JSONB | - | GIN | Dynamic Zalora-like attributes |
| `variants` | JSONB | - | GIN | Variant data with size/color |
| `availability_status` | TEXT | - | yes | Publish status |

#### Order Header Table
| Field | Type | PK / FK | Index | Description |
|---|---|---|---|---|
| `order_id` | UUID | PK | yes | Primary order identifier |
| `user_id` | UUID | FK | yes | Buyer identity |
| `total_amount` | NUMERIC(18,2) | - | - | Gross order value |
| `status` | TEXT | - | yes | Order lifecycle state |
| `payment_method` | TEXT | - | - | Payment channel |
| `metadata` | JSONB | - | - | Split order array, promo details |

#### Cart Storage (RedisJSON)
| Key | Type | Purpose |
|---|---|---|---|
| `cart:<user_id>` | JSON document | Persist current cart state |
| `items` | Array | Items with `product_id`, `sku`, `merchant_id` |
| `promotion` | Object | Selected promo/voucher data |
| `updated_at` | Timestamp | Expiry and sync control |

#### Loyalty Wallet Table
| Field | Type | PK / FK | Index | Description |
|---|---|---|---|---|
| `user_id` | UUID | PK | yes | User wallet owner |
| `coins_balance` | BIGINT | - | - | Available coins |
| `reserved_coins` | BIGINT | - | - | Coins held during checkout |
| `expiry_date` | TIMESTAMPTZ | - | - | Wallet expiration horizon |

---

## 4. LOKALISASI LOGISTIK DAN PEMBAYARAN EKOSISTEM INDONESIA

### 4.1 Arsitektur Sistem Logistik

#### Integrasi Kurir
- Sistem aggregator kurir:
  - Biteship / Shipper sebagai aggregator API
  - Direct API integration ke JNE, J&T, SiCepat, Anteraja, NinjaXpress, GoSend, GrabExpress, Pos Indonesia
- Microservice `Logistics & Shipping Service` bertindak sebagai orchestration layer.

#### Perhitungan ongkir multi-toko/gudang
- Order split ke beberapa shipment route berdasarkan asal gudang dan destinasi.
- Biaya shipping dihitung per `shipping_split`:
  - `shipping_cost = max(base_cost, volumetric_cost, weight_cost) + surcharge`
  - Volume matrix: `volumetric_weight = (length * width * height) / 6000`
- Jika pembeli membeli dari 3 toko/gudang:
  - Generate 3 `order_shipping_split` dan 3 resi.
  - Total ongkir = sum dari ketiga shipping split.
  - Untuk fitur gratis ongkir, apply voucher di level `order_shipping_split` atau `order_promo_allocation`.

#### COD dan rekonsiliasi
- Workflow COD:
  1. User memilih COD saat checkout.
  2. `Payment Service` membuat order dengan `payment_method = COD` dan `status = AWAITING_COD_COLLECTION`.
  3. `Logistics Service` generates COD manifest ke courier.
  4. Courier pickup collects cash and updates status di `shipping.status`.
  5. `Payment & Ledger Service` reconciles COD deposit after courier settlement.
- Rekonsiliasi dengan kurir:
  - Courier mengirimkan manifest settlement daily.
  - `Payment Service` mencocokkan `tracking_number`, `cod_amount`, `cash_received`.
  - Differences go to `cash_difference` ledger account.

### 4.2 Sistem Retur Barang Instan

#### Alur Retur Zalora-Style
1. User request return via Customer Service.
2. `Ticketing Service` membuat case return.
3. `Logistics Service` assigns same-day/reguler pickup by courier.
4. Courier collects item and mengirim ke warehouse marketplace.
5. Warehouse melakukan inspeksi QC.
6. Jika diterima, `Payment Service` memproses refund otomatis ke e-wallet atau original payment method.
7. `Notification Service` memberi tahu status return.

#### Komponen otomatisasi
- `Customer Service & Ticketing Service` memicu `return.requested`.
- `Logistics Service` menggenerate `pickup.order` ke courier.
- `Order Management Service` update `return_status`.
- `Payment Service` memproses `refund.transaction` berdasarkan rule refund.
- `Inventory Service` menyesuaikan stock kembali jika barang diterima.

### 4.3 Sistem Pembayaran & Escrow

#### Arsitektur Escrow
- `Payment & Ledger Service` menyimpan dana customer ke account escrow.
- Skema escrow:
  - `escrow_balance` untuk total outstanding funds.
  - `merchant_due_balance` per merchant.
  - `platform_fee_hold` dan `promo_subsidy_hold`.
- Settlement terjadi setelah fulfillment/confirmation window: `T+1`, `T+3`, atau after return period.

#### Integrasi payment lokal
- Virtual Account (BCA, Mandiri, BRI, BNI) via Midtrans/Xendit/DOKU.
- E-Wallet: GoPay, OVO, Dana, ShopeePay, LinkAja.
- QRIS dynamic.
- PayLater / installment via partner financing.
- Kartu kredit via gateway.

#### Alur settlement dana
1. Setelah `order.status = DELIVERED` / `AFTER_RETURN_WINDOW`, `Payment Service` menghitung:
   - merchant_amount = order_total - platform_fee - promo_subsidy - voucher_subsidy - shipping_cost_share
2. Buat settlement instruction ke accounting ledger.
3. Transfer uang ke rekening penjual via batch settlement.
4. Simpan audit trail:
   - `settlement_id`, `merchant_id`, `order_id`, `amount`, `fee_details`, `settlement_date`

#### Contoh alur billing
- Order total Rp 500.000
- Voucher platform Rp 50.000, voucher toko Rp 20.000
- Biaya platform 5% = Rp 25.000
- Ongkir merchant A = Rp 15.000, merchant B = Rp 20.000
- Settlement merchant A/B dibagi proporsional dan dipotong biaya.

### 4.4 Shipping and Escrow Ledger Examples
#### Shipping cost ledger example
| ledger_account | amount | description |
|---|---|---|
| `shipping_revenue` | 35.000 | Total collected from buyer |
| `courier_payable` | 28.000 | Amount payable to courier |
| `shipping_subsidy` | 7.000 | Platform absorbed discount |

#### Escrow settlement ledger example
| ledger_account | amount | description |
|---|---|---|
| `escrow_incoming` | 500.000 | Buyer payment received |
| `platform_fee` | 25.000 | Admin fee withheld |
| `voucher_subsidy` | 70.000 | Total voucher subsidy |
| `merchant_payable` | 405.000 | Gross merchant payout before returns |
| `cod_pending` | 0 | COD pending settlement amount |

---

## 5. MARKETING ENGINE, LIVE COMMERCE, & GAMIFIKASI

### 5.1 Promo Engine

#### Validasi tumpukan diskon
- Rule hierarchy:
  - Platform-level voucher
  - Merchant-level voucher
  - Gratis ongkir
  - Cashback Koin
- Engine mengaplikasikan rules dalam order of precedence, dengan `promocode` validation dan `stackability` matrix.

#### Arsitektur performa tinggi
- `Promo Engine` menyimpan rules di Redis cache untuk validasi sub-ms.
- Batch compile rule menjadi evaluasi expression untuk checkout.
- Use vectorized evaluation dan trait-based rule templates.
- Asynchronous precompute voucher quotas via Kafka.

#### Pencegahan exploit
- Prevent double redemption with atomic decrement di Redis.
- Check `order_id` + `user_id` + `voucher_id` uniqueness.
- Use distributed locking pada voucher bucket keys.
- Real-time fraud signals dari `Fraud Detection Service` untuk suspicious voucher abuse.

### 5.2 Live Shopping System

#### Arsitektur video streaming
- Ingest via RTMP dari host.
- Transcode ke HLS dan WebRTC untuk low-latency.
- CDN edge caching untuk viewer scale.
- Real-time overlay events via WebSocket / Pub/Sub.

#### Data flow
- Live host pushes stream to media server.
- `Live Streaming Service` creates session object dan generates playback URL.
- `Live Commerce Engine` menghubungkan `product_id` pinned dengan chat dan buy buttons.

#### Real-time sinkronisasi
- Viewer count dan stock remaining dikirim melalui Redis Pub/Sub.
- `Recommendation Service` mempromosikan produk live ke feed.
- `Order Service` memproses purchase in-stream via `instant checkout` API.

#### Flow ringkas
```
Host -> RTMP ingest -> Media server -> CDN/HLS/WebRTC -> Viewer
                        |-> Event bus -> Live Commerce -> Cart/Checkout
```

### 5.3 Gamifikasi (Shopee-Style)

#### Model data
- Table `user_loyalty_wallet`
- Table `loyalty_transactions`
- Table `loyalty_rules`

```
CREATE TABLE user_loyalty_wallet (
  user_id UUID PRIMARY KEY,
  coins_balance BIGINT NOT NULL DEFAULT 0,
  reserved_coins BIGINT NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ
);

CREATE TABLE loyalty_transactions (
  transaction_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  coins_change BIGINT NOT NULL,
  source TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Logika koin loyalty
- Earn rules:
  - daily check-in: +10 koin
  - purchase reward: 1% of order total up to max
  - wheel spin bonus
- Usage rules:
  - koin digunakan maksimal 25% dari total transaksi
  - apply di checkout dengan per-order cap dan merchant constraints
  - koin expired berdasarkan policy, contohnya 30 or 60 hari

#### Validasi dan pembatasan
- Pastikan saldo koin charged atomically melalui `user_loyalty_wallet` update.
- Simpan `reserved_coins` saat checkout dimulai.
- Release reserved coins on order cancel/failure.

### 5.4 Live Commerce Operational Model
- Session orchestration:
  - `Live Streaming Service` mengelola `live_session` entity dengan state transitions: `SCHEDULED`, `LIVE`, `PAUSED`, `ENDED`.
  - Product pinning events `live.product.pinned` dan `live.product.unpinned` dipublikasikan ke event bus.
- Purchase flow:
  1. Viewer klik buy button -> `Live Commerce Engine`
  2. `Cart Service` menambahkan item pinned ke cart dengan `live_session_id`
  3. `Promo Engine` memvalidasi flash sale discounts immediately
  4. `Checkout Service` mengirim `live.purchase.intended` event
- Low-latency requirements:
  - Real-time chat via WebSocket cluster, scaled by `room_id`.
  - Stock decrement updates pada viewers broadcast every 2s.
  - Viewer metrics aggregated into Redis time-series for dashboard.
- Data model additions:
  - `live_session`: session_id, host_id, started_at, ended_at, viewer_count, product_list
  - `live_product_pin`: pin_id, session_id, product_id, pin_order, price_overrides
  - `live_viewer_metrics`: timestamp, session_id, concurrent_viewers, engagement_score

### 5.5 Promo Stacking Matrix and Live Commerce SLAs
- Stack rules:
  - Platform voucher + Merchant voucher + Cashback Koin + Gratis Ongkir.
  - Setiap kombinasi dievaluasi oleh engine menggunakan precedence table.
  - Contoh: if merchant voucher non-stackable then platform voucher is prioritized first.
- SLA untuk live commerce:
  - < 200ms latency untuk buy button response.
  - > 99.9% stream availability during campaign.
  - < 1% dropped connection rate for WebRTC viewers.
- Metric tracking:
  - `live.session.concurrency`
  - `live.product.click_through_rate`
  - `live.checkout.conversion_rate`

---

## 6. INFRASTRUCTURE, CI/CD, & DEVOPS TOOLCHAIN

### 6.1 Cloud-Native Infrastructure

#### Pilihan cloud
- AWS/GCP/Alibaba produce similar architecture. Rekomendasi hybrid: AWS untuk payment/logistics, GCP untuk analytics, Alibaba untuk China-connected cross-border support.

#### Kubernetes cluster
- AWS: EKS
- GCP: GKE
- Alibaba: ACK
- Namespace separation: `platform`, `marketplace`, `live-commerce`, `data`, `infra`
- Node groups:
  - control plane managed
  - compute nodes for frontend/backend
  - high-memory nodes untuk ML and search
  - GPU/autoscaling node pools for live encoding

#### Auto-scaling
- HPA berdasarkan CPU/Memory dan custom metrics (RPS, queue length)
- VPA untuk pod resource tuning
- Cluster Autoscaler untuk menambah node saat load spike
- Kustom metrics via Prometheus Adapter

### 6.2 Service Mesh
- Istio / Linkerd untuk mTLS internal, traffic policy, telemetry.
- Istio features:
  - mutual TLS authentication
  - traffic splitting untuk Canary / Blue-Green
  - fault injection untuk chaos testing
  - distributed tracing injection

### 6.3 Observability Stack
- Prometheus: metrics scraping dari services dan Envoy
- Grafana: dashboards untuk latency, throughput, error rate, stock availability
- Jaeger: distributed tracing across API Gateway -> microservices -> DB
- Logging:
  - ELK stack: Elasticsearch cluster, Logstash ingest, Kibana dashboards
  - Alternatif Loki/Promtail + Grafana for lightweight logs
- Alerting via Alertmanager ke PagerDuty / Slack.

### 6.4 CI/CD dan DevOps Toolchain
- Repo management: GitHub / GitLab.
- CI pipeline:
  - build image, unit test, integration test
  - static code scan: SonarQube
  - container security scan: Trivy
  - dependency scan: Snyk / OSS review
- CD pipeline:
  - ArgoCD GitOps deployment ke Kubernetes
  - environment promotion: dev -> staging -> prod
  - canary deploy and automated rollback
- Infrastructure as code:
  - Terraform / Pulumi untuk cluster, networking, DB
  - Helm charts untuk service deployment
- Secret management:
  - HashiCorp Vault atau cloud secret manager
  - K8s Secrets dengan rotation

### 6.5 Platform Governance and Compliance Pipeline
- GitOps policy:
  - declarative manifests in Git repositories
  - ArgoCD auto-sync with manual promotion gates for production
- Compliance scanning:
  - manifest linting with `kubeval`, `conftest`, `checkov`
  - container image signing and SBOM generation
- Runbook automation:
  - automated rollback on failed canary metrics
  - deployment health checks linked to incident management
- Backup and recovery:
  - periodic snapshot of PostgreSQL using WAL archiving
  - Redis persistence with AOF + snapshotting
  - Elasticsearch incremental snapshot to object storage

### 6.6 Observability and Chaos Engineering
- Canary dashboards for critical paths: checkout, payment, inventory.
- Synthetic monitoring for latency across Indonesia regions.
- Chaos testing:
  - pod kill, network latency injection, Kafka broker failover.
  - feature flags to disable non-critical components during tests.
- Post-mortem metrics capture: MTTR, error budget burn, service level indicators (SLIs).

### 6.7 DevSecOps Controls
- Policy-as-code for deployment and runtime security.
- EKS/GKE workload identity and least privilege IAM roles.
- Runtime threat detection with Falco / Aqua / Prisma Cloud.
- Container runtime defense on node pools.

---

## 7. KEAMANAN DATA, ANTI-FRAUD, & KEPATUHAN REGULASI

### 7.1 Perlindungan Data Pribadi (UU PDP Indonesia)

#### Enkripsi data sensitif
- Data at rest:
  - AES-256-GCM di database untuk KTP, nomor telepon, alamat, detail pembayaran
  - Envelope encryption dengan data keys dienkripsi oleh master key di KMS (AWS KMS / GCP KMS / Alibaba KMS)
- Data in transit:
  - TLS 1.2+ untuk semua service-to-service dan external API
  - mTLS pada service mesh

#### Data masking dan access control
- Mask sensitive fields pada logs dan observability.
- Role-based access control (RBAC) di aplikasi.
- Attribute-based access control (ABAC) untuk user data handling.
- Audit log untuk akses / perubahan data sensitif.

#### Data residency dan retention
- Simpan data di region Indonesia untuk compliance.
- Retention policy per UU PDP: data KYC disimpan sesuai kebutuhan, secara otomatis dihapus/anonimkan jika tidak lagi diperlukan.

### 7.2 Anti-Fraud & Anti-Bot

#### WAF dan DDoS protection
- Cloudflare Enterprise / AWS Shield Advanced / GCP Armor.
- Rules:
  - IP reputation filtering
  - rate limiting untuk API endpoints kritis
  - bot protection pada login, checkout, promo redemption

#### Anti-bot dan device fingerprinting
- Device fingerprinting capture:
  - user agent, canvas hash, browser plugins, timezone, screen resolution
  - persistent device ID via secure cookies/local storage
  - IP entropy and session velocity
- Use fingerprint store in Redis and compare against historical patterns.
- Bot challenge flow:
  - suspicious session triggers CAPTCHA or device challenge.
  - repeated suspicious actions escalate to manual review in `Fraud Detection Service`.

#### Pembatasan pembelian flash sale
- Rules:
  - limit order per user/device/IP during flash sale
  - restrict same email/phone per account
  - detect Sybil via cross-account matching
- Implementation:
  - counters di Redis with expiry, `flashsale.limit:<event_id>:<user_id>`.
  - `Fraud Detection Service` flags suspicious patterns.
  - enforce cooldown periods on high-risk account behaviors.

### 7.4 Privacy by Design and Tokenization
- Tokenization for PII fields:
  - store KTP, phone, email as tokens in app database
  - map tokens to actual sensitive values in Vault-protected store
- Field-level encryption on `user_profile` and `payment_details` tables.
- Access controls:
  - service-level access policies enforced by service mesh.
  - least privilege for database access using schema-level roles.
- Data deletion and anonymization:
  - workflow untuk right to be forgotten
  - periodic sweep jobs to sanitize stale personal data in analytics stores.

### 7.5 Incident Response and Forensics
- Forensic logging:
  - immutable logs stored in object storage with WORM policy
  - correlation IDs across API gateway, service mesh, and Kafka
- Incident response steps:
  1. detect and triage
  2. isolate affected service
  3. preserve evidence
  4. remediate and recover
  5. notify stakeholders and regulators
- Regular tabletop exercises for PDP breach readiness.

### 7.6 Compliance Assurance
- Audit frameworks:
  - internal control self-assessment
  - third-party compliance audit for PDP and PCI-DSS scope
- Report generation:
  - data access logs
  - KYC and merchant onboarding approvals
  - payment settlement reconciliation reports

---

## Lampiran: Diagram Teknis dan Flow
- Audit trails untuk order, payment, settlement, KYC, voucher redemption.
- Event logging ke append-only storage dan archived ke object storage.
- Periodic compliance review dan security audit.
- Data breach response plan dan incident reporting.

### 7.4 Regulatory Controls and Incident Response
- Regulatory controls:
  - Data minimization dan purpose limitation for PDP compliance.
  - Consent capture dan withdrawal management for marketing communications.
  - Right to access, rectification, and erasure workflows.
- Incident response:
  - Security Operations Center (SOC) on-call rotation.
  - Breach detection via SIEM ingest dari logs dan Kafka event anomalies.
  - Triage runbook for compromised account, payment irregularity, and DDoS.
- Post-incident:
  - forensic evidence capture
  - regulatory notification timeline
  - remediation tracking in ticketing service.

---

## Lampiran: Diagram Teknis dan Flow

### A. Sequence Diagram - Flash Sale Checkout

1. User -> API Gateway: `POST /flashsale/checkout`
2. Gateway -> Auth Service: token validation
3. Gateway -> Cart Service: cart validation
4. Cart Service -> Inventory Service: reserve stock (Redis lock)
5. Cart Service -> Promo Engine: validate promo
6. Cart Service -> Kafka: publish `checkout.pending`
7. OMS -> Payment Service: create payment request
8. Payment Service -> Gateway: local payment gateway / e-wallet
9. Payment completed -> Kafka event -> OMS updates order
10. OMS -> Logistics Service: create delivery
11. Notification Service sends order confirmation

### B. Topology Text Diagram

```
Client Browser/App
      |
  API Gateway (Envoy/Kong)
      |
  +-------------------------------+
  |          Service Mesh          |
  +-------------------------------+
      |
  +------------------------------------+--------------------------------+
  |  Marketplace Services              |  Infrastructure Services       |
  |  - Auth/Identity                   |  - Kafka                       |
  |  - Product Catalog/Search          |  - Redis Cluster               |
  |  - Inventory/Warehouse             |  - PostgreSQL Cluster          |
  |  - Cart/Checkout                   |  - Elasticsearch/OpenSearch    |
  |  - Order Management                |  - Prometheus/Grafana/Jaeger   |
  |  - Payment/Ledger                  |  - ArgoCD/GitOps               |
  |  - Promo/Voucher/Flashsale         |  - WAF/CDN                     |
  |  - Logistics/Shipping              |  - Vault/KMS                   |
  |  - Notification                    |                                |
  |  - User/Merchant                   |                                |
  |  - Live Streaming                  |                                |
  |  - Gamification                    |                                |
  |  - Customer Service/Ticketing      |                                |
  |  - Recommendation/Personalization   |                                |
  |  - Fraud Detection                 |                                |
  +------------------------------------+--------------------------------+
```

## Kesimpulan

NusantaraMall memadukan kekuatan multi-tenant marketplace Tokopedia, promo agresif Shopee, dan logistik fashion Zalora dalam arsitektur microservices yang scalable, resilient, dan compliant. Model poliglot persistence, event-driven orchestration, dan cloud-native DevOps pipeline dirancang untuk mendukung pertumbuhan volume pengguna dan transaksi di tingkat hyper-scale.

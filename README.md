# RescueBites - Food Expiry Discount Marketplace

A production-quality full-stack marketplace web application connecting food providers (supermarkets, bakeries, cafes, cloud kitchens) with customers to rescue food approaching its best-before/expiry date at discounted prices.

---

## 🌟 Core Highlights

- **Strict Categorical Boundaries**: Per requirements, **NO fruits or vegetables** are included anywhere in categories, sample data, UI, filters, or business logic. Focused exclusively on packaged groceries, dairy, bakery, cakes/pastries, ready-to-eat meals, snacks, beverages, desserts, and frozen foods.
- **Three Dedicated Standalone Applications**:
  1. **Customer App (`customer-app`)** - `http://localhost:5173`: Geolocation discovery, category tabs, dynamic urgency badges (`Ending Today 🔥`, `Best Before Tomorrow ⚡`), multi-provider cart separation protection, checkout simulator with Razorpay/UPI architecture, order history, and live QR code / 4-digit pickup code display.
  2. **Store Manager Portal (`store-app`)** - `http://localhost:5174`: Real-time rescue sales (₹), products rescued count, active listings, shelf-life auto-discounting calculator, order status workflow (`Accept` -> `Ready for Pickup`), and a **Counter Pickup Verification System** with double-collection prevention.
  3. **Admin Console (`admin-app`)** - `http://localhost:5175`: High-security Ops console for Provider onboarding & FSSAI license approval (`Pending` -> `Approved`/`Rejected`/`Suspended`), catalog moderation, order refund supervision, and marketplace analytics (GTV, platform fee revenue, food volume saved).
- **Strict Role Isolation**: Zero cross-role code or navigation pollution. Each app has its own dedicated login and 1-click Demo Account filler for effortless testing.

---

## 🏗️ Architecture & Tech Stack

- **Backend (`backend/`)**: Node.js, Express.js (ES Modules), Port 5000
- **Database**:
  - Full PostgreSQL DDL (`backend/src/database/schema.sql`) with 17 normalized tables and optimized indexes.
  - Zero-config dual engine: automatically connects to PostgreSQL when `DATABASE_URL` is configured in `.env`, and defaults to SQLite for instant local execution.
- **Frontend Applications**:
  - **`customer-app`**: React 18, Vite, Tailwind CSS, Lucide React, Leaflet Maps, QRCode generator (Port 5173).
  - **`store-app`**: React 18, Vite, Tailwind CSS, Lucide React, QRCode generator (Port 5174).
  - **`admin-app`**: React 18, Vite, Tailwind CSS, Lucide React (Port 5175).
- **Security**: JWT authentication, bcrypt password hashing, role authorization middleware, server-side price recalculation (prices sent by clients are never trusted), and transaction-level expiry validation.

---

## 🗄️ Normalized Database Design (17 Tables)

1. `users`: Master user accounts, roles (`customer`, `provider`, `admin`), phone, and status.
2. `addresses`: Geocoded delivery and pickup addresses with latitude and longitude.
3. `customers`: Customer profiles, loyalty points, default address relation.
4. `providers`: Business profile, FSSAI license number, bank/UPI payout info, approval status (`pending`, `approved`, `rejected`, `suspended`).
5. `provider_documents`: Onboarding verification documents (FSSAI license, GST certificates).
6. `categories`: Food categories (excluding fruits and vegetables).
7. `products`: Core product catalog with original price, discount percent, discounted price, stock quantity, best-before date, and expiry date.
8. `product_images`: High-res product images and primary flags.
9. `inventory`: Real-time stock counts (available, reserved, sold).
10. `orders`: Order header with order number (`#FD10293`), customer/provider IDs, subtotal, platform fee, total, status, pickup window, and 4-digit pickup code.
11. `order_items`: Order line items with unit original and discounted prices.
12. `payments`: Payment records, method (UPI, Card, Netbanking), transaction ID, and gateway status.
13. `pickup_verifications`: Audit log of store counter collections recording verifier ID, timestamp, and method to prevent double collection.
14. `discount_rules`: Dynamic tier thresholds based on shelf life.
15. `reviews`: Customer reviews and star ratings for providers.
16. `notifications`: In-app notification alerts for customers and providers.
17. `admin_users`: Internal marketplace operations administrators.

**Key Indexes**:
- `provider_id`, `category_id`, `expiry_date`, `is_active`, `(latitude, longitude)`, `order status`, and `pickup_code`.

---

## ⏱️ Shelf-Life Classification & Auto-Discounting

Products are automatically classified by remaining shelf-life:
- **NORMAL**: > 7 days remaining (0% recommended discount)
- **APPROACHING**: 3–7 days remaining (20% recommended discount)
- **URGENT**: 1–2 days remaining (30% for 2 days, 50% for 1 day, 60% for today)
- **EXPIRED**: Date has passed. **Critical Food Safety Guarantee**: Expired items are strictly delisted and blocked from customer purchase at the database query and transaction level.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher) & npm

### 1. Installation
Install dependencies for all projects:
```bash
npm run install:all
```

### 2. Seed Database
Populate the database with realistic Indian food products, verified providers, and demo accounts:
```bash
npm run seed
```

### 3. Run Automated Tests
Execute the 20-point automated integration test suite:
```bash
npm test
```

### 4. Run Applications

Start the shared backend API server:
```bash
npm run dev:backend
# API running at http://localhost:5000
```

In separate terminals, start whichever frontend application you wish to use:

```bash
# 1. Customer App (Shoppers)
npm run dev:customer
# Accessible at: http://localhost:5173

# 2. Store Manager Portal (Merchants)
npm run dev:store
# Accessible at: http://localhost:5174

# 3. Platform Admin Console (Operations)
npm run dev:admin
# Accessible at: http://localhost:5175
```

---

## 🔑 Demo Accounts

Each app includes a 1-click **Quick Testing** button on its login screen, or you can log in manually:

| Role | Application | URL | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer** | `customer-app` | `http://localhost:5173` | `customer@example.com` | `password123` | Rahul Verma (Shopper) |
| **Store Manager** | `store-app` | `http://localhost:5174` | `provider@example.com` | `password123` | The Daily Crumb Bakery |
| **Admin** | `admin-app` | `http://localhost:5175` | `admin@example.com` | `admin123` | Marketplace Ops Superadmin |

---

## 🧪 Testing the Complete Main Flows

### 1. Customer Flow
1. Select location (e.g., *Indiranagar*, *Koramangala*, or browser GPS).
2. Filter by category (e.g. *Dairy*, *Bakery*, *Cakes & Pastries*, *Snacks*).
3. Search for `"paneer"`, `"bread"`, or `"cake"`.
4. Click **View Deal** on any product card: verify original price, discounted price, expiry countdown, and food-safety warning.
5. Click **Add to Cart** or **Buy Now**.
6. Open cart: verify provider grouping, subtotal, and ₹5 platform contribution fee.
7. Proceed to checkout: select pickup time slot, choose mock UPI/Card simulator, and confirm.
8. Receive Order ID (`#FDxxxxx`), unique 4-digit pickup code, and interactive QR Code.
9. View live order in **My Pickups** history.

### 2. Provider Flow
1. Switch to **Provider** role using the top bar.
2. View **Dashboard**: inspect today's rescue sales, products rescued count, and urgent expiry alerts.
3. Open **Surplus Food Catalog**: click **Create New Listing**, enter product info, toggle automatic discounting, and publish.
4. Open **Store Orders & Pickup**: view incoming orders, click **Mark Ready**.
5. When customer arrives, enter their 4-digit pickup code into the **Counter Pickup Verification System** and click **Verify & Complete Pickup**.
6. Try re-entering the same code: the system blocks double-collection with an audit alert!

### 3. Admin Flow
1. Switch to **Admin** role using the top bar.
2. Open **Provider Approvals**: view pending provider applications (e.g. *Metro Grocery Depot*), inspect FSSAI details, and click **Approve**.
3. Open **Product Moderation**: disable or enable any listings across the platform.
4. Open **Orders & Refunds**: inspect transactions and issue refunds.
5. View **Platform Analytics**: review Gross Transaction Value (GTV), platform fees, total items saved, and top categories.

---

## 📜 Food Safety Disclaimer

RescueBites strictly complies with food safety and consumer protection guidelines. All items listed on the platform are verified packaged foods with legible labeling. Expired products are automatically prevented from being displayed or sold.

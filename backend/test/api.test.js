import http from 'http';
import { seedDatabase } from '../src/database/seed.js';

// We will start our express server programmatically for testing
import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/authRoutes.js';
import productRoutes from '../src/routes/productRoutes.js';
import orderRoutes from '../src/routes/orderRoutes.js';
import providerRoutes from '../src/routes/providerRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import { generateToken } from '../src/middleware/auth.js';
import db from '../src/config/db.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

const TEST_PORT = 5099;
let server;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      {
        host: 'localhost',
        port: TEST_PORT,
        method,
        path,
        headers
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n--- STARTING API INTEGRATION TESTS ---');
  await seedDatabase();

  server = app.listen(TEST_PORT);
  console.log(`Test server running on port ${TEST_PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Categories - STRICT CHECK: NO FRUITS OR VEGETABLES
    const catRes = await request('GET', '/api/products/categories');
    assert(catRes.status === 200, 'GET /api/products/categories returns 200');
    const catNames = catRes.data.categories.map((c) => c.name.toLowerCase());
    const hasFruitOrVeg = catNames.some(
      (n) => n.includes('fruit') || n.includes('veg') || n.includes('produce')
    );
    assert(!hasFruitOrVeg, 'CRITICAL: Categories contains ZERO fruits or vegetables');

    // 2. Auth - Customer Login
    const custLogin = await request('POST', '/api/auth/login', {
      email: 'customer@example.com',
      password: 'password123'
    });
    assert(custLogin.status === 200, 'Customer login succeeds');
    const customerToken = custLogin.data.token;

    // 3. Auth - Provider Login
    const provLogin = await request('POST', '/api/auth/login', {
      email: 'provider@example.com',
      password: 'password123'
    });
    assert(provLogin.status === 200, 'Provider login succeeds');
    const providerToken = provLogin.data.token;

    // 4. Auth - Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    assert(adminLogin.status === 200, 'Admin login succeeds');
    const adminToken = adminLogin.data.token;

    // 5. Products Discovery
    const prodRes = await request('GET', '/api/products?sortBy=distance');
    assert(prodRes.status === 200 && prodRes.data.products.length > 0, 'Products discovery returns available items');
    const sampleProduct = prodRes.data.products[0];
    assert(sampleProduct.discounted_price < sampleProduct.original_price, 'Discounted price is lower than original price');
    assert(sampleProduct.distance_km != null, 'Product has calculated distance in km');
    assert(sampleProduct.expiry_status != null, 'Product has expiry classification (URGENT/APPROACHING/NORMAL)');

    // 6. Search for "paneer"
    const searchRes = await request('GET', '/api/products?search=paneer');
    assert(searchRes.status === 200 && searchRes.data.products.length > 0, 'Search for "paneer" returns relevant items');

    // 7. Multi-Provider Cart Restriction Test
    // Fetch one item from Provider 1 and one from Provider 2
    const allProds = prodRes.data.products;
    const prodFromP1 = allProds.find((p) => p.provider_name.includes('The Daily Crumb'));
    const prodFromP2 = allProds.find((p) => p.provider_name.includes('FreshMart'));

    if (prodFromP1 && prodFromP2) {
      const multiCartRes = await request('POST', '/api/products/cart/validate', {
        items: [
          { productId: prodFromP1.id, quantity: 1 },
          { productId: prodFromP2.id, quantity: 1 }
        ]
      });
      assert(
        multiCartRes.status === 400 && multiCartRes.data.multiProvider === true,
        'CRITICAL: Multi-provider cart is correctly rejected to prevent cross-store pickup confusion'
      );
    }

    // 8. Single-Provider Cart Validation & Order Creation
    const validCartRes = await request('POST', '/api/products/cart/validate', {
      items: [{ productId: prodFromP1.id, quantity: 1 }]
    });
    assert(validCartRes.status === 200 && validCartRes.data.isValid === true, 'Single-provider cart validates successfully');

    // Place Order
    const orderRes = await request(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodFromP1.id, quantity: 1 }],
        customerName: 'Rahul Verma',
        customerPhone: '9876543210',
        pickupStartTime: '16:00',
        pickupEndTime: '20:00',
        paymentMethod: 'UPI'
      },
      customerToken
    );
    assert(orderRes.status === 201, 'Order placed successfully');
    const createdOrder = orderRes.data.order;
    assert(createdOrder.pickupCode && createdOrder.pickupCode.length === 4, '4-digit pickup code generated');
    assert(createdOrder.qrCodeData != null, 'QR code payload generated');

    // 9. Provider Pickup Verification Flow
    // Verify pickup using the 4-digit code
    const verifyRes = await request(
      'POST',
      '/api/provider/pickup/verify',
      {
        code: createdOrder.pickupCode
      },
      providerToken
    );
    assert(verifyRes.status === 200 && verifyRes.data.success === true, 'Provider verifies pickup with 4-digit code');

    // Attempt double collection - MUST FAIL!
    const doubleVerifyRes = await request(
      'POST',
      '/api/provider/pickup/verify',
      {
        code: createdOrder.pickupCode
      },
      providerToken
    );
    assert(
      doubleVerifyRes.status === 409 && doubleVerifyRes.data.alreadyCollected === true,
      'SECURITY: Prevent double collection of already picked up order'
    );

    // 10. Admin Approvals Flow
    const adminProviders = await request('GET', '/api/admin/providers', null, adminToken);
    assert(adminProviders.status === 200, 'Admin can view providers');
    const pendingProv = adminProviders.data.providers.find((p) => p.status === 'pending');
    if (pendingProv) {
      const approveRes = await request(
        'PUT',
        `/api/admin/providers/${pendingProv.id}/status`,
        { status: 'approved' },
        adminToken
      );
      assert(approveRes.status === 200, 'Admin successfully approves pending provider');
    }

    // 11. Admin Analytics
    const analyticsRes = await request('GET', '/api/admin/analytics', null, adminToken);
    assert(analyticsRes.status === 200 && analyticsRes.data.analytics.totalOrders > 0, 'Admin analytics computes GTV and rescued items');

    console.log(`\nTEST RESULTS: ${passed} Passed, ${failed} Failed\n`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();

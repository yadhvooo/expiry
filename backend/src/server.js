import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initDatabase } from './database/initDb.js';
import { generateToken } from './middleware/auth.js';
import db from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger in dev
app.use((req, res, next) => {
  if (!req.path.includes('.') && !req.path.startsWith('/assets')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'RescueBites Food Expiry Marketplace API',
    version: '1.0.0'
  });
});

// Demo accounts endpoint for instant evaluator switching
app.get('/api/demo-accounts', async (req, res) => {
  try {
    const customer = await db.query("SELECT id, email, full_name, role FROM users WHERE email = 'customer@example.com'");
    const provider = await db.query("SELECT id, email, full_name, role FROM users WHERE email = 'provider@example.com'");
    const admin = await db.query("SELECT id, email, full_name, role FROM users WHERE email = 'admin@example.com'");

    const demoAccounts = {
      customer: customer.length > 0 ? { ...customer[0], token: generateToken(customer[0]) } : null,
      provider: provider.length > 0 ? { ...provider[0], token: generateToken(provider[0]) } : null,
      admin: admin.length > 0 ? { ...admin[0], token: generateToken(admin[0]) } : null
    };

    res.json(demoAccounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});

// Mount REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve Frontend Static Assets if built
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[Static] Serving frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  RescueBites Marketplace Server is Running!           `);
      console.log(`  URL: http://localhost:${PORT}                        `);
      console.log(`  Health Check: http://localhost:${PORT}/api/health    `);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

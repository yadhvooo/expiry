import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

export async function registerCustomer(req, res) {
  try {
    const { email, password, fullName, phone, addressLine, city, state, postalCode, latitude, longitude } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    // Check existing email
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
       VALUES ($1, $2, $3, 'customer', $4, $5, 'active')`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName, phone || null]
    );

    const customerId = uuidv4();
    let defaultAddressId = null;

    if (addressLine && city) {
      defaultAddressId = uuidv4();
      await db.query(
        `INSERT INTO addresses (id, user_id, address_line1, city, state, postal_code, latitude, longitude, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
        [
          defaultAddressId,
          userId,
          addressLine,
          city,
          state || 'Karnataka',
          postalCode || '560001',
          latitude || 12.9716,
          longitude || 77.5946
        ]
      );
    }

    await db.query(
      `INSERT INTO customers (id, user_id, default_address_id, loyalty_points)
       VALUES ($1, $2, $3, 50)`,
      [customerId, userId, defaultAddressId]
    );

    const userObj = { id: userId, email: email.toLowerCase().trim(), role: 'customer', full_name: fullName };
    const token = generateToken(userObj);

    return res.status(201).json({
      message: 'Customer registered successfully.',
      token,
      user: {
        id: userId,
        customerId,
        email: userObj.email,
        fullName,
        role: 'customer',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('[Auth] Register customer error:', error);
    return res.status(500).json({ error: 'Failed to register customer.' });
  }
}

export async function registerProvider(req, res) {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      businessName,
      ownerName,
      businessType,
      address,
      latitude,
      longitude,
      licenseNumber,
      bankAccountDetails
    } = req.body;

    if (!email || !password || !businessName || !address) {
      return res.status(400).json({
        error: 'Email, password, business name, and address are required.'
      });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
       VALUES ($1, $2, $3, 'provider', $4, $5, 'active')`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName || ownerName || businessName, phone]
    );

    const providerId = uuidv4();
    // Providers start in 'pending' status until Admin approves
    await db.query(
      `INSERT INTO providers (
        id, user_id, business_name, owner_name, phone, email,
        address, latitude, longitude, business_type, license_number,
        bank_account_details, status, auto_discount_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', 1)`,
      [
        providerId,
        userId,
        businessName,
        ownerName || fullName,
        phone,
        email.toLowerCase().trim(),
        address,
        latitude || 12.9716,
        longitude || 77.5946,
        businessType || 'Supermarket',
        licenseNumber || 'FSSAI-LIC-PENDING',
        bankAccountDetails || 'UPI: business@okaxis'
      ]
    );

    const userObj = { id: userId, email: email.toLowerCase().trim(), role: 'provider', full_name: businessName };
    const token = generateToken(userObj);

    return res.status(201).json({
      message: 'Provider registration submitted. Account is pending admin approval.',
      token,
      user: {
        id: userId,
        providerId,
        email: userObj.email,
        fullName: businessName,
        role: 'provider',
        providerStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('[Auth] Register provider error:', error);
    return res.status(500).json({ error: 'Failed to register provider.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact administration.' });
    }

    let customerInfo = null;
    let providerInfo = null;

    if (user.role === 'customer') {
      const customers = await db.query('SELECT * FROM customers WHERE user_id = $1', [user.id]);
      if (customers.length > 0) customerInfo = customers[0];
    } else if (user.role === 'provider') {
      const providers = await db.query('SELECT * FROM providers WHERE user_id = $1', [user.id]);
      if (providers.length > 0) providerInfo = providers[0];
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
        customer: customerInfo,
        provider: providerInfo
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = req.currentUser;
    let customerInfo = null;
    let providerInfo = null;

    if (user.role === 'customer') {
      const customers = await db.query('SELECT * FROM customers WHERE user_id = $1', [user.id]);
      if (customers.length > 0) customerInfo = customers[0];
    } else if (user.role === 'provider') {
      const providers = await db.query('SELECT * FROM providers WHERE user_id = $1', [user.id]);
      if (providers.length > 0) providerInfo = providers[0];
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
        customer: customerInfo,
        provider: providerInfo
      }
    });
  } catch (error) {
    console.error('[Auth] GetMe error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

export default {
  registerCustomer,
  registerProvider,
  login,
  getMe
};

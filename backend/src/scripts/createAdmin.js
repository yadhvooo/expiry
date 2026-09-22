import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || '';
  const fullName = args[2] || process.env.ADMIN_NAME || 'Operations Admin';
  const phone = args[3] || '9880011223';

  if (!email || !password) {
    console.error(`
Usage:
  node backend/src/scripts/createAdmin.js <email> <password> [fullName] [phone]

Example:
  node backend/src/scripts/createAdmin.js admin2@example.com mySecurePass123 "Alice Smith"
`);
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await db.query('SELECT id, email, role FROM users WHERE email = $1', [email]);

    if (existing.length > 0) {
      const user = existing[0];
      if (user.role === 'admin') {
        console.log(`⚠️ User with email '${email}' is already an admin.`);
        process.exit(0);
      }

      // Promote existing user to admin
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await db.query(
        `UPDATE users 
         SET role = 'admin', password_hash = $1, full_name = $2, status = 'active', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [hash, fullName, user.id]
      );

      const adminUserCheck = await db.query('SELECT id FROM admin_users WHERE user_id = $1', [user.id]);
      if (adminUserCheck.length === 0) {
        await db.query(
          `INSERT INTO admin_users (id, user_id, department, access_level)
           VALUES ($1, $2, 'Operations & Trust', 'SUPER_ADMIN')`,
          [uuidv4(), user.id]
        );
      }

      console.log(`✅ Successfully promoted existing user '${email}' to Admin!`);
      process.exit(0);
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
       VALUES ($1, $2, $3, 'admin', $4, $5, 'active')`,
      [userId, email, passwordHash, fullName, phone]
    );

    await db.query(
      `INSERT INTO admin_users (id, user_id, department, access_level)
       VALUES ($1, $2, 'Operations & Trust', 'SUPER_ADMIN')`,
      [uuidv4(), userId]
    );

    console.log(`
=====================================================
  ✅ New Admin Created Successfully!
=====================================================
  Email:       ${email}
  Full Name:   ${fullName}
  Role:        admin
  Admin URL:   http://localhost:5000/admin (or https://rescuebites.onrender.com/admin)
=====================================================
`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();

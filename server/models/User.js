const { query } = require('../config/database');
const { v4: uuidv4, v5: uuidv5 } = require('uuid');

class User {
  // Create a new user
  static async create(userData) {
    const { username, email, auth_type = 'passkey' } = userData;
    
    const sql = `
      INSERT INTO users (id, username, email, auth_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const userId = uuidv4();
    const result = await query(sql, [userId, username, email, auth_type]);
    return result.rows[0];
  }

  // Create user with a provided ID (for demo mode)
  static async createWithId(id, { username, email, auth_type = 'demo' }) {
    const sql = `
      INSERT INTO users (id, username, email, auth_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    const result = await query(sql, [id, username, email, auth_type]);
    // If user already existed, fetch it
    if (result.rows.length === 0) {
      return await this.findById(id);
    }
    return result.rows[0];
  }

  // Ensure a demo user exists by ID
  static async ensureDemoUser(externalId, username = 'Demo User') {
    // Create a deterministic UUID from the external string
    const id = uuidv5(String(externalId), uuidv5.DNS);
    const existing = await this.findById(id);
    if (existing) return existing;
    const email = `demo+${externalId}@example.com`;
    return await this.createWithId(id, { username, email, auth_type: 'demo' });
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Update user's last login time
  static async updateLastLogin(id) {
    const sql = `
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Get user statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN last_login_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as active_users_7d,
        COUNT(CASE WHEN auth_type = 'passkey' THEN 1 END) as passkey_users,
        COUNT(CASE WHEN auth_type = 'password' THEN 1 END) as password_users,
        COUNT(CASE WHEN auth_type = 'demo' THEN 1 END) as demo_users
      FROM users 
      WHERE is_active = true
    `;
    const result = await query(sql);
    return result.rows[0];
  }

  // Get users with pagination
  static async getAll(limit = 10, offset = 0) {
    const sql = `
      SELECT id, username, email, auth_type, created_at, last_login_at
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Deactivate user
  static async deactivate(id) {
    const sql = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Update user
  static async update(id, updateData) {
    const { username, email, auth_type } = updateData;
    const sql = `
      UPDATE users 
      SET username = COALESCE($2, username),
          email = COALESCE($3, email),
          auth_type = COALESCE($4, auth_type),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;
    const result = await query(sql, [id, username, email, auth_type]);
    return result.rows[0];
  }
}

module.exports = User;

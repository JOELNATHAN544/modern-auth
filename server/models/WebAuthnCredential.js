const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WebAuthnCredential {
  // Create a new WebAuthn credential
  static async create(credentialData) {
    const { 
      user_id, 
      credential_id, 
      public_key, 
      counter = 0, 
      transports = [] 
    } = credentialData;
    
    const sql = `
      INSERT INTO webauthn_credentials (id, user_id, credential_id, public_key, counter, transports)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const credentialUuid = uuidv4();
    const result = await query(sql, [
      credentialUuid, 
      user_id, 
      credential_id, 
      public_key, 
      counter, 
      transports
    ]);
    return result.rows[0];
  }

  // Find credential by credential ID
  static async findByCredentialId(credentialId) {
    const sql = `
      SELECT wc.*, u.email, u.username 
      FROM webauthn_credentials wc
      JOIN users u ON wc.user_id = u.id
      WHERE wc.credential_id = $1 AND wc.is_active = true
    `;
    const result = await query(sql, [credentialId]);
    return result.rows[0] || null;
  }

  // Get all credentials for a user
  static async findByUserId(userId) {
    const sql = `
      SELECT * FROM webauthn_credentials 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }

  // Update credential counter
  static async updateCounter(credentialId, newCounter) {
    const sql = `
      UPDATE webauthn_credentials 
      SET counter = $2, last_used_at = CURRENT_TIMESTAMP
      WHERE credential_id = $1 AND is_active = true
      RETURNING *
    `;
    const result = await query(sql, [credentialId, newCounter]);
    return result.rows[0];
  }

  // Deactivate credential
  static async deactivate(credentialId) {
    const sql = `
      UPDATE webauthn_credentials 
      SET is_active = false
      WHERE credential_id = $1
      RETURNING *
    `;
    const result = await query(sql, [credentialId]);
    return result.rows[0];
  }

  // Get credential statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_credentials,
        COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_credentials_30d,
        COUNT(CASE WHEN last_used_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as active_credentials_7d,
        AVG(counter) as avg_counter,
        MAX(counter) as max_counter
      FROM webauthn_credentials 
      WHERE is_active = true
    `;
    const result = await query(sql);
    return result.rows[0];
  }

  // Get credentials with pagination
  static async getAll(limit = 10, offset = 0) {
    const sql = `
      SELECT wc.*, u.email, u.username
      FROM webauthn_credentials wc
      JOIN users u ON wc.user_id = u.id
      WHERE wc.is_active = true
      ORDER BY wc.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Delete old unused credentials
  static async cleanupOldCredentials(daysOld = 90) {
    const sql = `
      UPDATE webauthn_credentials 
      SET is_active = false
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      AND last_used_at IS NULL
      RETURNING id
    `;
    const result = await query(sql);
    return result.rows.length;
  }
}

module.exports = WebAuthnCredential;

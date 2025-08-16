const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Transaction {
  // Create a new transaction
  static async create(transactionData) {
    const {
      user_id,
      amount,
      currency = "EUR",
      description,
      ip_address,
      user_agent,
    } = transactionData;

    const requiresStepup =
      parseFloat(amount) > parseFloat(process.env.PSD3_THRESHOLD || 150);

    const sql = `
      INSERT INTO transactions (id, user_id, amount, currency, description, requires_stepup, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const transactionId = uuidv4();
    const result = await query(sql, [
      transactionId,
      user_id,
      amount,
      currency,
      description,
      requiresStepup,
      ip_address,
      user_agent,
    ]);
    return result.rows[0];
  }

  // Find transaction by ID
  static async findById(id) {
    const sql = `
      SELECT t.*, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Get transactions for a user
  static async findByUserId(userId, limit = 10, offset = 0) {
    const sql = `
      SELECT * FROM transactions 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [userId, limit, offset]);
    return result.rows;
  }

  // Update transaction status
  static async updateStatus(id, status) {
    const sql = `
      UPDATE transactions 
      SET status = $2::varchar, 
          completed_at = CASE WHEN $2::varchar = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id, status]);
    return result.rows[0];
  }

  // Mark step-up as completed
  static async markStepupCompleted(id) {
    const sql = `
      UPDATE transactions 
      SET stepup_completed = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Get transaction statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN requires_stepup = true THEN 1 END) as stepup_required,
        COUNT(CASE WHEN stepup_completed = true THEN 1 END) as stepup_completed,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount,
        MAX(amount) as max_amount,
        MIN(amount) as min_amount
      FROM transactions
    `;
    const result = await query(sql);
    return result.rows[0];
  }

  // Get transactions with pagination
  static async getAll(limit = 10, offset = 0) {
    const sql = `
      SELECT t.*, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Get transactions by status
  static async getByStatus(status, limit = 10, offset = 0) {
    const sql = `
      SELECT t.*, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [status, limit, offset]);
    return result.rows;
  }

  // Get high-value transactions (requiring step-up)
  static async getHighValueTransactions(limit = 10, offset = 0) {
    const sql = `
      SELECT t.*, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.requires_stepup = true
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Get transaction volume by date range
  static async getVolumeByDateRange(startDate, endDate) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN requires_stepup = true THEN 1 END) as stepup_count
      FROM transactions
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  }

  // Get user transaction history
  static async getUserHistory(userId, days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN requires_stepup = true THEN 1 END) as stepup_count
      FROM transactions
      WHERE user_id = $1 
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }
}

module.exports = Transaction;

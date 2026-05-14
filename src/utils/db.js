export class Database {
  constructor(db) {
    this.db = db;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async upsertUser(telegramId, username, firstName) {
    await this.db.prepare(
      `INSERT OR IGNORE INTO users (telegram_id, username, first_name)
       VALUES (?, ?, ?)`
    ).bind(telegramId, username || '', firstName || '').run();
    return this.db.prepare(
      `SELECT * FROM users WHERE telegram_id = ?`
    ).bind(telegramId).first();
  }

  async updateExpiry(telegramId, minutes) {
    return this.db.prepare(
      `UPDATE users SET default_expiry = ? WHERE telegram_id = ?`
    ).bind(minutes, telegramId).run();
  }

  // ── Email Addresses ────────────────────────────────────────────────────────
  async emailExists(address) {
    return this.db.prepare(
      `SELECT id FROM email_addresses WHERE address = ? AND is_active = 1`
    ).bind(address).first();
  }

  async createEmail(address, telegramId, expiryMinutes) {
    const expiresAt = expiryMinutes > 0
      ? new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
      : null;
    return this.db.prepare(
      `INSERT INTO email_addresses (address, telegram_id, expires_at) VALUES (?, ?, ?)`
    ).bind(address, telegramId, expiresAt).run();
  }

  async getEmail(address) {
    return this.db.prepare(
      `SELECT * FROM email_addresses WHERE address = ? AND is_active = 1`
    ).bind(address).first();
  }

  async listEmails(telegramId) {
    const { results } = await this.db.prepare(
      `SELECT ea.*,
              (SELECT COUNT(*) FROM inbox WHERE email_address = ea.address) as total_msgs,
              (SELECT COUNT(*) FROM inbox WHERE email_address = ea.address AND is_read = 0) as unread
       FROM email_addresses ea
       WHERE ea.telegram_id = ? AND ea.is_active = 1
       ORDER BY ea.created_at DESC`
    ).bind(telegramId).all();
    return results;
  }

  async deactivateEmail(address, telegramId) {
    return this.db.prepare(
      `UPDATE email_addresses SET is_active = 0 WHERE address = ? AND telegram_id = ?`
    ).bind(address, telegramId).run();
  }

  async deactivateAllEmails(telegramId) {
    return this.db.prepare(
      `UPDATE email_addresses SET is_active = 0 WHERE telegram_id = ? AND is_active = 1`
    ).bind(telegramId).run();
  }

  async cleanupExpired() {
    const { results } = await this.db.prepare(
      `SELECT address, telegram_id FROM email_addresses
       WHERE expires_at IS NOT NULL AND expires_at < datetime('now') AND is_active = 1`
    ).all();
    if (results.length > 0) {
      await this.db.prepare(
        `UPDATE email_addresses SET is_active = 0
         WHERE expires_at IS NOT NULL AND expires_at < datetime('now') AND is_active = 1`
      ).run();
    }
    return results;
  }

  // ── Inbox ──────────────────────────────────────────────────────────────────
  async saveMessage(emailAddress, fromAddress, fromName, subject, bodyText) {
    return this.db.prepare(
      `INSERT INTO inbox (email_address, from_address, from_name, subject, body_text)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(emailAddress, fromAddress, fromName || '', subject || '(no subject)', bodyText || '').run();
  }

  async getInbox(telegramId, emailFilter = null) {
    let sql = `SELECT i.* FROM inbox i
               JOIN email_addresses ea ON i.email_address = ea.address
               WHERE ea.telegram_id = ?`;
    const params = [telegramId];
    if (emailFilter) { sql += ` AND i.email_address = ?`; params.push(emailFilter); }
    sql += ` ORDER BY i.received_at DESC LIMIT 20`;
    const { results } = await this.db.prepare(sql).bind(...params).all();
    return results;
  }

  async getMessage(id, telegramId) {
    const msg = await this.db.prepare(
      `SELECT i.* FROM inbox i
       JOIN email_addresses ea ON i.email_address = ea.address
       WHERE i.id = ? AND ea.telegram_id = ?`
    ).bind(id, telegramId).first();
    if (msg) {
      await this.db.prepare(`UPDATE inbox SET is_read = 1 WHERE id = ?`).bind(id).run();
    }
    return msg;
  }

  async deleteMessage(id, telegramId) {
    return this.db.prepare(
      `DELETE FROM inbox WHERE id = ? AND email_address IN
       (SELECT address FROM email_addresses WHERE telegram_id = ?)`
    ).bind(id, telegramId).run();
  }

  async clearInbox(emailAddress, telegramId) {
    return this.db.prepare(
      `DELETE FROM inbox WHERE email_address = ? AND email_address IN
       (SELECT address FROM email_addresses WHERE telegram_id = ?)`
    ).bind(emailAddress, telegramId).run();
  }

  // ── Blocked Senders ────────────────────────────────────────────────────────
  async blockSender(telegramId, senderEmail) {
    return this.db.prepare(
      `INSERT OR IGNORE INTO blocked_senders (telegram_id, sender_email) VALUES (?, ?)`
    ).bind(telegramId, senderEmail.toLowerCase()).run();
  }

  async isBlocked(telegramId, senderEmail) {
    return this.db.prepare(
      `SELECT id FROM blocked_senders WHERE telegram_id = ? AND sender_email = ?`
    ).bind(telegramId, senderEmail.toLowerCase()).first();
  }

  async listBlocked(telegramId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM blocked_senders WHERE telegram_id = ? ORDER BY created_at DESC`
    ).bind(telegramId).all();
    return results;
  }

  async unblockSender(telegramId, senderEmail) {
    return this.db.prepare(
      `DELETE FROM blocked_senders WHERE telegram_id = ? AND sender_email = ?`
    ).bind(telegramId, senderEmail.toLowerCase()).run();
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  async getStats(telegramId) {
    const [active, total, unread, allMsg, blocked] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) as c FROM email_addresses WHERE telegram_id = ? AND is_active = 1`).bind(telegramId).first(),
      this.db.prepare(`SELECT COUNT(*) as c FROM email_addresses WHERE telegram_id = ?`).bind(telegramId).first(),
      this.db.prepare(`SELECT COUNT(*) as c FROM inbox i JOIN email_addresses ea ON i.email_address = ea.address WHERE ea.telegram_id = ? AND i.is_read = 0`).bind(telegramId).first(),
      this.db.prepare(`SELECT COUNT(*) as c FROM inbox i JOIN email_addresses ea ON i.email_address = ea.address WHERE ea.telegram_id = ?`).bind(telegramId).first(),
      this.db.prepare(`SELECT COUNT(*) as c FROM blocked_senders WHERE telegram_id = ?`).bind(telegramId).first(),
    ]);
    return {
      activeEmails: active?.c || 0,
      totalEmails: total?.c || 0,
      unreadMessages: unread?.c || 0,
      totalMessages: allMsg?.c || 0,
      blockedSenders: blocked?.c || 0,
    };
  }
}

export class TelegramAPI {
  constructor(token) {
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
  }

  async call(method, body = {}) {
    const res = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  sendMessage(chatId, text, extra = {}) {
    return this.call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
  }

  editMessage(chatId, messageId, text, extra = {}) {
    return this.call('editMessageText', {
      chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra,
    });
  }

  answerCallback(queryId, text = '', alert = false) {
    return this.call('answerCallbackQuery', {
      callback_query_id: queryId, text, show_alert: alert,
    });
  }

  setWebhook(url, secret) {
    return this.call('setWebhook', { url, secret_token: secret, allowed_updates: ['message', 'callback_query'] });
  }

  deleteWebhook() {
    return this.call('deleteWebhook');
  }

  getMe() {
    return this.call('getMe');
  }
}

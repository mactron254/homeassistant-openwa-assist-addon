'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { BOT_DATA_DIR } = require('./options');

class ConversationStore {
  constructor(options, filePath = path.join(BOT_DATA_DIR, 'assist-conversations.json')) {
    this.options = options;
    this.filePath = filePath;
  }

  get(sender) {
    const data = this.read();
    const item = data[sender];
    if (!item) return null;
    if (Date.now() - Number(item.updatedAt || 0) > this.ttlMs()) {
      delete data[sender];
      this.write(data);
      return null;
    }
    return item;
  }

  setConversation(sender, conversationId) {
    if (!conversationId) return;
    const data = this.read();
    data[sender] = { ...(data[sender] || {}), conversation_id: conversationId, updatedAt: Date.now() };
    this.write(data);
  }

  setPending(sender, pending) {
    const data = this.read();
    data[sender] = { ...(data[sender] || {}), pending: { ...pending, updatedAt: Date.now() }, updatedAt: Date.now() };
    this.write(data);
  }

  consumePending(sender) {
    const data = this.read();
    const pending = data[sender]?.pending || null;
    if (data[sender]) {
      delete data[sender].pending;
      data[sender].updatedAt = Date.now();
      this.write(data);
    }
    return pending;
  }

  read() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch {
      return {};
    }
  }

  write(value) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(value, null, 2));
  }

  ttlMs() {
    return Math.max(1, Number(this.options.assist?.conversation_ttl_hours || 24)) * 3_600_000;
  }
}

module.exports = { ConversationStore };


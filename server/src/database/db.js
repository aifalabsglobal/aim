import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chat.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT DEFAULT 'New Conversation',
    model TEXT DEFAULT 'glm-4.7-flash',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    thinking TEXT,
    thinking_duration REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
  );
`);

export async function getAllConversations() {
  return db.prepare(`
    SELECT id, title, model, created_at as createdAt, updated_at as updatedAt
    FROM conversations ORDER BY updated_at DESC
  `).all();
}

export async function getConversationById(id) {
  const conversation = db.prepare(`
    SELECT id, title, model, created_at as createdAt, updated_at as updatedAt
    FROM conversations WHERE id = ?
  `).get(id);
  if (!conversation) return null;
  const messages = db.prepare(`
    SELECT id, conversation_id as conversationId, role, content, thinking,
           thinking_duration as thinkingDuration, created_at as createdAt
    FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(id);
  const getAttachments = db.prepare(`
    SELECT id, message_id as messageId, filename, original_name as originalName,
           mimetype, size, path, created_at as createdAt
    FROM attachments WHERE message_id = ?
  `);
  for (const msg of messages) msg.attachments = getAttachments.all(msg.id);
  return { ...conversation, messages };
}

export async function createConversation(dataOrId, title, model) {
  const id = (typeof dataOrId === 'object' ? uuidv4() : dataOrId) || uuidv4();
  const t = (typeof dataOrId === 'object' && dataOrId.title) || title || 'New Conversation';
  const m = (typeof dataOrId === 'object' && dataOrId.model) || model || 'glm-4.7-flash';
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO conversations (id, title, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, t, m, now, now);
  return { id, title: t, model: m, createdAt: now, updatedAt: now, messages: [] };
}

export async function updateConversation(id, data) {
  const now = new Date().toISOString();
  const updates = [];
  const values = [];
  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.model !== undefined) { updates.push('model = ?'); values.push(data.model); }
  updates.push('updated_at = ?'); values.push(now); values.push(id);
  db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getConversationById(id);
}

export async function deleteConversation(id) {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return { success: true };
}

export async function addMessage(conversationId, message) {
  const id = message.id || uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, thinking, thinking_duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, conversationId, message.role, message.content, message.thinking || null, message.thinking_duration || null, now);
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);
  if (message.attachments && message.attachments.length > 0) {
    const insertAttachment = db.prepare(`
      INSERT INTO attachments (id, message_id, filename, original_name, mimetype, size, path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const att of message.attachments) {
      const attPath = att.path || att.url;
      if (!attPath) continue;
      insertAttachment.run(att.id || uuidv4(), id, att.filename, att.originalName, att.mimetype, att.size, attPath, now);
    }
  }
  return { id, conversationId, role: message.role, content: message.content, createdAt: now };
}

export async function deleteMessage(conversationId, messageId) {
  db.prepare('DELETE FROM attachments WHERE message_id = ?').run(messageId);
  db.prepare('DELETE FROM messages WHERE id = ? AND conversation_id = ?').run(messageId, conversationId);
  return { success: true };
}

export async function deleteMessageAndSubsequent(conversationId, messageId) {
  await deleteMessage(conversationId, messageId);
  return true;
}

export async function initializeDatabase() {
  return true;
}

export default db;

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chat.db');
console.log(`📁 [Database] Path: ${dbPath}`);

// Create better-sqlite3 database connection
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize schema
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

console.log('✅ [Database] Schema initialized');

// ============= Conversation Operations =============

export async function getAllConversations() {
  const rows = db.prepare(`
        SELECT id, title, model, created_at as createdAt, updated_at as updatedAt
        FROM conversations 
        ORDER BY updated_at DESC
    `).all();
  return rows;
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
        FROM messages 
        WHERE conversation_id = ?
        ORDER BY created_at ASC
    `).all(id);

  // Get attachments for each message
  const getAttachments = db.prepare(`
        SELECT id, message_id as messageId, filename, original_name as originalName,
               mimetype, size, path, created_at as createdAt
        FROM attachments WHERE message_id = ?
    `);

  for (const msg of messages) {
    msg.attachments = getAttachments.all(msg.id);
  }

  return { ...conversation, messages };
}

export async function createConversation(data = {}) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
        INSERT INTO conversations (id, title, model, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, data.title || 'New Conversation', data.model || 'glm-4.7-flash', now, now);

  return { id, title: data.title || 'New Conversation', model: data.model || 'glm-4.7-flash', createdAt: now, updatedAt: now, messages: [] };
}

export async function updateConversation(id, data) {
  const now = new Date().toISOString();
  const updates = [];
  const values = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.model !== undefined) {
    updates.push('model = ?');
    values.push(data.model);
  }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getConversationById(id);
}

export async function deleteConversation(id) {
  // Delete messages first (cascade doesn't always work in SQLite)
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return { success: true };
}

// ============= Message Operations =============

export async function addMessage(conversationId, message) {
  const id = message.id || uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, thinking, thinking_duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, conversationId, message.role, message.content, message.thinking || null, message.thinking_duration || null, now);

  // Update conversation's updated_at
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);

  // Handle attachments if any
  if (message.attachments && message.attachments.length > 0) {
    console.log('📎 [DB] Attachments received:', JSON.stringify(message.attachments, null, 2));
    const insertAttachment = db.prepare(`
            INSERT INTO attachments (id, message_id, filename, original_name, mimetype, size, path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
    for (const att of message.attachments) {
      console.log('📎 [DB] Processing attachment:', att);
      const attPath = att.path || att.url; // Support both 'path' and 'url' fields
      if (!attPath) {
        console.warn('Attachment missing path/url:', att);
        continue; // Skip invalid attachments
      }
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

// ============= Database Initialization =============

export async function initializeDatabase() {
  // Database is already initialized in the module body
  console.log('✅ Database ready');
  return true;
}

export default db;

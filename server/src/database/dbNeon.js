/**
 * Neon (PostgreSQL) database layer for Vercel serverless.
 * Set DATABASE_URL to your Neon connection string (postgres://...) in Vercel.
 */
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL);
let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) return;
  await initializeDatabase();
  schemaInitialized = true;
}

export async function getAllConversations() {
  await ensureSchema();
  const rows = await sql`
    SELECT id, title, model, created_at as "createdAt", updated_at as "updatedAt"
    FROM conversations
    ORDER BY updated_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    model: r.model,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }));
}

export async function getConversationById(id) {
  await ensureSchema();
  const [conversation] = await sql`
    SELECT id, title, model, created_at as "createdAt", updated_at as "updatedAt"
    FROM conversations WHERE id = ${id}
  `;
  if (!conversation) return null;

  const messages = await sql`
    SELECT id, conversation_id as "conversationId", role, content, thinking,
           thinking_duration as "thinkingDuration", created_at as "createdAt"
    FROM messages WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `;

  for (const msg of messages) {
    const attachments = await sql`
      SELECT id, message_id as "messageId", filename, original_name as "originalName",
             mimetype, size, path, created_at as "createdAt"
      FROM attachments WHERE message_id = ${msg.id}
    `;
    msg.attachments = attachments;
  }

  return { ...conversation, messages };
}

export async function createConversation(data = {}) {
  await ensureSchema();
  const id = uuidv4();
  const title = data.title || 'New Conversation';
  const model = data.model || 'glm-4.7-flash';

  await sql`
    INSERT INTO conversations (id, title, model, created_at, updated_at)
    VALUES (${id}, ${title}, ${model}, NOW(), NOW())
  `;

  const [row] = await sql`
    SELECT id, title, model, created_at as "createdAt", updated_at as "updatedAt"
    FROM conversations WHERE id = ${id}
  `;
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messages: []
  };
}

export async function updateConversation(id, data) {
  await ensureSchema();
  const title = data.title !== undefined ? data.title : null;
  const model = data.model !== undefined ? data.model : null;
  await sql`
    UPDATE conversations
    SET title = COALESCE(${title}, title),
        model = COALESCE(${model}, model),
        updated_at = NOW()
    WHERE id = ${id}
  `;
  return getConversationById(id);
}

export async function deleteConversation(id) {
  await sql`DELETE FROM messages WHERE conversation_id = ${id}`;
  await sql`DELETE FROM conversations WHERE id = ${id}`;
  return { success: true };
}

export async function addMessage(conversationId, message) {
  await ensureSchema();
  const id = message.id || uuidv4();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO messages (id, conversation_id, role, content, thinking, thinking_duration, created_at)
    VALUES (${id}, ${conversationId}, ${message.role}, ${message.content},
            ${message.thinking || null}, ${message.thinking_duration || null}, ${now})
  `;
  await sql`UPDATE conversations SET updated_at = ${now} WHERE id = ${conversationId}`;

  if (message.attachments && message.attachments.length > 0) {
    for (const att of message.attachments) {
      const attPath = att.path || att.url;
      if (!attPath) continue;
      await sql`
        INSERT INTO attachments (id, message_id, filename, original_name, mimetype, size, path, created_at)
        VALUES (${att.id || uuidv4()}, ${id}, ${att.filename || att.originalName}, ${att.originalName || att.filename},
                ${att.mimetype}, ${att.size}, ${attPath}, ${now})
      `;
    }
  }

  return { id, conversationId, role: message.role, content: message.content, createdAt: now };
}

export async function deleteMessage(conversationId, messageId) {
  await sql`DELETE FROM attachments WHERE message_id = ${messageId}`;
  await sql`DELETE FROM messages WHERE id = ${messageId} AND conversation_id = ${conversationId}`;
  return { success: true };
}

export async function deleteMessageAndSubsequent(conversationId, messageId) {
  await deleteMessage(conversationId, messageId);
  return true;
}

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT 'New Conversation',
      model TEXT DEFAULT 'glm-4.7-flash',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      thinking TEXT,
      thinking_duration REAL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ [Neon] Database ready');
  return true;
}

export default { sql };

/**
 * Database router: uses Neon (Postgres) on Vercel, SQLite locally.
 * Set DATABASE_URL to a postgres://... URL (e.g. Neon) for Vercel.
 */
const useNeon =
  process.env.VERCEL === '1' ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

const mod = await (useNeon ? import('./dbNeon.js') : import('./dbSqlite.js'));

export const getAllConversations = mod.getAllConversations;
export const getConversationById = mod.getConversationById;
export const createConversation = mod.createConversation;
export const updateConversation = mod.updateConversation;
export const deleteConversation = mod.deleteConversation;
export const addMessage = mod.addMessage;
export const deleteMessage = mod.deleteMessage;
export const deleteMessageAndSubsequent = mod.deleteMessageAndSubsequent;
export const initializeDatabase = mod.initializeDatabase;
export default mod.default;

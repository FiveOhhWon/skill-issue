/**
 * In-memory session store — same pattern as Slack bot's thread-based sessions.
 */

export interface Session {
  id: string;
  agentSessionId?: string;
  createdAt: Date;
  lastActiveAt: Date;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  skillOutput?: {
    type: string;
    data: unknown;
  };
}

const sessions = new Map<string, Session>();

const MAX_SESSIONS = 100;

function evictOldest() {
  if (sessions.size <= MAX_SESSIONS) return;
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, session] of sessions) {
    const time = session.lastActiveAt.getTime();
    if (time < oldestTime) {
      oldestTime = time;
      oldestKey = key;
    }
  }
  if (oldestKey) sessions.delete(oldestKey);
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function getOrCreateSession(id: string): Session {
  let session = sessions.get(id);
  if (!session) {
    session = {
      id,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      messages: [],
    };
    sessions.set(id, session);
    evictOldest();
  }
  return session;
}

export function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "timestamp">
): ChatMessage {
  const session = getOrCreateSession(sessionId);
  const msg: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  session.messages.push(msg);
  session.lastActiveAt = new Date();
  return msg;
}

export function getAllSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
  );
}

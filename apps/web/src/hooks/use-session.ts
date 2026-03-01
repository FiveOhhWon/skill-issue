"use client";

import { useState, useEffect } from "react";

const SESSION_KEY = "skill-issue-session-id";

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
  }, []);

  return { sessionId };
}


/**
 * SessionService
 * Handles user session persistence (Middleware).
 */
export class SessionService {
  private static SESSION_KEY = 'opspulse_active_session_v4';

  static startSession(username: string, role: string): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      username,
      role,
      loginTime: new Date().toISOString()
    }));
    // Also set legacy key for App compatibility
    localStorage.setItem('opspulse_user', username);
    localStorage.setItem('opspulse_role', role);
  }

  static endSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('opspulse_user');
    localStorage.removeItem('opspulse_role');
  }

  static getActiveSession(): { username: string; role: string } | null {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }
}

/**
 * SessionService
 * Handles user session persistence (Middleware).
 */
export class SessionService {
  private static SESSION_KEY = 'opspulse_active_session_v4';

  static startSession(email: string, role: string, userId: string): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      email,
      role,
      userId,
      loginTime: new Date().toISOString()
    }));
    // Also set legacy keys for App compatibility
    localStorage.setItem('opspulse_user', email);
    localStorage.setItem('opspulse_role', role);
    localStorage.setItem('opspulse_userId', userId);
  }

  static endSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('opspulse_user');
    localStorage.removeItem('opspulse_role');
    localStorage.removeItem('opspulse_userId');
  }

  static getActiveSession(): { email: string; role: string; userId: string } | null {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }
}
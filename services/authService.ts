
import { OpsDB } from './dbService';

/**
 * AuthService
 * Handles Authentication Business Logic with Role and Status validation.
 * Acts as the secure "Backend" API Route handler.
 */
export class AuthService {
  /**
   * Authenticates a user.
   */
  static async login(username: string, passwordPlain: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const user = await OpsDB.findUser(username);
    
    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const inputHash = await OpsDB.hashString(passwordPlain);
    
    // Check password first
    if (user.password !== inputHash) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // Check status if password is correct
    if (user.status === 'suspended') {
      return { 
        success: false, 
        error: 'Your account is suspended. Please contact admin.' 
      };
    }

    return { 
      success: true, 
      user: { 
        username, 
        role: user.role, 
        avatarUrl: user.avatarUrl,
        status: user.status
      } 
    };
  }

  /**
   * Secure Password Update "API Route"
   * Verifies current password, hashes new password, and enforces RBAC via OpsDB.
   */
  static async changePassword(username: string, currentPlain: string, newPlain: string, requesterRole: string): Promise<{ success: boolean; error?: string }> {
    const user = await OpsDB.findUser(username);
    if (!user) return { success: false, error: 'User record missing.' };

    // 1. Verify Current Password
    const currentHash = await OpsDB.hashString(currentPlain);
    if (user.password !== currentHash) {
      return { success: false, error: 'Current password verification failed.' };
    }

    // 2. Hash New Password (Simulating bcrypt logic)
    const newHash = await OpsDB.hashString(newPlain);
    
    try {
      // 3. Commit to database with requester role for RBAC check
      await OpsDB.updateUser(username, { password: newHash }, requesterRole);
      return { success: true };
    } catch (e: any) {
      // 4. Handle middleware RBAC violations or DB failures
      return { success: false, error: e.message || 'Critical database failure.' };
    }
  }
}

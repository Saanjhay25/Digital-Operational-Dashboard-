
/**
 * OpsDB Service
 * Acts as the Data Access Layer (DAL) / Database Engine.
 * Simulates a MySQL-like persistent storage system with RBAC enforcement.
 */

export class OpsDB {
  private static STORAGE_KEY = 'opspulse_db_persistent_v6';
  private static _store: any = null;

  private static async getStore(): Promise<any> {
    if (this._store) return this._store;
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      return await this.initializeDefaultStore();
    }
    
    try {
      this._store = JSON.parse(data);
      return this._store;
    } catch (e) {
      console.error("[OpsDB] Data corruption detected. Re-initializing.");
      return await this.initializeDefaultStore();
    }
  }

  private static async commit(): Promise<void> {
    if (!this._store) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._store));
  }

  /**
   * Simulated Hashing Logic
   * In a real environment, this would use bcrypt on a Node.js server.
   * Here we use SHA-256 via Web Crypto API for secure browser-based hashing.
   */
  public static async hashString(input: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async initializeDefaultStore() {
    console.log("[OpsDB] Initializing fresh database schema...");
    const adminHash = await this.hashString('password123');
    const operatorHash = await this.hashString('operator123');

    this._store = {
      users: {
        admin: { password: adminHash, role: 'admin', status: 'active', avatarUrl: null },
        operator: { password: operatorHash, role: 'operator', status: 'active', avatarUrl: null }
      },
      incidents: [
        { id: 'INC-402', title: 'Postgres Connection Pool Exhausted', severity: 'critical', status: 'resolved', timestamp: new Date().toISOString() },
        { id: 'INC-403', title: 'API Gateway High Latency', severity: 'high', status: 'active', timestamp: new Date().toISOString() }
      ],
      config: {
        created_at: new Date().toISOString(),
        db_version: '6.0.0'
      }
    };
    
    await this.commit();
    return this._store;
  }

  static async findUser(username: string): Promise<any | null> {
    const store = await this.getStore();
    const user = store.users[username];
    return user ? { ...user } : null;
  }

  /**
   * Updates a user record with strict "Backend" RBAC enforcement.
   * This acts as the Middleware Protection layer.
   */
  static async updateUser(username: string, updates: any, requesterRole: string = 'operator'): Promise<void> {
    // SECURITY ENFORCEMENT: Middleware logic
    if (requesterRole !== 'admin') {
      const forbiddenKeys = ['username', 'role', 'status'];
      const attemptToModifyForbidden = Object.keys(updates).some(key => forbiddenKeys.includes(key));

      // Operators can ONLY update 'password' and 'avatarUrl'
      if (attemptToModifyForbidden) {
        throw new Error("RBAC Violation: Operators are not permitted to modify identity fields (username, role, status).");
      }
      
      const allowedKeys = ['password', 'avatarUrl'];
      const hasUnauthorizedKeys = Object.keys(updates).some(key => !allowedKeys.includes(key));
      
      if (hasUnauthorizedKeys) {
        throw new Error("RBAC Violation: Unauthorized modification attempt intercepted.");
      }
    }

    const store = await this.getStore();
    if (store.users[username]) {
      store.users[username] = { ...store.users[username], ...updates };
      await this.commit();
    } else {
      throw new Error(`Identity "${username}" not found in database.`);
    }
  }

  static async toggleStatus(username: string, requesterRole: string): Promise<void> {
    if (requesterRole !== 'admin') {
      throw new Error("RBAC Violation: Status management is restricted to administrators.");
    }
    const store = await this.getStore();
    if (store.users[username]) {
      const current = store.users[username].status;
      store.users[username].status = current === 'active' ? 'suspended' : 'active';
      await this.commit();
    }
  }

  static async listAllUsers(): Promise<any[]> {
    const store = await this.getStore();
    return Object.entries(store.users).map(([username, data]: [string, any]) => ({
      username,
      ...data
    }));
  }

  static async addUser(username: string, userData: any, requesterRole: string): Promise<void> {
    if (requesterRole !== 'admin') {
      throw new Error("RBAC Violation: Identity provisioning is restricted to administrators.");
    }
    const store = await this.getStore();
    store.users[username] = { ...userData, status: 'active' };
    await this.commit();
  }

  static async deleteUser(username: string, requesterRole: string): Promise<void> {
    if (requesterRole !== 'admin') {
      throw new Error("RBAC Violation: Identity deletion is restricted to administrators.");
    }
    const store = await this.getStore();
    if (store.users[username]) {
      delete store.users[username];
      await this.commit();
    }
  }
}

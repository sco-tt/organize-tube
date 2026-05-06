import Database from '@tauri-apps/plugin-sql';

class DatabaseService {
  private db: Database | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await Database.load('sqlite:segment_studio.db');
      // Tables are created via Tauri migrations, not here
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }


  async executeQuery<T>(query: string, params?: any[]): Promise<T[]> {
    await this.ensureInitialized();
    try {
      const result = await this.db!.select<T[]>(query, params || []);
      return result;
    } catch (error) {
      console.error('Query error:', query, params, error);
      throw error;
    }
  }

  async executeNonQuery(query: string, params?: any[]): Promise<number> {
    await this.ensureInitialized();
    try {
      const result = await this.db!.execute(query, params || []);
      return result.rowsAffected;
    } catch (error) {
      console.error('Execute error:', query, params, error);
      throw error;
    }
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    await this.ensureInitialized();

    await this.executeNonQuery('BEGIN TRANSACTION');
    try {
      const result = await operations();
      await this.executeNonQuery('COMMIT');
      return result;
    } catch (error) {
      await this.executeNonQuery('ROLLBACK');
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const databaseService = new DatabaseService();
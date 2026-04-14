import Database from '@tauri-apps/plugin-sql';

class DatabaseService {
  private db: Database | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await Database.load('sqlite:segment_studio.db');
      await this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Create song_routines table
    await this.executeNonQuery(`
      CREATE TABLE IF NOT EXISTS song_routines (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        url_source TEXT NOT NULL DEFAULT 'youtube',
        title TEXT,
        artist TEXT,
        duration INTEGER,
        name TEXT,
        notes TEXT,
        freeform_notes TEXT,
        volume INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_practiced TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create loop_segments table
    await this.executeNonQuery(`
      CREATE TABLE IF NOT EXISTS loop_segments (
        id TEXT PRIMARY KEY,
        song_routine_id TEXT,
        name TEXT NOT NULL,
        start_time REAL NOT NULL,
        end_time REAL NOT NULL,
        default_speed REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE
      )
    `);

    // Create tags table
    await this.executeNonQuery(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create routine_tags junction table
    await this.executeNonQuery(`
      CREATE TABLE IF NOT EXISTS routine_tags (
        routine_id TEXT,
        tag_id TEXT,
        PRIMARY KEY (routine_id, tag_id),
        FOREIGN KEY (routine_id) REFERENCES song_routines(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await this.executeNonQuery(`
      CREATE INDEX IF NOT EXISTS idx_song_routines_url ON song_routines(url)
    `);
    await this.executeNonQuery(`
      CREATE INDEX IF NOT EXISTS idx_loop_segments_routine ON loop_segments(song_routine_id)
    `);
    await this.executeNonQuery(`
      CREATE INDEX IF NOT EXISTS idx_routine_tags_routine ON routine_tags(routine_id)
    `);

    console.log('Database tables created successfully');
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
import { databaseService } from '../services/databaseService';

export interface LoopSegment {
  id: string;
  song_routine_id?: string;
  name: string;
  start_time: number;
  end_time: number;
  default_speed: number;
  created_at: string;
  order_index: number;
}

export interface CreateLoopSegment {
  song_routine_id?: string;
  name: string;
  start_time: number;
  end_time: number;
  default_speed?: number;
  order_index?: number;
}

export class LoopSegmentRepository {
  async create(segment: CreateLoopSegment): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await databaseService.executeNonQuery(
      `INSERT INTO loop_segments
       (id, song_routine_id, name, start_time, end_time, default_speed, created_at, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        segment.song_routine_id || null,
        segment.name,
        segment.start_time,
        segment.end_time,
        segment.default_speed || 1.0,
        now,
        segment.order_index || 0,
      ]
    );

    return id;
  }

  async findAll(): Promise<LoopSegment[]> {
    return await databaseService.executeQuery<LoopSegment>(
      `SELECT * FROM loop_segments ORDER BY created_at DESC`
    );
  }

  async findById(id: string): Promise<LoopSegment | null> {
    const results = await databaseService.executeQuery<LoopSegment>(
      `SELECT * FROM loop_segments WHERE id = ?`,
      [id]
    );
    return results[0] || null;
  }

  async findByRoutineId(routineId: string): Promise<LoopSegment[]> {
    return await databaseService.executeQuery<LoopSegment>(
      `SELECT * FROM loop_segments WHERE song_routine_id = ? ORDER BY order_index, created_at`,
      [routineId]
    );
  }

  async findStandalone(): Promise<LoopSegment[]> {
    return await databaseService.executeQuery<LoopSegment>(
      `SELECT * FROM loop_segments WHERE song_routine_id IS NULL ORDER BY created_at DESC`
    );
  }

  async update(id: string, updates: Partial<LoopSegment>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return;

    values.push(id);

    await databaseService.executeNonQuery(
      `UPDATE loop_segments SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id: string): Promise<void> {
    await databaseService.executeNonQuery(
      `DELETE FROM loop_segments WHERE id = ?`,
      [id]
    );
  }

  async deleteByRoutineId(routineId: string): Promise<void> {
    await databaseService.executeNonQuery(
      `DELETE FROM loop_segments WHERE song_routine_id = ?`,
      [routineId]
    );
  }

  async reorderSegments(routineId: string, segmentOrders: { id: string; order_index: number }[]): Promise<void> {
    await databaseService.transaction(async () => {
      for (const { id, order_index } of segmentOrders) {
        await databaseService.executeNonQuery(
          `UPDATE loop_segments SET order_index = ? WHERE id = ? AND song_routine_id = ?`,
          [order_index, id, routineId]
        );
      }
    });
  }

  async getNextOrderIndex(routineId?: string): Promise<number> {
    const query = routineId
      ? `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM loop_segments WHERE song_routine_id = ?`
      : `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM loop_segments WHERE song_routine_id IS NULL`;

    const params = routineId ? [routineId] : [];
    const result = await databaseService.executeQuery<{ next_order: number }>(query, params);
    return result[0]?.next_order || 0;
  }
}
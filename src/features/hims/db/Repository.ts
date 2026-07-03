import { supabase } from '../../../supabase';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class Repository<T extends BaseEntity> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as T;
  }

  async findAll(options?: { orderBy?: string; ascending?: boolean }): Promise<T[]> {
    let query = supabase.from(this.tableName).select('*');
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({ ...entity, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async search(column: string, query: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike(column, `%${query}%`)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return (data || []) as T[];
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }
}

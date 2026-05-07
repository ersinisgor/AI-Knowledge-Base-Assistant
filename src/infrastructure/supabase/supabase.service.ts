import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and PUBLISHABLE_KEY must be provided');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}

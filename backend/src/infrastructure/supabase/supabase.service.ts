import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // Prefer service role key (bypasses RLS for server-side operations).
    // Falls back to the anon key for local dev setups that omit the service key.
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_PUBLISHABLE_KEY) must be provided',
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseClientAny = SupabaseClient<any, any, 'public', any, any>;

@Injectable()
export class SupabaseService {
  private client: SupabaseClientAny;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and PUBLISHABLE_KEY must be provided');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    // this.client = createClient(
    //   'https://vnmdkdqllaevccjsnbhx.supabase.co',
    //   'sb_publishable_0bJox7ZU7aKRvG2fXnUhyA_AcyERj-3',
    // );
  }

  getClient(): SupabaseClientAny {
    return this.client;
  }
}

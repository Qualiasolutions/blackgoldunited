/**
 * Health Check API
 *
 * Provides system health status for monitoring and alerting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database health check failed:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Database connectivity issue',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'failed',
          api: 'ok',
        }
      }, { status: 503 });
    }

    // All checks passed
    return NextResponse.json({
      status: 'ok',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        api: 'ok',
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'unknown',
        api: 'failed',
      }
    }, { status: 500 });
  }
}
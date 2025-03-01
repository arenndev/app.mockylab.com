import { NextResponse } from 'next/server';
import * as metrics from '@/utils/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Test amaçlı olarak HTTP ve API metriklerini manuel olarak kaydet
    const startTime = Date.now();
    
    // Simüle edilmiş bir gecikme
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // HTTP isteği metriği kaydet
    await metrics.recordHttpRequest('GET', '/api/test-metrics', 200, 0.1);
    
    // API isteği metriği kaydet
    await metrics.recordApiRequest('GET', '/api/test-metrics', 200, 0.1);
    
    // Gerçek süreyi hesapla
    const duration = (Date.now() - startTime) / 1000;
    
    return NextResponse.json(
      { 
        status: 'success', 
        message: 'Test metrics recorded successfully',
        recordedMetrics: {
          http: {
            method: 'GET',
            route: '/api/test-metrics',
            statusCode: 200,
            duration: 0.1
          },
          api: {
            method: 'GET',
            endpoint: '/api/test-metrics',
            statusCode: 200,
            duration: 0.1
          },
          actual: {
            duration
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test metrics error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to record test metrics' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server'
import metrics from '@/utils/metrics'
import client from 'prom-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sağlık kontrolü sayacı
const healthCheckCounter = new client.Counter({
  name: 'health_check_total',
  help: 'Toplam sağlık kontrolü sayısı',
  labelNames: ['status'],
  registers: [metrics.register],
});

// Sağlık kontrolü süresi
const healthCheckDuration = new client.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Sağlık kontrolü süresi (saniye)',
  labelNames: ['status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [metrics.register],
});

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Sistem bilgilerini topla
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Başarılı sağlık kontrolünü kaydet
    healthCheckCounter.inc({ status: 'success' });
    const duration = (Date.now() - startTime) / 1000;
    healthCheckDuration.observe({ status: 'success' }, duration);
    
    return NextResponse.json(
      { 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        system: {
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          },
          uptime: Math.round(uptime) + 's',
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    
    // Başarısız sağlık kontrolünü kaydet
    healthCheckCounter.inc({ status: 'error' });
    const duration = (Date.now() - startTime) / 1000;
    healthCheckDuration.observe({ status: 'error' }, duration);
    
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    )
  }
} 
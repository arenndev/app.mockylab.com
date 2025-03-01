import { NextResponse } from 'next/server';
import * as metrics from '@/utils/metrics';

// Prometheus'un toplaması için metrikleri dışa aktarın
export const dynamic = 'force-dynamic'; // Metriklerin her zaman güncel olmasını sağlar
export const revalidate = 0; // Önbelleğe almayı devre dışı bırakır

export async function GET() {
  try {
    const metricsData = await metrics.getMetrics();
    const contentType = await metrics.getContentType();
    
    return new Response(metricsData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
} 
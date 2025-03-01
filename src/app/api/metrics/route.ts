import { NextResponse } from 'next/server';
import metrics from '@/utils/metrics';

// Prometheus'un toplaması için metrikleri dışa aktarın
export const dynamic = 'force-dynamic'; // Metriklerin her zaman güncel olmasını sağlar
export const revalidate = 0; // Önbelleğe almayı devre dışı bırakır

export async function GET() {
  try {
    // Prometheus metrik formatı için içerik türü başlığını ayarlayın
    return new NextResponse(await metrics.getMetrics(), {
      status: 200,
      headers: {
        'Content-Type': metrics.getContentType(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Metrik oluşturma hatası:', error);
    return NextResponse.json(
      { status: 'error', message: 'Metrik oluşturulamadı' },
      { status: 500 }
    );
  }
} 
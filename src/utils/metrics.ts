'use server'; // Bu, kodun yalnızca sunucuda çalışacağını belirtir

import { headers } from 'next/headers';

let client: any;
let register: any;
let httpRequestCounter: any;
let httpRequestDuration: any;
let apiRequestCounter: any;
let apiRequestDuration: any;
let memoryGauge: any;

// Sunucu tarafında çalıştığından emin olun
if (typeof window === 'undefined') {
  try {
    client = require('prom-client');
    
    // Singleton Registry oluştur
    register = new client.Registry();
    
    // Varsayılan metrikleri ekle (CPU, bellek kullanımı vb.)
    client.collectDefaultMetrics({ register });
    
    // HTTP istek sayacı
    httpRequestCounter = new client.Counter({
      name: 'http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });
    
    // HTTP istek süresi
    httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP istek süresi (saniye)',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register],
    });
    
    // API istek sayacı
    apiRequestCounter = new client.Counter({
      name: 'api_requests_total',
      help: 'Toplam API istek sayısı',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [register],
    });
    
    // API istek süresi
    apiRequestDuration = new client.Histogram({
      name: 'api_request_duration_seconds',
      help: 'API istek süresi (saniye)',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [register],
    });
    
    // Bellek kullanımı
    memoryGauge = new client.Gauge({
      name: 'nodejs_memory_usage_bytes',
      help: 'Node.js bellek kullanımı (byte)',
      labelNames: ['type'],
      registers: [register],
      collect() {
        const memoryUsage = process.memoryUsage();
        this.set({ type: 'rss' }, memoryUsage.rss);
        this.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
        this.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
        this.set({ type: 'external' }, memoryUsage.external);
      },
    });
  } catch (error) {
    console.error('Metrics initialization error:', error);
  }
}

// HTTP istekleri için metrikler
export async function recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
  if (typeof window === 'undefined' && httpRequestCounter && httpRequestDuration) {
    try {
      httpRequestCounter.inc({ method, route, status_code: statusCode });
      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    } catch (error) {
      console.error('Error recording HTTP request metrics:', error);
    }
  }
}

// API istekleri için metrikler
export async function recordApiRequest(method: string, endpoint: string, statusCode: number, duration: number) {
  if (typeof window === 'undefined' && apiRequestCounter && apiRequestDuration) {
    try {
      apiRequestCounter.inc({ method, endpoint, status_code: statusCode });
      apiRequestDuration.observe({ method, endpoint, status_code: statusCode }, duration);
    } catch (error) {
      console.error('Error recording API request metrics:', error);
    }
  }
}

// Prometheus için metrik çıktısı
export async function getMetrics() {
  if (typeof window === 'undefined' && register) {
    try {
      return await register.metrics();
    } catch (error) {
      console.error('Error getting metrics:', error);
      return '';
    }
  }
  return '';
}

// Content type
export async function getContentType() {
  if (typeof window === 'undefined' && register) {
    return register.contentType;
  }
  return 'text/plain';
}

// Registry'ye erişim için yardımcı fonksiyon
export async function getRegistry() {
  if (typeof window === 'undefined') {
    return register;
  }
  return null;
} 
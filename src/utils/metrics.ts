'use server'; // Bu, kodun yalnızca sunucuda çalışacağını belirtir

let metrics: any = {
  recordHttpRequest: () => {},
  recordApiRequest: () => {},
  getMetrics: async () => '',
  getContentType: () => 'text/plain',
  register: {},
};

// Sunucu tarafında çalıştığından emin olun
if (typeof window === 'undefined') {
  try {
    const client = require('prom-client');
    
    // Singleton Registry oluştur
    const register = new client.Registry();
    
    // Varsayılan metrikleri ekle (CPU, bellek kullanımı vb.)
    client.collectDefaultMetrics({ register });
    
    // HTTP istek sayacı
    const httpRequestCounter = new client.Counter({
      name: 'http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });
    
    // HTTP istek süresi
    const httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP istek süresi (saniye)',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register],
    });
    
    // API istek sayacı
    const apiRequestCounter = new client.Counter({
      name: 'api_requests_total',
      help: 'Toplam API istek sayısı',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [register],
    });
    
    // API istek süresi
    const apiRequestDuration = new client.Histogram({
      name: 'api_request_duration_seconds',
      help: 'API istek süresi (saniye)',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [register],
    });
    
    // Bellek kullanımı
    const memoryGauge = new client.Gauge({
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
    
    // Metrik yardımcıları
    metrics = {
      // HTTP istekleri için metrikler
      recordHttpRequest: (method: string, route: string, statusCode: number, duration: number) => {
        httpRequestCounter.inc({ method, route, status_code: statusCode });
        httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
      },
    
      // API istekleri için metrikler
      recordApiRequest: (method: string, endpoint: string, statusCode: number, duration: number) => {
        apiRequestCounter.inc({ method, endpoint, status_code: statusCode });
        apiRequestDuration.observe({ method, endpoint, status_code: statusCode }, duration);
      },
    
      // Prometheus için metrik çıktısı
      getMetrics: async () => {
        return register.metrics();
      },
    
      // Content type
      getContentType: () => {
        return register.contentType;
      },
    
      // Registry
      register,
    };
  } catch (error) {
    console.error('Metrics initialization error:', error);
  }
}

export default metrics; 
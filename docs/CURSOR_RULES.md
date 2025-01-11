# Cursor Rules - Printify Entegrasyonu

## Genel Kurallar

1. **Variant ID Kullanımı**
   - Her zaman `variantId` kullanılmalı, `id` değil
   - Ürün oluştururken variant ID'leri kontrol edilmeli
   - Print provider'a göre variant kontrolü yapılmalı

2. **Print Provider**
   - Şu an için sabit olarak ID: 99 kullanılıyor
   - Print provider değişikliği yapılacaksa önce backend'e bilgi verilmeli
   - Her print provider için variant kontrolü yapılmalı

3. **Senkronizasyon**
   - Blueprint değişiklikleri için backend'e bilgi verilmeli
   - Variant değişiklikleri için backend'e bilgi verilmeli
   - Senkronizasyon sorunlarında immediate fix yapılmalı

4. **Görsel Yükleme**
   - Görsel boyutları ve formatları kontrol edilmeli
   - Yükleme başarısız olursa detaylı log tutulmalı
   - Kullanıcıya anlamlı hata mesajları gösterilmeli

5. **Ürün Oluşturma**
   - Her ürün için en az bir variant seçilmeli
   - Variant fiyatları kontrol edilmeli
   - Başlık ve açıklama alanları boş bırakılmamalı

## Code Review Kuralları

1. **API İstekleri**
   - Token kontrolü yapılmalı
   - Error handling eksiksiz olmalı
   - Response tipleri kontrol edilmeli

2. **State Management**
   - Form state düzgün yönetilmeli
   - Modal state'leri kontrol edilmeli
   - Loading state'leri eksiksiz olmalı

3. **Type Safety**
   - Interface'ler eksiksiz tanımlanmalı
   - Type assertion'lar minimize edilmeli
   - Optional chaining kullanılmalı

4. **Error Handling**
   - Try-catch blokları kullanılmalı
   - Error boundary'ler eksiksiz olmalı
   - Console.log yerine proper logging kullanılmalı

## Testing

1. **Unit Tests**
   - API istekleri mock'lanmalı
   - State değişiklikleri test edilmeli
   - Error case'ler kontrol edilmeli

2. **Integration Tests**
   - Blueprint seçimi test edilmeli
   - Variant seçimi test edilmeli
   - Ürün oluşturma flow'u test edilmeli

3. **E2E Tests**
   - Tam flow test edilmeli
   - Edge case'ler kontrol edilmeli
   - Error senaryoları test edilmeli

## Deployment

1. **Pre-deployment**
   - API endpoint'leri kontrol edilmeli
   - Environment variable'lar kontrol edilmeli
   - Type check yapılmalı

2. **Post-deployment**
   - Senkronizasyon kontrol edilmeli
   - Error monitoring aktif olmalı
   - Performance monitoring aktif olmalı 
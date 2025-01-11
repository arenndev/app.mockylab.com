# Printify Entegrasyonu

## Genel Bakış
Bu entegrasyon, Printify API'si ile etkileşime geçerek blueprint'leri senkronize etmeyi, variant'ları yönetmeyi ve ürün oluşturmayı sağlar.

## Temel Kavramlar

### Blueprint
- Printify'daki temel ürün şablonu
- Her blueprint'in kendine özgü variant'ları ve print provider'ları vardır
- Senkronizasyon ile veritabanında tutulur

### Variant
- Blueprint'in farklı versiyonları (renk, boyut vb.)
- Her variant print provider'a özgüdür
- `variantId` Printify'daki gerçek ID'yi temsil eder

### Print Provider
- Ürünleri basan tedarikçi
- Her print provider'ın kendine özgü variant'ları vardır
- Şu anda varsayılan olarak ID: 99 kullanılıyor

## Senkronizasyon

### Blueprint Senkronizasyonu
```csharp
public async Task SyncBlueprintsAsync(string apiKey)
{
    // 1. Printify API'sinden blueprint'leri al
    // 2. Veritabanındaki blueprint'leri güncelle
    // 3. Artık kullanılmayan blueprint'leri deaktive et
}
```

### Variant Senkronizasyonu
```csharp
public async Task SyncBlueprintVariantsAsync(int blueprintId, int printProviderId, string apiKey)
{
    // 1. Printify API'sinden variant'ları al
    // 2. Veritabanındaki variant'ları güncelle
    // 3. Yeni variant'ları ekle
}
```

## API Endpoints

### Blueprint İşlemleri

#### Blueprint Listesi
```http
GET /api/Printify/blueprints
```
Query Parameters:
- `search`: Arama terimi
- `brand`: Marka filtresi
- `page`: Sayfa numarası
- `pageSize`: Sayfa başına öğe sayısı

#### Blueprint Detayı
```http
GET /api/Printify/blueprints/{id}
```

#### Blueprint Variant'ları
```http
GET /api/Printify/blueprints/{id}/variants
```
Query Parameters:
- `printProviderId`: Print provider ID (default: 99)
- `page`: Sayfa numarası
- `pageSize`: Sayfa başına öğe sayısı

### Görsel İşlemleri

#### Görsel Yükleme
```http
POST /api/PrintifyImage/upload
```
Form Data:
- `ImageFile`: Yüklenecek görsel
- `FileName`: Dosya adı
- `UserId`: Kullanıcı ID'si

### Ürün İşlemleri

#### Ürün Oluşturma
```http
POST /api/Printify/products
```
Request Body:
```json
{
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "blueprintId": number,
    "variants": [
        {
            "variantId": number,
            "price": number,
            "isEnabled": boolean
        }
    ],
    "printifyImageId": "string",
    "userId": "string"
}
```

## Frontend Bileşenleri

### BlueprintSelectModal
- Blueprint listesini gösterir
- Arama ve filtreleme özellikleri sunar
- Seçilen blueprint'in detaylarını yükler

### VariantSelectModal
- Blueprint'e ait variant'ları gösterir
- Variant seçimi ve fiyatlandırma yapılmasını sağlar
- Seçilen variant'ları form state'inde tutar

## Önemli Noktalar

### Senkronizasyon
- Blueprint'ler düzenli olarak senkronize edilmeli
- Her blueprint için variant'lar ayrıca senkronize edilmeli
- Senkronizasyon sırasında mevcut veriler korunmalı

### Print Provider
- Şu anda sabit olarak ID: 99 kullanılıyor
- İleride farklı print provider'lar eklenebilir
- Her print provider'ın kendine özgü variant'ları var

### Variant ID'leri
- Frontend'de her zaman `variantId` kullanılmalı
- Backend'de hem `id` hem `variantId` takip edilmeli
- Ürün oluştururken `variantId` kullanılmalı

### Hata Yönetimi
- API isteklerinde token kontrolü yapılmalı
- Senkronizasyon hataları loglanmalı
- Kullanıcıya anlamlı hata mesajları gösterilmeli

## Geliştirme Önerileri

1. Print provider seçimi eklenebilir
2. Toplu senkronizasyon için background job eklenebilir
3. Variant fiyatları için geçmiş takibi eklenebilir
4. Görsel önizleme ve düzenleme özellikleri eklenebilir
5. Ürün oluşturma sonrası webhook desteği eklenebilir 
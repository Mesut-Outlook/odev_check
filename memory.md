# Proje Hafızası (memory.md)

Bu dosya, projenin mevcut durumu, mimari kararları, tamamlanan işleri ve gelecek planlarını takip etmek için kullanılan ortak hafıza alanıdır.

## Son Güncelleme
- **Tarih:** 3 Temmuz 2026
- **Durum:** OpenAI API entegrasyonu tamamlandı, varsayılan model `gpt-5.5` olarak güncellendi ve sunucu yeniden başlatıldı.

## Proje Tanımı
Öğrencilerin matematik ödev görsellerini yükledikleri, OpenAI API (`gpt-5.5`) kullanarak ödevlerin otomatik değerlendirildiği ve öğretmenlerin bu değerlendirmeleri inceleyip not ekleyebildiği bir "Matematik Ödev Kontrol" uygulaması.

## Mevcut Mimari ve Bileşenler
- **`server/`**: Express tabanlı API backend sunucusu.
  - `storage.js`: Öğrenci ve ödev verilerini dosya sisteminde depolayan yerel veritabanı simülasyonu.
  - `openaiClient.js`: OpenAI API entegrasyonunu yöneten servis.
  - `server.js`: API uç noktalarını (endpoints) sunan Express uygulaması.
- **`web/`**: React ve Vite tabanlı web arayüzü.
  - `src/`: React bileşenleri ve sayfaları.
- **`data/`**: Öğrenci bilgileri, ödev resimleri ve değerlendirme JSON çıktılarının saklandığı yerel depolama dizini.

## Tamamlanan İşler
- [x] Express API ve React projesinin temel kurulumu yapıldı.
- [x] OpenAI API entegrasyonu sağlandı (`openaiClient.js`).
- [x] `.env` dosyasına OpenAI API Key eklendi.
- [x] Sunucu (port 3001) ve Web istemcisi (port 5173) yerel ortamda başarıyla ayağa kaldırıldı.

## Yapılacak İşler / Yol Haritası
- [ ] Ödev değerlendirme kalitesini ve prompt verimliliğini test etmek.
- [ ] Arayüz tasarımını zenginleştirmek, responsive hale getirmek ve animasyonlar eklemek.
- [ ] Öğretmen notlandırma ve geri bildirim formunu işlevsel kılmak.
- [ ] Çoklu görsel yükleme sırasındaki hata yönetimini güçlendirmek.

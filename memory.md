# Proje Hafızası (memory.md)

Bu dosya, projenin mevcut durumu, mimari kararları, tamamlanan işleri ve gelecek planlarını takip etmek için kullanılan ortak hafıza alanıdır.

## Son Güncelleme
- **Tarih:** 6 Temmuz 2026
- **Durum:** Kullanıcı talebi doğrultusunda varsayılan model `gpt-5.4-mini` olarak güncellendi. Gelişmiş öğrenci yönetimi, ödev temizleme özellikleri ve özel logo görseli entegrasyonu tamamlandı.

## Proje Tanımı
Öğrencilerin matematik ödev görsellerini yükledikleri, OpenAI API (`gpt-5.4-mini`) kullanarak ödevlerin otomatik değerlendirildiği ve öğretmenlerin bu değerlendirmeleri inceleyip not ekleyebildiği bir "Matematik Ödev Kontrol" uygulaması.

## Mevcut Mimari ve Bileşenler
- **`server/`**: Express tabanlı API backend sunucusu.
  - `storage.js`: Öğrenci ve ödev verilerini dosya sisteminde depolayan yerel veritabanı simülasyonu.
  - `openaiClient.js`: OpenAI API entegrasyonunu yöneten servis.
  - `pdfService.js`: pdfkit kullanarak Türkçe karakter destekli ödev karnesi PDF'leri üreten servis.
  - `server.js`: API uç noktalarını (endpoints) sunan Express uygulaması.
- **`web/`**: React ve Vite tabanlı web arayüzü.
  - `src/`: React bileşenleri ve sayfaları.
  - `public/`: Statik varlıklar (örn: `logo.jpeg`).
- **`data/`**: Öğrenci bilgileri, ödev resimleri ve değerlendirme JSON çıktılarının saklandığı yerel depolama dizini.

## Tamamlanan İşler
- [x] Express API ve React projesinin temel kurulumu yapıldı.
- [x] OpenAI API entegrasyonu sağlandı (`openaiClient.js`).
- [x] `.env` dosyasına OpenAI API Key eklendi.
- [x] Sunucu (port 3001) ve Web istemcisi (port 5173) yerel ortamda başarıyla ayağa kaldırıldı.
- [x] Türkçe karakter destekli PDF karne üretimi tamamlandı (`pdfService.js`).
- [x] WhatsApp ile değerlendirmeyi mesaj ve PDF linki olarak gönderme altyapısı uygulandı.
- [x] Öğrenciye telefon/WhatsApp numarası ekleme ve düzenleme özellikleri eklendi.
- [x] Öğrenci silme ve arşivleme özellikleri backend & frontend katmanlarında tamamlandı.
- [x] Ödev değerlendirme kayıtlarını tekil veya toplu temizleme (silme) özelliği eklendi.
- [x] Özel logo (`logo.jpeg`) sisteme yüklendi ve başlığa anasayfaya dönüş (sıfırlama) özelliği entegre edildi.
- [x] Aktif ve Arşivlenmiş öğrenciler butonları yan yana getirilerek farklı belirgin renklerle ayrıştırıldı.
- [x] Ödev ön izleme alanı genişletildi (%40'tan %55'e), dikey boyutu büyütüldü (`82vh`) ve fare ile sürükleyerek kaydırma (drag-to-pan) özelliği eklendi.
- [x] Değerlendirme prompt'u gerçek API ile test edildi (çok sayfalı ödev, 3/3 doğru sınıflandırma, ~5-6 sn yanıt); prompt değişikliği gerekmedi.
- [x] Çoklu görsel yükleme backend entegrasyonu test altına alındı (`server/tests/multi-upload.test.js`, 5 yeni test) ve `UploadDropzone` bileşenine istemci tarafı tür/adet/boyut doğrulaması eklendi.

## Yapılacak İşler / Yol Haritası
- [ ] Arayüz tasarımını zenginleştirmek, responsive hale getirmek ve animasyonlar eklemek.

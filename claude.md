# Claude Geliştirici Kılavuzu (claude.md)

Bu dosya, projede çalışan yapay zeka asistanı Claude için komutları, kod standartlarını ve çalışma yönergelerini içerir.

## Proje Komutları

### Backend (Express Sunucusu)
- **Geliştirme Sunucusunu Başlatma:** `cd server && npm run dev`
- **Prod Sunucusunu Başlatma:** `cd server && npm start`
- **Testleri Çalıştırma:** `cd server && npm test`
- **Konum:** `C:\Users\egemen\Documents\_PROJELER\Odev_Check\server`

### Frontend (React + Vite Arayüzü)
- **Geliştirme Sunucusunu Başlatma:** `cd web && npm run dev`
- **Üretim Derlemesi Alma (Build):** `cd web && npm run build`
- **Önizleme:** `cd web && npm run preview`
- **Konum:** `C:\Users\egemen\Documents\_PROJELER\Odev_Check\web`

## Teknoloji Yığını (Tech Stack)
- **Backend:** Node.js (ES Modules), Express.js, Multer, OpenAI SDK.
- **Frontend:** React, Vite, Vanilla CSS.
- **Veri Depolama:** Yerel JSON / Dosya tabanlı depolama (`server/storage.js`).

## Kod Standartları ve Kurallar
1. **Modüller:** Hem backend hem de frontend projelerinde ES Modules (`import/export`) yapısı kullanılmaktadır.
2. **Hata Yönetimi:** Express rotalarında `asyncHandler` sarmalayıcısı kullanılmalı ve hatalar `next(err)` ile iletilmelidir.
3. **Temiz Kod:** Gereksiz paket bağımlılıklarından kaçınılmalı, kod içi Türkçe/İngilizce açıklamalar tutarlı olmalıdır.
4. **Çevre Değişkenleri:** Hassas bilgiler `.env` dosyasında tutulur. Asla API anahtarlarını kod içerisine doğrudan (hardcoded) eklemeyin.

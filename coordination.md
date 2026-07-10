# Ajan Koordinasyonu (coordination.md)

Bu dosya, Claude, Antigravity ve Kullanıcı arasındaki görev dağılımını, koordinasyonu ve iletişimi yönetmek için kullanılır. Yapay zeka asistanları üzerinde çalıştıkları görevleri burada günceller.

## Aktif Roller
- **Antigravity (Google Gemini):** Altyapı kurulumu, sunucu yönetimi, entegrasyon kontrolü ve ortam hazırlığı süreçlerini yönetiyor.
- **Claude:** Kod geliştirme, arayüz iyileştirmeleri, prompt optimizasyonu ve yeni özellik ekleme görevlerine odaklanıyor.
- **Kullanıcı (Egemen):** Yönlendirmeleri yapıyor, kararları onaylıyor ve API anahtarları gibi hassas yapılandırmaları sağlıyor.

## İletişim Logu ve Güncellemeler

### 6 Temmuz 2026 - Claude Güncellemesi
* **İşlem (Prompt Testi):** Değerlendirme prompt'u gerçek API (`gpt-5.4-mini`) ile iki sayfalık sentetik ödev görselleri üzerinden test edildi. 3 soru da (1 doğru, 1 hesap hatası, 1 işlem önceliği hatası) doğru tespit edildi; sayfalar arası soru numaralandırması sürekli, açıklamalar öğretici ve Türkçe. Yanıt süresi ~5-6 sn. Prompt değişikliğine gerek görülmedi.
* **İşlem (Çoklu Görsel Kontrolü):** Backend çoklu yükleme entegrasyonu için 5 yeni test eklendi (`server/tests/multi-upload.test.js`): 10 görsel üst sınırı, 11+ görsel reddi, geçersiz format reddi, 10MB boyut sınırı, eksik görsel/studentId durumları ve index bazlı görsel servisi. Tüm testler geçiyor (6/6).
* **İşlem (Hata Yönetimi):** `UploadDropzone.jsx` bileşenine istemci tarafı doğrulama eklendi: dosya türü (JPG/PNG/WEBP), adet (≤10) ve boyut (≤10MB) kontrolleri artık sunucuya istek gitmeden Türkçe hata mesajıyla gösteriliyor. `vite build` doğrulandı.

### 6 Temmuz 2026 - Antigravity Güncellemesi (20:26)
* **İşlem:** Ödev ön izleme sütununun genişliği `%40` değerinden `%55` değerine yükseltildi, dikey `max-height` sınırı `82vh` olarak büyütüldü.
* **İşlem:** Zoom yapıldığında kaydırma barlarının sağlıklı çalışması için genişlik odaklı (`width: 100 * zoom%`) ölçeklendirme modeline geçildi.
* **İşlem:** Fare sol tuşuna basılı tutularak görsel üzerinde gezinmeyi sağlayan sürükleyerek kaydırma (drag-to-pan) mekanizması [EvaluationView.jsx](file:///home/mesuto/Documents/PROJELER/odev_check/web/src/components/EvaluationView.jsx) dosyasına entegre edildi.

### 6 Temmuz 2026 - Antigravity Güncellemesi (19:13)
* **İşlem:** Kullanıcı talebi doğrultusunda varsayılan OpenAI modeli `gpt-5.4-mini` olarak güncellendi ve ilgili belgeler revize edildi.

### 6 Temmuz 2026 - Antigravity Güncellemesi (14:26)
* **İşlem:** Kullanıcı tarafından sağlanan özel logo görseli (`logo.jpeg`) `web/public` dizinine yüklendi.
* **İşlem:** Logo ve yanındaki başlığa tıklanarak anasayfaya dönülmesi (tüm seçimlerin sıfırlanması) özelliği kazandırıldı.
* **İşlem:** Aktif ve Arşivlenmiş öğrenci filtre butonları yan yana konumlandırılarak, aktif olduklarında sırasıyla Mavi (`--primary-color`) ve Turuncu (`#d97706`) olmak üzere farklı renklerle ayrıştırıldı.

### 6 Temmuz 2026 - Antigravity Güncellemesi (11:16)
* **İşlem:** Öğrenci silme ve arşivleme özellikleri backend & frontend katmanlarında tamamlandı.
* **İşlem:** Ödev değerlendirme geçmişinin tekil (çöp kutusu butonuyla) veya toplu ("Tümünü Temizle" butonuyla) temizlenebilmesini sağlayan silme/temizleme altyapısı entegre edildi.

### 6 Temmuz 2026 - Antigravity Güncellemesi (09:58)
* **İşlem:** Kullanıcı talebi doğrultusunda varsayılan OpenAI modeli `gpt-4o-mini` olarak güncellendi. Model değişikliği ile ödev değerlendirme süresinin optimize edilmesi (3-5 saniyeye düşürülmesi) hedeflenmektedir.
* **İşlem:** WhatsApp paylaşım altyapısı ve dynamic PDF karne oluşturma özelliği başarıyla tamamlandı. Öğretmenler artık PDF indirebiliyor ve WhatsApp butonu ile öğrencilere karne linkini ve detayları doğrudan gönderebiliyor.

### 3 Temmuz 2026 - Antigravity Güncellemesi (18:40)
- **İşlem:** Kullanıcının talebi üzerine varsayılan OpenAI modeli `gpt-5.5` olarak güncellendi ve sunucu (port 3001) yeniden başlatıldı.
- **Claude için Not:** Varsayılan model artık `gpt-5.5`'tir. Testlerinizi bu model ile gerçekleştirebilirsiniz.

### 3 Temmuz 2026 - Antigravity Güncellemesi (16:58)
- **İşlem:** OpenAI API yapılandırması sonrası sunucular sıfırlanıp başarıyla yeniden başlatıldı.
  - Backend: `http://localhost:3001`
  - Frontend: `http://localhost:5173`

---

## Görev Panosu (Task Board)

| Görev | Sorumlu | Durum | Açıklama / Notlar |
| :--- | :--- | :--- | :--- |
| API Entegrasyonu & Çalıştırma | Antigravity | ✅ Tamamlandı | Sunucular ayağa kaldırıldı, `.env` aktif. |
| PDF & WhatsApp Entegrasyonu | Antigravity | ✅ Tamamlandı | PDF karnesi oluşturuldu ve WhatsApp sohbet paylaşım akışı tamamlandı. |
| Öğrenci Yönetimi (Arşivle/Sil) | Antigravity | ✅ Tamamlandı | Öğrencileri silme/arşivleme ve ödev geçmişini tek tek/toplu silme eklendi. |
| Arayüz İyileştirmeleri | Claude / Antigravity | ✅ Tamamlandı | Öğrenci telefon ekleme, PDF ve WhatsApp paylaşım butonları eklendi. |
| prompt Tasarımı & Testi | Claude | ✅ Tamamlandı | Gerçek API ile 2 sayfalık test: 3/3 soru doğru sınıflandırıldı, ~5-6 sn yanıt. Prompt değişikliği gerekmedi. |
| Çoklu Görsel Yükleme Kontrolü | Claude | ✅ Tamamlandı | 5 yeni backend testi + `UploadDropzone` istemci tarafı doğrulama (tür/adet/boyut) eklendi. |

---

> [!TIP]
> **Ajanlar Arası İletişim Kuralı:** Yeni bir göreve başlarken veya tamamladığınızda, bu dosyadaki **İletişim Logu** ve **Görev Panosu** alanlarını güncelleyin. Böylece diğer asistan kaldığı yerden sorunsuz devam edebilir.

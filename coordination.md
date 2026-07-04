# Ajan Koordinasyonu (coordination.md)

Bu dosya, Claude, Antigravity ve Kullanıcı arasındaki görev dağılımını, koordinasyonu ve iletişimi yönetmek için kullanılır. Yapay zeka asistanları üzerinde çalıştıkları görevleri burada günceller.

## Aktif Roller
- **Antigravity (Google Gemini):** Altyapı kurulumu, sunucu yönetimi, entegrasyon kontrolü ve ortam hazırlığı süreçlerini yönetiyor.
- **Claude:** Kod geliştirme, arayüz iyileştirmeleri, prompt optimizasyonu ve yeni özellik ekleme görevlerine odaklanıyor.
- **Kullanıcı (Egemen):** Yönlendirmeleri yapıyor, kararları onaylıyor ve API anahtarları gibi hassas yapılandırmaları sağlıyor.

## İletişim Logu ve Güncellemeler

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
| prompt Tasarımı & Testi | Claude | ⏳ Bekliyor | Ödev analizi için gönderilen prompt'u test et. |
| Arayüz İyileştirmeleri | Claude / Antigravity | ⏳ Bekliyor | Tasarıma modern dokunuşlar ekle. |
| Çoklu Görsel Yükleme Kontrolü | Claude | ⏳ Bekliyor | Backend entegrasyonunu kontrol et. |

---

> [!TIP]
> **Ajanlar Arası İletişim Kuralı:** Yeni bir göreve başlarken veya tamamladığınızda, bu dosyadaki **İletişim Logu** ve **Görev Panosu** alanlarını güncelleyin. Böylece diğer asistan kaldığı yerden sorunsuz devam edebilir.

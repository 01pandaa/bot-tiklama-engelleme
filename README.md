# ClickShield — Bot Tıklama Koruması

Google Ads kaynaklı ziyaretleri ve diğer web trafiğini izlemek, şüpheli davranışları görünür hâle getirmek ve incelenen IP adreslerini site bazında yönetmek için hazırlanan panel.

## Mevcut yapı

- GitHub Pages üzerinde çalışan statik dashboard
- Supabase Auth ile müşteri girişi
- Supabase tabloları üzerinden site, ziyaret ve koruma listesi verileri
- Siteye özel tracker kodu
- Son 24 saat metrikleri ve son 7/30 gün ziyaret grafiği
- Çoklu site seçimi
- Şüpheli IP’yi koruma listesine ekleme ve listeden çıkarma
- Google Ads `gclid` ve temel kampanya parametrelerinin alınması

## Önemli not

Paneldeki koruma listesine IP eklemek, tek başına Google Ads veya web sunucusunda trafik engellemez. Gerçek engelleme için Google Ads, CDN, WAF veya sunucu tarafında ayrıca uygulanacak bir aksiyon gerekir. Risk skoru da otomatik bir inceleme göstergesidir; kesin kötü niyet kanıtı değildir.

## Supabase gereksinimi

Frontend şu tabloları kullanır:

- `sites`
- `visits`
- `blocked_ips`
- `profiles`

`collect-visit` Edge Function ziyaretleri sunucu tarafında kaydeder. Public tablolar için RLS politikaları açık olmalı ve kullanıcı erişimi site sahipliği üzerinden sınırlandırılmalıdır. Frontend’e yalnızca publishable key konulabilir; service role anahtarı tarayıcıya eklenmemelidir.

## Yayınlama

`main` dalına yapılan push, `.github/workflows/pages.yml` üzerinden GitHub Pages yayınını başlatır. Supabase Edge Function ve veritabanı değişiklikleri GitHub Pages workflow’undan ayrı yönetilir.

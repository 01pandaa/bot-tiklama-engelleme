# Supabase kaynakları

Bu klasör, panelin kullandığı `collect-visit` Edge Function kaynağını proje ile birlikte sürümlemek için eklendi.

Fonksiyon anonim web ziyaretlerinden veri aldığı için `verify_jwt` canlı ortamda kapalı kalır; bunun karşılığında site anahtarı doğrulaması, payload sınırı, alan temizleme ve sunucu tarafı risk puanlama uygulanır. Service role anahtarı yalnızca Supabase Function secret olarak tutulmalı, GitHub’a veya tarayıcı koduna yazılmamalıdır.

Fonksiyonun canlı sürümünü güncellemeden önce mevcut tablo şeması, RLS politikaları ve domain doğrulaması test edilmelidir. Bu kaynak dosyası tek başına Google Ads veya web sunucusunda IP engellemesi uygulamaz.

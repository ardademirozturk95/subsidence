# Proje durumu: Mexico City batıyor (NISAR)

14 Kasım 2026 gecesi itibarıyla. Ekip: Arda, Mert, Yağız.
NASA Space Apps 2026, "Dancing with the SARs".

---

## 1. Tek cümlede proje

NISAR uydusunun gerçek L-band radar verisiyle, Mexico City'nin 11 ayda ne kadar çöktüğünü ölçüyoruz. Bunu herkesin anlayacağı, etkileşimli bir web sitesinde gösteriyoruz. Neden çöktüğünü de kaynaklarla anlatıyoruz; ana neden insan etkisi, yani yeraltı suyu pompalama.

## 2. Challenge şartları ve durumumuz

| Şart | Durum |
|---|---|
| NISAR verisi kullanmak | ✅ 54 gerçek NISAR GUNW interferogramı (iki yönden) ve 1 gerçek GCOV (HH/HV) görüntüsü. Örnek veri yok. |
| Bir yüzey değişimini zaman içinde izlemek | ✅ 11 ay, 28 tarih, gerçek dikey çökme |
| Etkileşimli araç | ✅ Site çalışıyor: harita oynatıcı, grafik, HH/HV karşılaştırıcı, Türkçe/İngilizce, açık/koyu tema |
| Fiziksel neden hipotezi | ✅ Kil (fiziksel neden) ve pompalama (insan tetikleyicisi); kaynaklı |
| Hangi polarizasyon? | ✅ Çökmeyi ölçen faz HH kanalından. HH/HV değerleri gerçek görüntüden ölçüldü. |
| NISAR'ın geleceği | ✅ Sitede 3 maddelik bölüm var |
| İnsan etkisi (isteğe bağlı) | ✅ "Şehri insan batırıyor" hikâyesi, 5 adım, 10 kaynak |

## 3. Bilimsel sonuçlar (kesinleşenler)

- **Veri:** NISAR L2 GUNW provisional. Track 19 (ascending) ve track 113 (descending) birleştirildi; Kasım 2025 – Ekim 2026.
- **En hızlı çöken yerler** (dikey, yıllık):
  - Xochimilco–Tláhuac sulak alanı **−36,4 cm**
  - Chalco ovası **−35,7 cm**
  - Aragón **−33,6 cm**
  - Nezahualcóyotl **−28,8 cm**
  - Iztapalapa **−23,7 cm**
- **Kaya zemin kontrolleri:** Santa Fe +0,7, Peñón Viejo −0,8, Ciudad Universitaria −0,4 cm/yıl, yani neredeyse sabit. Yöntemin doğru çalıştığının kanıtı.
- **Haritanın en hızlı %1'i:** yılda −32,9 cm.
- **Literatürle uyumlu:** yayınlarda yılda 30–40 cm. NASA/JPL'in Nisan 2026'daki kendi NISAR haritası da aynı büyüklükte.
- **Radarın göremediği yer:** havalimanı ve eski göl tabanında sinyal kopuyor. Haritadaki o boşluk "çökme yok" değil, "ölçüm yok" demek.
- **Mevsimsellik yok:** tek tek tarihlerdeki iniş çıkışlar (±2–4 cm) atmosfer gürültüsü; kaya noktalarında da aynı salınım var. Güvenilir olan yıllık hız.

## 4. Aldığımız kararlar

- **Sentinel-1 karşılaştırması siteden çıkarıldı.** Yağız'ın iki testinin sonucu:
  - 12 günlük testte NISAR, Sentinel-1'i geçemedi (0/5).
  - Uzun aralık testinde de geçemedi (0/3). Tek fark: yağmur mevsiminde tarlada Sentinel-1'in sinyali 2–8 kat hızlı bozuldu, ama yüksek başladığı için yine de geride kalmadı.

  Challenge karşılaştırma istemiyor. Bu yüzden site **sadece NISAR**. Testlerin raporları `docs/` klasöründe yedek olarak duruyor. Jüri sorarsa cevabımız hazır (aşağıda).
- **NASA/JPL de NISAR'la bir Mexico City haritası yayınladı** (Nisan 2026, ilk 3 ay, sadece kurak mevsim). İlk biz değiliz. Bizim farkımız: 11 ay, iki yönden gerçek dikey hız, nokta nokta zaman serisi, HH/HV yorumu ve herkesin kullanabileceği site.
- **Tasarım:** Mert'in tasarımı bizim sitenin yerleşimine uyarlandı: kâğıt/mürekkep renkleri, kart paneller, koyu tema, Mert'in çökme renk ölçeği. Yazı tipi Apple tarzı: Mac'te SF Pro, diğer sistemlerde Inter.

**Jüri "Neden Sentinel-1 değil?" diye sorarsa:**
> "Karşılaştırdık. Şehirde ve tarlada ikisi de çökmeyi ölçebiliyor. Yağmur mevsiminde uzun aralıklarda Sentinel-1'in sinyali daha hızlı bozuluyor, ama başlangıçta daha yüksek. Bizim amacımız yarıştırmak değil, NISAR'ın ilk yılını herkesin kullanabileceği bir araca dönüştürmekti."

## 5. Sitede şu an ne var?

Yerleşim (masaüstü):
- **Orta:** harita oynatıcı. ▶ ile 11 aylık çöküş animasyonu. Görünümler: "Çökme (cm)", "Radar halkaları", "İkisini karşılaştır".
- **Sol üst:** yer seçimi (açılır liste ya da haritada tıklama) ve sayılar: o tarihe kadarki çökme, yıllık hız, haritanın en hızlı %1'i, ölçüm sayısı.
- **Sağ üst:** seçilen yerin zaman grafiği (28 ölçüm ve eğilim çizgisi).
- **Sol alt:** HH ↔ HV kaydırmalı karşılaştırıcı, ölçülmüş HH/HV değerleri, haritanın arka planını HH/HV/RGB yapma.
- **Sağ alt:** "Şehri insan batırıyor": 20 milyon kişilik su ihtiyacı → gelenin iki katı çekim (Conagua: 993'e karşı 513 milyon m³) → kilin sıkışması → beton ve kuraklık → sokaktaki sonuçlar. Altında kaynaklar.
- **Alt bant:** "NISAR neyi mümkün kılıyor?" ve "Bu harita nasıl yapıldı?".

Çalıştırmak için `subsidence/web` klasöründe `npm install` ve ardından `npm run dev`.

## 6. Git ve dosyalar

- **Repo:** GitHub'da private `ardademirozturk95/subsidence`.
- **Yerel `main` GitHub'ın 3 commit önünde, push edilmedi:** yeni yerleşim, Mert tasarımı, yazı tipi.
- **Geri dönüş noktası:** Mert tasarımından önceki hal `oncesi-mert-tasarim` etiketinde.
- **Önemli belgeler:**
  - `HANDOFF.md`: veri hattının ayrıntısı.
  - `docs/dogrulama.md`: literatür doğrulaması.
  - `docs/challenge-cevaplari.md`: 3 sorunun sade cevabı.
  - `docs/arsiv/l-vs-c-raporu.md`: Sentinel-1 testi, yedek.
  - `docs/arsiv/video-senaryosu.md`: eski video senaryosu; **güncel değil**, yeniden yazılacak.

## 7. Bilinen sorunlar ve açık işler (dağıtılmayı bekliyor)

**Site**
1. "İkisini karşılaştır" görünümü kafa karıştırıcı. Solda ham radar halkaları, sağda çözülmüş cm haritası var. Ya daha iyi anlatılmalı ya da kaldırılmalı.
2. Sayfada çift kaydırma var: sayfa kayıyor, sol alt ve sağ alt panellerin de kendi kaydırması var. Polarizasyon ve hikâye panellerinin yeri yeniden düşünülmeli.
3. Kaldırılan "4a" kaynaklı araştırma (`c660384` commit'i) sitedeki hikâye paneline zaten girdi. Ayrı raporu inceleyip repoya alıp almama kararı verilmeli.
4. Mobil görünüm bir kez daha elle kontrol edilmeli.

**Yayın ve sunum**
5. **Yayına alma:** repo private olduğu için ücretsiz GitHub Pages çalışmaz. Seçenekler: repoyu public yapmak, ya da Vercel/Netlify'a koymak.
6. **Video (yaklaşık 2 dakika):** senaryo gerçek rakamlarla yeniden yazılmalı, sonra çekilmeli.
7. **Slaytlar:** challenge'ın 3 sorusu, sonuç rakamları, NASA/JPL ile farkımız, insan etkisi hikâyesi.
8. **README:** açık kaynak teslimi için projenin ne olduğu ve nasıl çalıştırılacağı güncellenmeli.

**Bilim (isteğe bağlı, zaman kalırsa)**
9. Aragón noktasında iki bakış yönü ayrışıyor; o değer daha belirsiz, sunumda öne çıkarılmamalı.
10. Sitedeki "Çökme" haritasına yıllık hız katmanı eklenebilir. Mert'in `rate.png` dosyası hazır.
11. Konya'ya aynı yöntemi uygulamak: veri var (4 track), ama zaman kısıtlı. Sadece "gelecek" fikri olarak kalabilir.

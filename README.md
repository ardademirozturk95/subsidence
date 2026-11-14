# Mexico City Batıyor — NISAR L-Band İnterferometri ile Çökme ve Zemin Eğimi

**NASA Space Apps 2026 — "Dancing with the SARs"**  
**Ekip:** Arda, Mert, Yağız

Mexico City'nin (CDMX) **11 aylık gerçek NISAR L-band uydu radar verisiyle** (11 Kasım 2025 – 13 Ekim 2026, 336 gün) dikey zemin çökmesini, radar faz halkalarını, polarimetrik saçılımını (HH/HV/RGB) ve **diferansiyel çökme (zemin eğimi)** kuşaklarını gösteren etkileşimli web uygulaması ve Python analiz hattı.

Bazı mahalleler yılda **30+ cm** alçalıyor (en hızlı %1 dilim: **−32,9 cm/yıl**). Bunun temel nedeni şehir altındaki akiferden doğal beslenmenin üzerinde su çekilmesi.

**Canlı site: https://ardademirozturk95.github.io/subsidence/**

---

## Öne Çıkan Özellikler

- **Gerçek çift-yörünge dikey ayrıştırma:** İnen (Track 113) ve çıkan (Track 19) NISAR `L2 GUNW` yörüngeleri birleştirilerek gerçek düşey hız (`vU`) ve doğu-batı bileşeni (`vE`) çıkarılır.
- **4 etkileşimli harita görünümü:**
  1. **Çökme (`disp`):** Tarihe göre birikmiş düşey yer değiştirme (cm).
  2. **Radar halkaları (`wrap`):** L-band sarılı LOS fazı (`λ/2 = 11,92 cm` / halka).
  3. **İkisini karşılaştır (`swipe`):** Bölünmüş ekranda çökme ve faz halkaları.
  4. **Diferansiyel çökme / Eğim (`tilt`):** Zeminin ne kadar hızlı battığını değil, yan yana iki noktanın **birbirine göre ne kadar farklı çöktüğünü (eğildiğini)** gösteren harita.
- **Polarimetrik arka planlar:** NISAR `L2 GCOV` üzerinden `HH`, `HV` ve `RGB` (kentsel yapı / bitki / su ayrımı) katmanları.
- **11 izleme noktası ve zaman serisi:** Nezahualcóyotl, Chalco, Xochimilco–Tláhuac, Zócalo, Santa Fe ve diğer referans noktaları için 11 aylık çökme grafikleri ve eğim değerleri.
- **İki dilli arayüz:** Türkçe / İngilizce tam destek (`web/src/lib/i18n.tsx`).

---

## Temel Bulgular ve Bilimsel Sınırlar

- **Düz çökme mi, eğilme mi? (Neden önemli?):** Geniş bir alan aynı anda eşit biçimde çökerse üzerindeki yapılar birlikte alçalır. Asıl zorlanma, bir nokta sabit kalırken hemen yanındaki zeminin daha hızlı çöküp yüzeyi **eğmesiyle** oluşur.
  - Örneğin **Nezahualcóyotl** göl ortasında yılda yaklaşık 29 cm ile çok hızlı çöküyor ama her yer benzer hızda battığı için zemin neredeyse düz kalıyor (1 km mesafede yılda yalnızca ~2,4 cm eğim farkı).
  - Buna karşılık **Chalco** (1 km'de ~60 cm/yıl fark), **Iztapalapa** (~26 cm/yıl) ve **Xochimilco–Tláhuac** (~24 cm/yıl) gibi geçiş ve kenar bölgelerinde komşu alanlar farklı hızlarda çöktüğü için zemin belirgin şekilde eğiliyor.
- **Ön-kayıtlı doğrulamalar (dürüst raporlama):**
  - **Zemin haritasıyla karşılaştırma ([docs/tilt.md](docs/tilt.md)):** "En hızlı eğilme mutlaka şehrin resmî sert zemin–kil sınırında mı toplanıyor?" sorusunu Mexico City'nin resmî NTC 2017 zemin haritasıyla test ettik; sonuç şehir genelinde `doğrulanmadı` çıktı (`geçiş / göl = 0,83`, `geçiş / sert zemin = 0,94`). Bu yüzden bu katmanı yalnızca *"zeminin en hızlı eğildiği kuşaklar"* olarak sunuyoruz; tekil bina ya da boru hasarını hesapladığımızı iddia etmiyoruz.
  - **L-band vs. C-band (Sentinel-1) tutarlılık arşivi ([docs/arsiv/c-band-zaman.md](docs/arsiv/c-band-zaman.md)):** 12 günlük (`0/5`) ve 24/36 günlük (`0/3`) ön-kayıtlı tarım/sulak alan testlerinde karar ölçütü `doğrulanmadı`; ancak yağışlı dönem orman ve uzun aralıklı hızlı kayıp analizleri kanıt olarak arşivde tutulmaktadır.
- **Varsayımlar:** Kuzey–güney hareketi `0` kabul edilmiştir; troposfer düzeltmesi uygulanmamıştır (bu havzada gürültüyü artırdığı için çıkarılmıştır); `80 m` piksel boyutu dar zemin yarıklarını ortalar.

---

## Hızlı Başlangıç (Web Sitesi)

Site yalnızca [web/public/data/](web/public/data/) altındaki hazır PNG ve JSON dosyalarını okur; **backend, API anahtarı veya token gerekmez.**

```powershell
cd web
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın. Production derlemesi için:

```powershell
npm run build
```

---

## Klasör Yapısı

```text
subsidence/
├── web/                        React + Vite + Tailwind + Leaflet arayüzü
│   ├── src/App.tsx             Ana yerleşim, görünüm seçici ve paneller
│   ├── src/components/         Harita (SinkMap), zaman çizgisi, grafik, HH/HV karşılaştırıcı
│   ├── src/lib/                Veri yükleme (data.ts) ve TR/EN metinler (i18n.tsx)
│   └── public/data/cdmx/       Siteye aktarılan gerçek NISAR PNG ve JSON çıktıları
├── backend/                    Python veri ve analiz hattı
│   ├── chain_test.py           NISAR L2 GUNW çiftlerinden 11 aylık LOS zinciri
│   ├── decompose.py            İki bakış yönünden dikey (vU) ve doğu-batı (vE) hız ayrıştırma
│   ├── export_web.py           Harita PNG'leri, points.json, fringes.json ve regions.json üretimi
│   ├── tilt.py                 Diferansiyel çökme (|∇v|), Santa Fe gürültü ve NTC 2017 doğrulaması
│   ├── gcov_subset.py          L2 GCOV HH / HV / RGB arka plan görüntüleri
│   └── arsiv/                  Arşivlenmiş Sentinel-1 / C-band karşılaştırma betikleri
├── docs/                       Güncel teknik belgeler ve doğrulama raporları
│   ├── proje-durumu.md         Proje özeti ve ekip durumu
│   ├── dogrulama.md            Sayısal doğrulama ve bilinen sınırlar
│   ├── challenge-cevaplari.md  Challenge sorularının sade TR/EN cevapları
│   ├── tilt-olcut.md           Eğim modu ön-kayıtlı parametre ve ölçüt belgesi
│   ├── tilt.md                 Eğim analizi ve jeoteknik zonlama doğrulama raporu
│   └── arsiv/                  Arşiv belgeleri ve L-band/C-band sonuçları (l-vs-c/)
└── HANDOFF.md                  Veri hattının ayrıntılı teknik devir notu
```

---

## Veri Hattını Baştan Çalıştırmak (İsteğe Bağlı)

Gereksinimler: Python 3, NASA Earthdata hesabı ve `EARTHDATA_TOKEN` ortam değişkeni.

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
```

Çalıştırma sırası:

1. `python backend/chain_test.py --track 113` ve `python backend/chain_test.py --track 19`
2. `python backend/decompose.py`
3. `python backend/export_web.py`
4. `python backend/tilt.py --backend-out backend/out --out web/public/data`
5. `python backend/gcov_subset.py --track 19 --date 20261013`

Ara çıktılar `backend/out/` altında tutulur ve `.gitignore` nedeniyle git'e girmez. Ayrıntılar için [HANDOFF.md](HANDOFF.md) dosyasına bakın.

---

## Veri Kaynakları ve Lisans

- **Uydu Verisi:** NASA/ISRO **NISAR** `L2 GUNW` ve `L2 GCOV` (provisional sürüm, ASF DAAC; Track 19 ascending & Track 113 descending).
- **Jeoteknik Zonlama:** CDMX SGIRPC *Atlas de Riesgos / Normas Técnicas Complementarias (2017)*.
- **Lisans:** [LICENSE](LICENSE)

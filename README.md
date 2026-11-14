# Mexico City batıyor

**NASA Space Apps 2026, "Dancing with the SARs"**

NISAR uydusunun gerçek L-band radar verisiyle Mexico City'nin 11 ayda (Kasım 2025 – Ekim 2026) ne kadar çöktüğünü gösteren etkileşimli bir web sitesi.
Bazı mahalleler yılda 35 cm alçalıyor. Sebebi büyük ölçüde insan: şehrin altındaki akiferden, yağmurla geri gelenin iki katı su çekiliyor.

Ekip: Arda, Mert, Yağız.

**Canlı site: https://ardademirozturk95.github.io/subsidence/**

Projenin güncel durumu, sonuçları ve açık işler: **[docs/proje-durumu.md](docs/proje-durumu.md)**

---

## Siteyi çalıştırmak

```bash
cd web
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173`. Tam yerleşimi görmek için pencereyi geniş tutun; dar ekranda paneller alt alta dizilir.

Site sadece `web/public/data/` klasöründeki hazır dosyaları okur. Sunucu, API anahtarı ya da token gerekmez.

## Klasörler

```
web/                  site (React + Vite + Tailwind + Leaflet)
  src/App.tsx         yerleşim ve paneller
  src/components/     harita, zaman çizgisi, grafik, HH/HV karşılaştırıcı
  src/lib/i18n.tsx    bütün metinler (Türkçe / İngilizce)
  public/data/        sitenin okuduğu gerçek NISAR verisi (PNG + JSON)
backend/              veri hattı (Python): NISAR'dan okuma, zincir, dikey hız, siteye aktarma
  arsiv/              kullanılmayan deneyler (Sentinel-1 karşılaştırması, C-band simülasyonu)
docs/                 sonuçlar, doğrulama, challenge cevapları
  arsiv/              eski belgeler
HANDOFF.md            veri hattının ayrıntılı teknik notu
```

## Veriyi baştan üretmek (isteğe bağlı)

Gerekenler: Python 3, bir Earthdata hesabı ve `EARTHDATA_TOKEN` ortam değişkeni (urs.earthdata.nasa.gov > Generate Token).

```bash
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
```

Sırayla:

1. `backend/chain_test.py --track 113` ve `--track 19`: NISAR GUNW çiftlerinden Mexico City kesitini okur ve 11 aylık zinciri kurar. Dosyalar indirilmez, buluttan parça parça okunur.
2. `backend/decompose.py`: iki bakış yönünden gerçek dikey hızı çıkarır.
3. `backend/export_web.py`: sitenin okuduğu PNG ve JSON dosyalarını `web/public/data/` altına yazar.
4. `backend/gcov_subset.py --track 19 --date 20261013`: HH / HV / RGB arka plan görüntüleri.

Ara çıktılar `backend/out/` altına yazılır; bu klasör git'e girmez. Ayrıntılar [HANDOFF.md](HANDOFF.md) dosyasında.

## Veri kaynağı

NISAR L2 GUNW ve L2 GCOV, provisional sürüm, ASF DAAC üzerinden (NASA/ISRO).
Track 19 (ascending) ve 113 (descending). Troposfer düzeltmesi yok: denendi, bu havzada gürültüyü artırdı.

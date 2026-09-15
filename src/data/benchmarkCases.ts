import { TestCase } from '../types';

export const DEFAULT_BENCHMARK_CASES: TestCase[] = [
  {
    id: 'case-legal-sla',
    title: 'Hizmet Seviyesi (SLA) ve Cezai Şart Çıkarımı',
    category: 'legal',
    documentTitle: 'Kurumsal Bulut ve Veri Merkezi Hizmet Sözleşmesi (Madde 8 - 14)',
    documentContent: `MADDE 8: HİZMET KESİNTİLERİ VE TAAHHÜTLER
8.1. Yüklenici, aylık çalışma süresinin (uptime) asgari %99.95 olacağını garanti eder. Planlı bakım çalışmaları, en az 72 saat öncesinden Müşteri'ye yazılı olarak bildirilecektir.
8.2. Planlanmamış kesintinin ay içerisinde kümülatif olarak 4 saati aşması durumunda, Yüklenici o aya ait toplam fatura bedelinin %15'i oranında cezai indirim uygulayacaktır. Kesintinin 12 saati aşması halinde ceza oranı %35'e çıkacaktır.

MADDE 11: FESİH VE TAZMİNAT
11.1. Taraflardan herhangi biri, sözleşme yükümlülüklerinin ihlali halinde diğer tarafa noter veya KEP kanalıyla 30 günlük yazılı düzeltme ihtarı çeker. Bu süre zarfında ihlal giderilmezse sözleşme derhal feshedilebilir.
11.2. Müşteri'nin kusuru olmaksızın gerçekleşen tek taraflı haklı fesihte, Yüklenici peşin tahsil edilmiş ancak verilmeyen hizmet bedellerini 14 iş günü içinde iade etmekle yükümlüdür.
11.3. Yüklenicinin toplam mali mesuliyeti, her halükarda son 12 ayda tahsil edilmiş toplam sözleşme bedelinin %100'ü ile sınırlıdır.

MADDE 14: UYUŞMAZLIKLARIN ÇÖZÜMÜ
İşbu sözleşmeden doğacak her türlü ihtilafta Ankara Batı Adliyesi Mahkemeleri ve İcra Daireleri münhasıran yetkilidir.`,
    prompt: `Aşağıdaki soruları yukarıdaki sözleşme metnine dayanarak maddeler halinde net olarak cevaplayınız:
1. Taahhüt edilen asgari aylık uptime oranı nedir?
2. Kesinti süresi 12 saati aşarsa uygulanacak cezai indirim oranı nedir?
3. İhlal halinde tanınan yazılı düzeltme ihtar süresi kaç gündür?
4. Uyuşmazlıklarda yetkili mahkeme neresidir?
5. Yüklenicinin toplam mali mesuliyet tavanı nedir?`,
    groundTruth: `1. Asgari aylık uptime oranı %99.95'tir.
2. Kesintinin 12 saati aşması halinde uygulanacak cezai indirim oranı %35'tir.
3. İhlal halinde tanınan yazılı düzeltme ihtar süresi 30 gündür.
4. Yetkili mahkeme Ankara Batı Adliyesi Mahkemeleri ve İcra Daireleri'dir.
5. Yüklenicinin toplam mali mesuliyet tavanı son 12 ayda tahsil edilmiş toplam sözleşme bedelinin %100'ü ile sınırlıdır.`,
    evaluationMode: 'entity_f1',
    expectedEntities: [
      '%99.95',
      '%35',
      '30 gün',
      'Ankara Batı',
      'son 12 ay',
      '%100'
    ],
    weight: 4,
  },
  {
    id: 'case-fin-ebitda',
    title: 'Çeyreklik Gelir Tablosu & FAVÖK Marjı Hesaplama',
    category: 'financial',
    documentTitle: 'Atlas Bilişim A.Ş. 2024 Yılı 4. Çeyrek Konsolide Finansal Özeti',
    documentContent: `ATLAS BİLİŞİM A.Ş. - GELİR TABLOSU VERİLERİ (TL)
Dönem: 01.10.2024 - 31.12.2024 (Q4) ve Yıllık Kümülatif

1. Hasılat (Net Satışlar):
   - Q4 2023: 120.000.000 TL
   - Q4 2024: 180.000.000 TL
   - 2024 Yıllık Toplam: 580.000.000 TL

2. Satışların Maliyeti (SMM):
   - Q4 2024: 95.000.000 TL
   - Brüt Kar: 85.000.000 TL

3. Faaliyet Giderleri:
   - Araştırma ve Geliştirme (Ar-Ge): 14.500.000 TL
   - Pazarlama, Satış ve Dağıtım: 18.200.000 TL
   - Genel Yönetim Giderleri: 12.300.000 TL
   - Toplam Faaliyet Giderleri: 45.000.000 TL

4. Faaliyet Karı: 40.000.000 TL

5. Amortisman ve İtfa Payları:
   - Dönem Amortisman Gideri: 14.000.000 TL
   (Not: FAVÖK = Faaliyet Karı + Amortisman ve İtfa Payları)

6. Finansman Gelir/Gideri Öncesi Net Dönem Karı: 32.400.000 TL`,
    prompt: `Verilen finansal özete göre şu 4 soruyu hesaplayıp yanıtlayınız:
1. Q4 2023'ten Q4 2024'e hasılat artış yüzdesi kaçtır? (Formül: [(Yeni-Eski)/Eski] * 100)
2. Q4 2024 dönemi için hesaplanan FAVÖK (TL) tutarı nedir?
3. Q4 2024 dönemi FAVÖK Marjı yüzde kaçtır? (Formül: [FAVÖK / Q4 Hasılat] * 100)
4. Faaliyet giderleri arasındaki en yüksek harcama kalemi ve tutarı nedir?`,
    groundTruth: `1. Q4 Hasılat artış oranı %50'dir. ([(180M - 120M)/120M] * 100 = %50)
2. Q4 2024 FAVÖK tutarı 54.000.000 TL'dir. (Faaliyet Karı 40M + Amortisman 14M)
3. Q4 2024 FAVÖK Marjı %30'dur. (54M / 180M = %30)
4. En yüksek faaliyet gider kalemi Pazarlama, Satış ve Dağıtım giderleridir (18.200.000 TL).`,
    evaluationMode: 'numerical',
    expectedNumbers: [
      { value: 50, tolerancePct: 1, label: 'Hasılat Artış %' },
      { value: 54000000, tolerancePct: 0.1, label: 'FAVÖK (TL)' },
      { value: 30, tolerancePct: 1, label: 'FAVÖK Marjı %' },
      { value: 18200000, tolerancePct: 0.1, label: 'En yüksek gider' }
    ],
    expectedEntities: [
      '%50',
      '54.000.000',
      '%30',
      'Pazarlama',
      '18.200.000'
    ],
    weight: 5,
  },
  {
    id: 'case-tech-specs',
    title: 'Sunucu Mimarisi & Şifreleme Standartları Denetimi',
    category: 'technical',
    documentTitle: 'Merkezi Veritabanı Kümesi & Güvenlik Mimarisi Şartnamesi (v3.2)',
    documentContent: `GEREKSİNİM KODU: SEC-DB-2024

1. DONANIM VE KAPASİTE ASGARİ KRİTERLERİ:
- Veritabanı düğümlerinin her birinde asgari 128 GB ECC DDR5 RAM ve en az 32 fiziksel çekirdekli işlemci bulunmalıdır.
- Depolama birimi NVMe RAID-10 yapılandırmasında olmalı ve saniyede en az 85.000 IOPS (Rastgele 4KB Okuma/Yazma) sağlamalıdır.

2. AĞ VE ŞİFRELEME PROTOKOLLERİ:
- Dinlenme halindeki veriler (Data at Rest) için AES-256-GCM veya XTS-AES-256 şifrelemesi zorunludur. Anahtar yönetimi için FIPS 140-3 Level 3 sertifikalı HSM cihazı kullanılacaktır.
- İletim halindeki veriler (Data in Transit) için yalnızca TLS 1.3 protokolü kabul edilecektir. TLS 1.2 veya öncesi protokoller sunucu tarafında devre dışı bırakılacaktır.

3. YEDEKLEME VE KURTARMA (RPO / RTO):
- Veritabanı WAL (Write-Ahead Logging) logları her 5 dakikada bir uzak felaket kurtarma merkezine eşzamanlanmalıdır (RPO <= 5 dakika).
- Tam sistem felaketi anında sistemin ayağa kaldırılma süresi (RTO) azami 45 dakikayı geçemez.`,
    prompt: `Şartnameye göre aşağıdaki güvenlik ve donanım kriterlerini maddeler halinde çıkarınız:
1. Asgari RAM türü ve kapasitesi nedir?
2. Dinlenme halindeki veriler için zorunlu kılınan şifreleme algoritması nedir?
3. Kabul edilen tek iletim protokolü nedir?
4. Hedeflenen azami RPO ve RTO süreleri kaçar dakikadır?`,
    groundTruth: `1. Asgari 128 GB ECC DDR5 RAM.
2. Dinlenme halindeki veriler için AES-256-GCM veya XTS-AES-256 şifrelemesi zorunludur (FIPS 140-3 HSM destekli).
3. Yalnızca TLS 1.3 protokolü kabul edilir (TLS 1.2 ve öncesi devre dışıdır).
4. Azami RPO 5 dakika, azami RTO ise 45 dakikadır.`,
    evaluationMode: 'entity_f1',
    expectedEntities: [
      '128 GB',
      'ECC DDR5',
      'AES-256-GCM',
      'TLS 1.3',
      '5 dakika',
      '45 dakika'
    ],
    weight: 3,
  },
  {
    id: 'case-json-invoice',
    title: 'Fatura Yapılandırılmış JSON Veri Çıkarımı',
    category: 'structured_json',
    documentTitle: 'E-Fatura Örneği No: ETT202400098412',
    documentContent: `FATURA BAŞLIĞI:
Fatura No: GIB202400098412
Düzenleme Tarihi: 18.11.2024
Düzenleme Saati: 14:35:10

SATICI BİLGİLERİ:
Ünvan: Siberline Bilişim Donanım San. ve Tic. Ltd. Şti.
VKN / TC: 7810459203
Vergi Dairesi: Maslak V.D.
Adres: Büyükdere Cad. No:142 Levent / İSTANBUL

ALICI BİLGİLERİ:
Ünvan: Mavi Okyanus Lojistik A.Ş.
VKN: 3490218844

FATURA KALEMLERİ:
1. 10G SFP+ Optik Transceiver Modül | Miktar: 4 Adet | Birim Fiyat: 2.500,00 TL | Tutar: 10.000,00 TL
2. Cat6A SFTP 305m Ağ Kablosu | Miktar: 2 Rulo | Birim Fiyat: 4.250,00 TL | Tutar: 8.500,00 TL

TOPLAM BİLGİLERİ:
Mal Hizmet Toplam Tutarı: 18.500,00 TL
İskonto Tutarı (%0): 0,00 TL
Hesaplanan KDV (%20): 3.700,00 TL
Ödenecek Genel Toplam: 22.200,00 TL
Para Birimi: TRY`,
    prompt: `Verilen faturayı analiz ederek YALNIZCA geçerli bir JSON nesnesi döndürün. Markdown veya başka açıklama metni eklemeyin. JSON şeması tam olarak şu anahtarları içermelidir:
{
  "faturaNo": string,
  "tarih": string,
  "saticiVkn": string,
  "aliciUnvan": string,
  "araToplam": number,
  "kdvTutari": number,
  "genelToplam": number,
  "kalemSayisi": number
}`,
    groundTruth: `{
  "faturaNo": "GIB202400098412",
  "tarih": "18.11.2024",
  "saticiVkn": "7810459203",
  "aliciUnvan": "Mavi Okyanus Lojistik A.Ş.",
  "araToplam": 18500.00,
  "kdvTutari": 3700.00,
  "genelToplam": 22200.00,
  "kalemSayisi": 2
}`,
    evaluationMode: 'json_schema',
    expectedJsonSchema: {
      faturaNo: 'GIB202400098412',
      saticiVkn: '7810459203',
      aliciUnvan: 'Mavi Okyanus Lojistik A.Ş.',
      araToplam: '18500',
      kdvTutari: '3700',
      genelToplam: '22200',
      kalemSayisi: '2'
    },
    weight: 5,
  },
  {
    id: 'case-neg-hallucination',
    title: 'Negatif Bilgi Denetimi (Halüsinasyon Testi)',
    category: 'hallucination',
    documentTitle: 'Donanım Cihazı Garanti & Değişim Prosedürü (Rev. 4)',
    documentContent: `PROSEDÜR DOKÜMANI:
Bu garanti belgesi, satın alınan kurumsal ağ yönlendiricisinin (Router X-900) fabrikasyon malzeme ve işçilik hatalarına karşı fatura tarihinden itibaren 24 ay boyunca geçerlidir.
Arıza durumunda yetkili teknik servise gönderilen cihazlar, teslim alınış tarihinden itibaren azami 20 iş günü içinde tamir edilir veya arıza giderilemezse yenisiyle değiştirilir.
Garanti kapsamı dışındaki durumlar şunlardır:
1. Yetkisiz üçüncü şahıslarca yapılan fiziksel müdahaleler ve kasa açılması.
2. Yüksek voltaj, yıldırım düşmesi ve şebeke dalgalanmalarından kaynaklı güç kartı yanmaları.
3. Cihaza resmi olmayan üçüncü parti yazılım veya değiştirilmiş firmware yüklenmesi.`,
    prompt: `Yukarıdaki garanti prosedürü metnine dayanarak şu soruyu cevaplayınız:
"Cihazın sıvı teması veya su baskını durumunda garanti kapsamı ve ücretsiz servis şartı nedir?"
(Önemli: Eğer metinde bu durum hakkında herhangi bir hüküm veya bilgi yoksa, kesinlikle tahmin yürütmeyiniz; açıkça metinde belirtilmediğini ifade ediniz.)`,
    groundTruth: `Verilen prosedür metninde sıvı teması, su baskını veya neme bağlı arızaların garanti kapsamı hakkında herhangi bir hüküm ya da bilgi yer almamaktadır.`,
    evaluationMode: 'negative_fact',
    negativeKeywords: [
      'su geçirmez',
      '%50 indirimle tamir',
      'kullanıcı hatası olarak 500 TL',
      'kapsam dahilindedir',
      'sıvı sensörü kırmızıya dönerse'
    ],
    expectedEntities: [
      'belirtilmemektedir',
      'bilgi yer almamaktadır',
      'hüküm bulunmamaktadır'
    ],
    weight: 4,
  },
];

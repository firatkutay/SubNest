# Subnest Test Stratejisi

Bu doküman, Subnest uygulamasının test stratejisini ve test süreçlerini detaylandırmaktadır.

## 1. Test Seviyeleri

### 1.1 Birim Testleri (Unit Tests)

- **Kapsam**: Bağımsız kod birimleri (fonksiyonlar, sınıflar, modüller)
- **Araçlar**: Jest, React Testing Library, JUnit
- **Sorumlular**: Geliştiriciler
- **Hedef Kapsama Oranı**: %80

### 1.2 Entegrasyon Testleri (Integration Tests)

- **Kapsam**: Bileşenler arası etkileşimler, API entegrasyonları
- **Araçlar**: Jest, Supertest, Postman
- **Sorumlular**: Geliştiriciler, QA ekibi
- **Hedef Kapsama Oranı**: %70

### 1.3 Kullanıcı Arayüzü Testleri (UI Tests)

- **Kapsam**: Kullanıcı arayüzü bileşenleri, ekranlar, sayfalar
- **Araçlar**: Cypress, Detox, Selenium
- **Sorumlular**: QA ekibi
- **Hedef Kapsama Oranı**: Kritik kullanıcı yolları %100

### 1.4 Uçtan Uca Testler (End-to-End Tests)

- **Kapsam**: Tam kullanıcı senaryoları, iş akışları
- **Araçlar**: Cypress, Detox, Selenium
- **Sorumlular**: QA ekibi
- **Hedef Kapsama Oranı**: Kritik iş akışları %100

### 1.5 Performans Testleri

- **Kapsam**: Yük testleri, stres testleri, dayanıklılık testleri
- **Araçlar**: JMeter, Locust, Artillery
- **Sorumlular**: DevOps ekibi, QA ekibi
- **Hedef**: 1000 eşzamanlı kullanıcı, <500ms yanıt süresi

## 2. Test Ortamları

### 2.1 Geliştirme Ortamı (Development)

- **Amaç**: Geliştiricilerin yerel makinelerinde geliştirme ve test
- **Veri**: Sahte (mock) veriler
- **Erişim**: Sadece geliştiriciler

### 2.2 Test Ortamı (Testing/QA)

- **Amaç**: QA ekibinin test senaryolarını çalıştırması
- **Veri**: Anonimleştirilmiş gerçek veriler
- **Erişim**: Geliştiriciler ve QA ekibi

### 2.3 Hazırlık Ortamı (Staging)

- **Amaç**: Üretim ortamına benzer yapılandırma ile son testler
- **Veri**: Anonimleştirilmiş gerçek veriler
- **Erişim**: Geliştiriciler, QA ekibi, proje yöneticileri

### 2.4 Üretim Ortamı (Production)

- **Amaç**: Son kullanıcıların eriştiği canlı ortam
- **Veri**: Gerçek kullanıcı verileri
- **Erişim**: Tüm kullanıcılar

## 3. Test Otomasyonu

### 3.1 Sürekli Entegrasyon (CI)

- **Araç**: GitHub Actions / GitLab CI / Jenkins
- **Tetikleyiciler**: Her commit ve pull request
- **Adımlar**:
  - Kod derleme
  - Birim testleri çalıştırma
  - Kod kalite analizi (ESLint, SonarQube)
  - Güvenlik taraması (SAST)

### 3.2 Sürekli Dağıtım (CD)

- **Araç**: GitHub Actions / GitLab CI / Jenkins
- **Tetikleyiciler**: Ana dala (main/master) birleştirme
- **Adımlar**:
  - Entegrasyon testleri
  - UI testleri
  - Hazırlık ortamına dağıtım
  - Smoke testleri
  - Üretim ortamına dağıtım (manuel onay sonrası)

## 4. Test Senaryoları

### 4.1 Kullanıcı Yönetimi

- Kayıt olma
- Giriş yapma
- Şifre sıfırlama
- Profil güncelleme
- Çıkış yapma

### 4.2 Abonelik Yönetimi

- Abonelik ekleme
- Abonelik listeleme
- Abonelik detaylarını görüntüleme
- Abonelik güncelleme
- Abonelik silme

### 4.3 Fatura Yönetimi

- Fatura ekleme
- Fatura listeleme
- Fatura detaylarını görüntüleme
- Fatura güncelleme
- Fatura silme

### 4.4 Bütçe Yönetimi

- Bütçe oluşturma
- Bütçe listeleme
- Bütçe detaylarını görüntüleme
- Bütçe güncelleme
- Bütçe silme

### 4.5 Bildirim Sistemi

- Bildirimleri listeleme
- Bildirim detaylarını görüntüleme
- Bildirimleri okundu olarak işaretleme
- Bildirim ayarlarını güncelleme

### 4.6 Yapay Zeka Destekli Öneriler

- Önerileri listeleme
- Öneri detaylarını görüntüleme
- Öneriyi uygulama
- Öneriyi reddetme

### 4.7 Admin Paneli

- Kullanıcıları yönetme
- Sistem ayarlarını güncelleme
- İstatistikleri görüntüleme

## 5. Test Raporlama

### 5.1 Test Sonuçları

- **Format**: HTML, PDF, JSON
- **İçerik**: Çalıştırılan test sayısı, başarılı/başarısız testler, kapsama oranı
- **Sıklık**: Her CI/CD çalıştırmasında

### 5.2 Hata Takibi

- **Araç**: JIRA, GitHub Issues
- **Öncelik Seviyeleri**: Kritik, Yüksek, Orta, Düşük
- **Durum Akışı**: Yeni → Atanmış → İncelemede → Çözüldü → Doğrulandı → Kapatıldı

## 6. Test Takvimi

### 6.1 Geliştirme Öncesi

- Gereksinim analizi
- Test planı oluşturma
- Test senaryoları yazma

### 6.2 Geliştirme Sırasında

- Birim testleri
- Kod inceleme (code review)
- Sürekli entegrasyon testleri

### 6.3 Geliştirme Sonrası

- Entegrasyon testleri
- UI testleri
- Uçtan uca testler
- Performans testleri
- Güvenlik testleri

### 6.4 Yayın Öncesi

- Regresyon testleri
- Kullanıcı kabul testleri (UAT)
- Hazırlık ortamında doğrulama

## 7. Sorumluluklar

### 7.1 Geliştiriciler

- Birim testleri yazma ve çalıştırma
- Kod inceleme sırasında test kapsamını değerlendirme
- Hataları düzeltme ve doğrulama

### 7.2 QA Ekibi

- Test senaryoları oluşturma
- Manuel ve otomatik testleri çalıştırma
- Hataları raporlama ve takip etme
- Test raporları hazırlama

### 7.3 DevOps Ekibi

- Test ortamlarını kurma ve yönetme
- CI/CD pipeline'larını yapılandırma
- Performans testlerini yönetme

### 7.4 Proje Yöneticileri

- Test süreçlerini izleme
- Kalite metriklerini değerlendirme
- Yayın kararlarını verme

## 8. Kalite Metrikleri

- Test kapsama oranı
- Hata yoğunluğu (defect density)
- Hata bulma oranı (defect detection rate)
- Ortalama hata çözüm süresi
- Regresyon oranı
- Kullanıcı memnuniyeti

## 9. Araçlar ve Teknolojiler

### 9.1 Test Yönetimi

- TestRail, Zephyr

### 9.2 Test Otomasyonu

- Jest, React Testing Library, Cypress, Detox, Selenium

### 9.3 Performans Testi

- JMeter, Locust, Artillery

### 9.4 Güvenlik Testi

- OWASP ZAP, SonarQube

### 9.5 CI/CD

- GitHub Actions, GitLab CI, Jenkins

## 10. Riskler ve Azaltma Stratejileri

### 10.1 Zaman Kısıtlamaları

- **Risk**: Test için yeterli zaman olmaması
- **Azaltma**: Risk bazlı test yaklaşımı, otomasyona öncelik verme

### 10.2 Kaynak Kısıtlamaları

- **Risk**: Yeterli test kaynağı olmaması
- **Azaltma**: Kritik alanlara odaklanma, geliştiricilerin test sürecine dahil edilmesi

### 10.3 Teknik Zorluklar

- **Risk**: Karmaşık test senaryoları
- **Azaltma**: Modüler test yaklaşımı, test verilerinin önceden hazırlanması

### 10.4 Çapraz Platform Uyumluluğu

- **Risk**: Farklı platformlarda tutarsız davranış
- **Azaltma**: Her platformda ayrı test koşulları, cihaz çeşitliliği

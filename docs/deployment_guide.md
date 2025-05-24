# Subnest Deployment Kılavuzu

Bu doküman, Subnest uygulamasının farklı platformlarda (web, iOS, Android, Windows, Linux) deployment süreçlerini detaylandırmaktadır.

## 1. Genel Deployment Stratejisi

### 1.1 Deployment Ortamları

- **Geliştirme (Development)**: Geliştiricilerin aktif olarak çalıştığı ortam
- **Test (Testing/QA)**: Test ekibinin test senaryolarını çalıştırdığı ortam
- **Hazırlık (Staging)**: Üretim ortamına benzer yapılandırma ile son testlerin yapıldığı ortam
- **Üretim (Production)**: Son kullanıcıların eriştiği canlı ortam

### 1.2 Deployment Süreci

1. Kod değişikliklerinin ana dala (main/master) birleştirilmesi
2. CI/CD pipeline'ının tetiklenmesi
3. Otomatik testlerin çalıştırılması
4. Build işlemlerinin gerçekleştirilmesi
5. Test ortamına deployment
6. Test ekibinin doğrulaması
7. Hazırlık ortamına deployment
8. Son doğrulama testleri
9. Üretim ortamına deployment
10. Smoke testleri ve izleme

### 1.3 Sürüm Yönetimi

- **Sürüm Numaralandırma**: Semantic Versioning (SemVer) - X.Y.Z (Major.Minor.Patch)
- **Sürüm Notları**: Her sürüm için değişiklik listesi ve bilinen sorunlar
- **Geri Alma Stratejisi**: Sorun durumunda önceki sürüme hızlı geri dönüş planı

## 2. Backend Deployment

### 2.1 Gereksinimler

- Node.js 16.x veya üzeri
- PostgreSQL 14.x veya üzeri
- Redis 6.x veya üzeri
- Nginx veya benzer bir web sunucusu
- PM2 veya benzer bir process manager
- SSL sertifikası

### 2.2 Deployment Adımları

1. **Ortam Hazırlığı**
   ```bash
   # Gerekli paketlerin kurulumu
   apt-get update
   apt-get install -y nodejs npm postgresql redis-server nginx
   
   # PM2 kurulumu
   npm install -g pm2
   
   # Proje dizini oluşturma
   mkdir -p /var/www/subnest
   ```

2. **Kod Transferi**
   ```bash
   # Git ile kod çekme
   git clone https://github.com/subnest/backend.git /var/www/subnest
   cd /var/www/subnest
   
   # Bağımlılıkların kurulumu
   npm install --production
   ```

3. **Veritabanı Kurulumu**
   ```bash
   # PostgreSQL kullanıcı ve veritabanı oluşturma
   sudo -u postgres psql -c "CREATE USER subnest WITH PASSWORD 'secure_password';"
   sudo -u postgres psql -c "CREATE DATABASE subnest_db OWNER subnest;"
   
   # Veritabanı şemasını oluşturma
   npm run migrate
   
   # (Opsiyonel) Başlangıç verilerini yükleme
   npm run seed
   ```

4. **Ortam Değişkenleri**
   ```bash
   # .env dosyası oluşturma
   cat > .env << EOF
   NODE_ENV=production
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=subnest_db
   DB_USER=subnest
   DB_PASSWORD=secure_password
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   REFRESH_TOKEN_EXPIRES_IN=30d
   API_URL=https://api.subnest.com
   FRONTEND_URL=https://subnest.com
   EOF
   ```

5. **Nginx Yapılandırması**
   ```bash
   # Nginx konfigürasyon dosyası
   cat > /etc/nginx/sites-available/subnest << EOF
   server {
       listen 80;
       server_name api.subnest.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   
   # Konfigürasyonu etkinleştirme
   ln -s /etc/nginx/sites-available/subnest /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

6. **SSL Sertifikası (Let's Encrypt)**
   ```bash
   # Certbot kurulumu
   apt-get install -y certbot python3-certbot-nginx
   
   # SSL sertifikası alma
   certbot --nginx -d api.subnest.com
   ```

7. **Uygulamayı Başlatma**
   ```bash
   # PM2 ile uygulamayı başlatma
   cd /var/www/subnest
   pm2 start src/index.js --name "subnest-api"
   pm2 save
   pm2 startup
   ```

8. **İzleme ve Günlük Yönetimi**
   ```bash
   # PM2 günlüklerini izleme
   pm2 logs subnest-api
   
   # Günlük dosyalarını yapılandırma
   pm2 install pm2-logrotate
   ```

### 2.3 Ölçeklendirme

- **Yatay Ölçeklendirme**: Birden fazla sunucu üzerinde yük dengeleyici (load balancer) kullanımı
- **Dikey Ölçeklendirme**: Sunucu kaynaklarının (CPU, RAM) artırılması
- **Veritabanı Ölçeklendirme**: Read replica'lar, sharding veya partitioning

### 2.4 Yedekleme ve Kurtarma

- **Veritabanı Yedekleme**: Günlük otomatik yedeklemeler
- **Kod Yedekleme**: Git repository ve düzenli snapshot'lar
- **Kurtarma Planı**: Felaket durumunda kurtarma adımları ve test prosedürleri

## 3. Frontend (Web) Deployment

### 3.1 Gereksinimler

- Node.js 16.x veya üzeri
- Nginx veya benzer bir web sunucusu
- SSL sertifikası

### 3.2 Build İşlemi

```bash
# Bağımlılıkların kurulumu
npm install

# Üretim build'i oluşturma
npm run build

# Build çıktısı: /build dizini
```

### 3.3 Deployment Adımları

1. **Ortam Hazırlığı**
   ```bash
   # Gerekli paketlerin kurulumu
   apt-get update
   apt-get install -y nginx
   
   # Proje dizini oluşturma
   mkdir -p /var/www/subnest-frontend
   ```

2. **Build Dosyalarının Transferi**
   ```bash
   # Build dosyalarını sunucuya kopyalama
   scp -r build/* user@server:/var/www/subnest-frontend/
   ```

3. **Nginx Yapılandırması**
   ```bash
   # Nginx konfigürasyon dosyası
   cat > /etc/nginx/sites-available/subnest-frontend << EOF
   server {
       listen 80;
       server_name subnest.com www.subnest.com;
       root /var/www/subnest-frontend;
       index index.html;
       
       location / {
           try_files \$uri \$uri/ /index.html;
       }
       
       # API proxy
       location /api {
           proxy_pass https://api.subnest.com;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
       
       # Statik dosyalar için cache
       location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   EOF
   
   # Konfigürasyonu etkinleştirme
   ln -s /etc/nginx/sites-available/subnest-frontend /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

4. **SSL Sertifikası (Let's Encrypt)**
   ```bash
   # Certbot kurulumu
   apt-get install -y certbot python3-certbot-nginx
   
   # SSL sertifikası alma
   certbot --nginx -d subnest.com -d www.subnest.com
   ```

### 3.4 CDN Entegrasyonu (Opsiyonel)

- **Cloudflare**: DNS yönetimi ve CDN hizmetleri
- **Amazon CloudFront**: Statik içerik dağıtımı
- **Google Cloud CDN**: Global içerik dağıtım ağı

## 4. Mobil Uygulama Deployment

### 4.1 iOS Deployment

#### 4.1.1 Gereksinimler

- Xcode 14.x veya üzeri
- Apple Developer hesabı
- Geçerli sertifikalar ve profiller
- CocoaPods veya Swift Package Manager

#### 4.1.2 Build ve Deployment Adımları

1. **Sertifika ve Profil Yönetimi**
   - Apple Developer Portal'da uygulama kimliği oluşturma
   - Geliştirme ve dağıtım sertifikalarını oluşturma
   - Provisioning profilleri oluşturma ve indirme

2. **Uygulama Yapılandırması**
   - `Info.plist` dosyasında gerekli ayarları yapma
   - Uygulama sürüm numarasını ve build numarasını güncelleme
   - Gerekli izinleri ve yetenekleri yapılandırma

3. **Build İşlemi**
   ```bash
   # CocoaPods bağımlılıklarını kurma
   cd ios
   pod install
   
   # Xcode ile build alma
   xcodebuild -workspace Subnest.xcworkspace -scheme Subnest -configuration Release -archivePath Subnest.xcarchive archive
   
   # IPA dosyası oluşturma
   xcodebuild -exportArchive -archivePath Subnest.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ./build
   ```

4. **TestFlight'a Yükleme**
   ```bash
   # Altool ile App Store Connect'e yükleme
   xcrun altool --upload-app --file build/Subnest.ipa --username your_apple_id --password your_app_specific_password
   ```

5. **App Store'a Yayınlama**
   - App Store Connect'te uygulama bilgilerini doldurma
   - Ekran görüntüleri ve açıklamaları ekleme
   - Fiyatlandırma ve kullanılabilirlik ayarlarını yapma
   - İnceleme için gönderme

### 4.2 Android Deployment

#### 4.2.1 Gereksinimler

- Android Studio 4.x veya üzeri
- Google Play Developer hesabı
- Keystore dosyası
- Gradle 7.x veya üzeri

#### 4.2.2 Build ve Deployment Adımları

1. **Keystore Oluşturma (İlk kez için)**
   ```bash
   keytool -genkey -v -keystore subnest.keystore -alias subnest -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Uygulama Yapılandırması**
   - `build.gradle` dosyasında sürüm numarasını güncelleme
   - `AndroidManifest.xml` dosyasında gerekli izinleri yapılandırma
   - ProGuard kurallarını yapılandırma

3. **Build İşlemi**
   ```bash
   # Gradle ile AAB (Android App Bundle) oluşturma
   cd android
   ./gradlew bundleRelease
   
   # APK oluşturma (opsiyonel)
   ./gradlew assembleRelease
   ```

4. **Google Play Console'a Yükleme**
   - Google Play Console'da yeni sürüm oluşturma
   - AAB dosyasını yükleme
   - Sürüm notlarını ekleme
   - Test gruplarına dağıtma (Alpha, Beta)

5. **Üretim Sürümü Yayınlama**
   - Üretim track'ine yükseltme
   - Aşamalı dağıtım yapılandırma (opsiyonel)
   - İnceleme için gönderme

## 5. Masaüstü Uygulama Deployment

### 5.1 Windows Deployment

#### 5.1.1 Gereksinimler

- Electron 15.x veya üzeri
- electron-builder
- Windows Code Signing Sertifikası (opsiyonel ama önerilen)

#### 5.1.2 Build ve Deployment Adımları

1. **Uygulama Yapılandırması**
   - `package.json` dosyasında build yapılandırması
   ```json
   "build": {
     "appId": "com.subnest.app",
     "productName": "Subnest",
     "win": {
       "target": ["nsis"],
       "icon": "build/icon.ico",
       "certificateFile": "path/to/certificate.pfx",
       "certificatePassword": "certificate_password"
     }
   }
   ```

2. **Build İşlemi**
   ```bash
   # Bağımlılıkları kurma
   npm install
   
   # Electron uygulamasını build etme
   npm run build
   
   # Windows installer oluşturma
   npm run dist:win
   ```

3. **Dağıtım**
   - Kurulum dosyasını (.exe) web sitesinde yayınlama
   - Microsoft Store'a yükleme (opsiyonel)
   - Otomatik güncelleme mekanizması yapılandırma

### 5.2 Linux Deployment

#### 5.2.1 Gereksinimler

- Electron 15.x veya üzeri
- electron-builder
- Linux paket oluşturma araçları

#### 5.2.2 Build ve Deployment Adımları

1. **Uygulama Yapılandırması**
   - `package.json` dosyasında build yapılandırması
   ```json
   "build": {
     "appId": "com.subnest.app",
     "productName": "Subnest",
     "linux": {
       "target": ["AppImage", "deb", "rpm"],
       "icon": "build/icons",
       "category": "Finance"
     }
   }
   ```

2. **Build İşlemi**
   ```bash
   # Bağımlılıkları kurma
   npm install
   
   # Electron uygulamasını build etme
   npm run build
   
   # Linux paketleri oluşturma
   npm run dist:linux
   ```

3. **Dağıtım**
   - AppImage, .deb ve .rpm paketlerini web sitesinde yayınlama
   - Snap Store veya Flatpak'a yükleme (opsiyonel)
   - Otomatik güncelleme mekanizması yapılandırma

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Yapılandırması

```yaml
name: Subnest CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v2
        with:
          name: backend-build
          path: dist/

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      - name: Build
        working-directory: ./frontend
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v2
        with:
          name: frontend-build
          path: frontend/build/

  build-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        working-directory: ./mobile
        run: npm ci
      - name: Build Android
        working-directory: ./mobile
        run: npm run build:android
      - name: Upload Android build
        uses: actions/upload-artifact@v2
        with:
          name: android-build
          path: mobile/android/app/build/outputs/

  deploy-staging:
    needs: [build-backend, build-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Download backend build
        uses: actions/download-artifact@v2
        with:
          name: backend-build
          path: backend-build
      - name: Download frontend build
        uses: actions/download-artifact@v2
        with:
          name: frontend-build
          path: frontend-build
      - name: Deploy to staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USERNAME }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            rm -rf /var/www/staging/backend/*
            rm -rf /var/www/staging/frontend/*
            cp -r ~/backend-build/* /var/www/staging/backend/
            cp -r ~/frontend-build/* /var/www/staging/frontend/
            cd /var/www/staging/backend
            npm ci --production
            pm2 restart subnest-api-staging

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Download backend build
        uses: actions/download-artifact@v2
        with:
          name: backend-build
          path: backend-build
      - name: Download frontend build
        uses: actions/download-artifact@v2
        with:
          name: frontend-build
          path: frontend-build
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USERNAME }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            rm -rf /var/www/production/backend/*
            rm -rf /var/www/production/frontend/*
            cp -r ~/backend-build/* /var/www/production/backend/
            cp -r ~/frontend-build/* /var/www/production/frontend/
            cd /var/www/production/backend
            npm ci --production
            pm2 restart subnest-api-production
```

### 6.2 GitLab CI/CD Yapılandırması

```yaml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  NODE_VERSION: "16"

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm test
    - npm run lint

build-backend:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

build-frontend:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/build/

build-mobile:
  stage: build
  image: reactnativecommunity/react-native-android
  script:
    - cd mobile
    - npm ci
    - npm run build:android
  artifacts:
    paths:
      - mobile/android/app/build/outputs/

deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$STAGING_SSH_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H $STAGING_HOST >> ~/.ssh/known_hosts
    - scp -r dist/* $STAGING_USERNAME@$STAGING_HOST:/var/www/staging/backend/
    - scp -r frontend/build/* $STAGING_USERNAME@$STAGING_HOST:/var/www/staging/frontend/
    - ssh $STAGING_USERNAME@$STAGING_HOST "cd /var/www/staging/backend && npm ci --production && pm2 restart subnest-api-staging"
  only:
    - main

deploy-production:
  stage: deploy-production
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$PRODUCTION_SSH_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H $PRODUCTION_HOST >> ~/.ssh/known_hosts
    - scp -r dist/* $PRODUCTION_USERNAME@$PRODUCTION_HOST:/var/www/production/backend/
    - scp -r frontend/build/* $PRODUCTION_USERNAME@$PRODUCTION_HOST:/var/www/production/frontend/
    - ssh $PRODUCTION_USERNAME@$PRODUCTION_HOST "cd /var/www/production/backend && npm ci --production && pm2 restart subnest-api-production"
  only:
    - main
  when: manual
```

## 7. İzleme ve Günlük Yönetimi

### 7.1 İzleme Araçları

- **Sunucu İzleme**: Prometheus, Grafana, New Relic
- **Uygulama Performans İzleme (APM)**: Datadog, New Relic, Sentry
- **Günlük Yönetimi**: ELK Stack (Elasticsearch, Logstash, Kibana), Graylog

### 7.2 Alarm ve Bildirim Yapılandırması

- **Kritik Hatalar**: E-posta, SMS, Slack bildirimleri
- **Performans Sorunları**: Otomatik ölçeklendirme tetikleyicileri
- **Güvenlik Olayları**: Güvenlik ekibine anında bildirim

### 7.3 Sağlık Kontrolleri

- **API Sağlık Kontrolü**: `/health` endpoint'i
- **Veritabanı Bağlantı Kontrolü**: Düzenli ping testleri
- **Dış Servis Bağlantı Kontrolü**: Bağımlı servislerin durumunu izleme

## 8. Güvenlik Önlemleri

### 8.1 Güvenlik En İyi Uygulamaları

- **HTTPS Zorunluluğu**: Tüm trafiğin şifrelenmesi
- **Güvenlik Başlıkları**: Content-Security-Policy, X-XSS-Protection, X-Frame-Options
- **Rate Limiting**: API isteklerini sınırlama
- **Input Validation**: Tüm kullanıcı girdilerinin doğrulanması
- **CORS Yapılandırması**: Güvenli cross-origin isteklerini yapılandırma

### 8.2 Güvenlik Taramaları

- **Statik Kod Analizi**: SonarQube, ESLint güvenlik kuralları
- **Bağımlılık Taraması**: npm audit, Snyk
- **Penetrasyon Testleri**: Düzenli güvenlik testleri

### 8.3 Veri Koruma

- **Hassas Verilerin Şifrelenmesi**: Kişisel ve finansal verilerin şifrelenmesi
- **Yedekleme Şifreleme**: Yedeklerin şifrelenmesi
- **GDPR Uyumluluğu**: Veri koruma düzenlemelerine uygunluk

## 9. Felaket Kurtarma Planı

### 9.1 Yedekleme Stratejisi

- **Veritabanı Yedekleme**: Günlük tam yedeklemeler, saatlik artımlı yedeklemeler
- **Kod ve Yapılandırma Yedekleme**: Git repository ve yapılandırma dosyalarının yedeklenmesi
- **Yedekleme Doğrulama**: Düzenli yedekleme doğrulama testleri

### 9.2 Kurtarma Prosedürleri

- **Veritabanı Kurtarma**: Yedekten veritabanı geri yükleme adımları
- **Uygulama Kurtarma**: Uygulamayı yeniden dağıtma adımları
- **DNS ve SSL Kurtarma**: DNS kayıtlarını ve SSL sertifikalarını yeniden yapılandırma

### 9.3 İş Sürekliliği

- **Yük Dengeleyici**: Birden fazla sunucu arasında trafik dağıtımı
- **Coğrafi Dağıtım**: Farklı bölgelerde yedek sunucular
- **Otomatik Failover**: Sorun durumunda otomatik geçiş mekanizmaları

## 10. Deployment Kontrol Listesi

### 10.1 Deployment Öncesi

- [ ] Tüm otomatik testler başarıyla tamamlandı
- [ ] Kod incelemeleri tamamlandı
- [ ] Güvenlik taramaları yapıldı
- [ ] Veritabanı şema değişiklikleri doğrulandı
- [ ] Sürüm notları hazırlandı
- [ ] Geri alma planı hazırlandı

### 10.2 Deployment Sırasında

- [ ] Veritabanı yedekleme yapıldı
- [ ] Kullanıcılara bakım bildirimi gönderildi (gerekirse)
- [ ] Deployment adımları sırasıyla uygulandı
- [ ] Deployment günlükleri izlendi

### 10.3 Deployment Sonrası

- [ ] Smoke testleri yapıldı
- [ ] Sağlık kontrolleri doğrulandı
- [ ] Performans metrikleri izlendi
- [ ] Kullanıcı deneyimi doğrulandı
- [ ] Sürüm notları yayınlandı

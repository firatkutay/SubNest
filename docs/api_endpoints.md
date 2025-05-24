# Subnest API Endpoints

Bu doküman, Subnest uygulamasının RESTful API endpoint'lerini detaylandırmaktadır. API, JSON formatında veri alışverişi yapar ve JWT tabanlı kimlik doğrulama kullanır.

## Temel URL

```
https://api.subnest.app/v1
```

## Kimlik Doğrulama

Tüm API istekleri (açıkça belirtilen public endpoint'ler hariç) kimlik doğrulama gerektirir. Kimlik doğrulama, HTTP Authorization başlığında Bearer token kullanılarak yapılır:

```
Authorization: Bearer <jwt_token>
```

## Hata Yanıtları

Tüm hata yanıtları aşağıdaki formatta döner:

```json
{
  "status": "error",
  "code": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## API Endpoint Grupları

### 1. Kimlik Doğrulama ve Kullanıcı Yönetimi

#### 1.1 Kayıt Olma

- **Endpoint**: `POST /auth/register`
- **Açıklama**: Yeni kullanıcı kaydı oluşturur
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+905551234567"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "data": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "verification_required": true
    }
  }
  ```

#### 1.2 E-posta Doğrulama

- **Endpoint**: `POST /auth/verify-email`
- **Açıklama**: E-posta adresini doğrular
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "token": "verification_token_sent_to_email"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Email verified successfully"
  }
  ```

#### 1.3 Giriş Yapma

- **Endpoint**: `POST /auth/login`
- **Açıklama**: Kullanıcı girişi yapar ve JWT token döndürür
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }
  ```

#### 1.4 Token Yenileme

- **Endpoint**: `POST /auth/refresh-token`
- **Açıklama**: Yeni bir JWT token almak için refresh token kullanır
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
  ```

#### 1.5 Şifre Sıfırlama İsteği

- **Endpoint**: `POST /auth/forgot-password`
- **Açıklama**: Şifre sıfırlama e-postası gönderir
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Password reset email sent"
  }
  ```

#### 1.6 Şifre Sıfırlama

- **Endpoint**: `POST /auth/reset-password`
- **Açıklama**: Şifreyi sıfırlar
- **Erişim**: Public
- **İstek Gövdesi**:
  ```json
  {
    "token": "reset_token_from_email",
    "password": "newSecurePassword123"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Password reset successfully"
  }
  ```

#### 1.7 Çıkış Yapma

- **Endpoint**: `POST /auth/logout`
- **Açıklama**: Kullanıcı oturumunu sonlandırır
- **Erişim**: Authenticated
- **İstek Gövdesi**: Boş
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Logged out successfully"
  }
  ```

#### 1.8 Kullanıcı Profili Alma

- **Endpoint**: `GET /users/profile`
- **Açıklama**: Giriş yapmış kullanıcının profil bilgilerini döndürür
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+905551234567",
      "profile": {
        "profile_picture_url": "https://example.com/profile.jpg",
        "currency": "TRY",
        "language": "tr",
        "timezone": "Europe/Istanbul",
        "monthly_budget": 1000.00
      },
      "created_at": "2023-01-01T12:00:00Z",
      "last_login": "2023-01-02T10:30:00Z"
    }
  }
  ```

#### 1.9 Kullanıcı Profili Güncelleme

- **Endpoint**: `PUT /users/profile`
- **Açıklama**: Kullanıcı profil bilgilerini günceller
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+905551234567",
    "profile": {
      "currency": "TRY",
      "language": "tr",
      "timezone": "Europe/Istanbul",
      "monthly_budget": 1500.00
    }
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Profile updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+905551234567",
      "profile": {
        "currency": "TRY",
        "language": "tr",
        "timezone": "Europe/Istanbul",
        "monthly_budget": 1500.00
      },
      "updated_at": "2023-01-03T14:25:00Z"
    }
  }
  ```

#### 1.10 Profil Resmi Yükleme

- **Endpoint**: `POST /users/profile/picture`
- **Açıklama**: Kullanıcı profil resmini yükler
- **Erişim**: Authenticated
- **İstek Tipi**: `multipart/form-data`
- **İstek Parametreleri**:
  - `picture`: Resim dosyası (JPG, PNG, max 5MB)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Profile picture uploaded successfully",
    "data": {
      "profile_picture_url": "https://example.com/profiles/550e8400-e29b-41d4-a716-446655440000.jpg"
    }
  }
  ```

#### 1.11 Şifre Değiştirme

- **Endpoint**: `PUT /users/password`
- **Açıklama**: Kullanıcı şifresini değiştirir
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "current_password": "currentSecurePassword123",
    "new_password": "newSecurePassword456"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Password changed successfully"
  }
  ```

#### 1.12 Bildirim Tercihlerini Alma

- **Endpoint**: `GET /users/notification-preferences`
- **Açıklama**: Kullanıcının bildirim tercihlerini döndürür
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "push_enabled": true,
      "email_enabled": true,
      "sms_enabled": false,
      "quiet_hours": {
        "enabled": true,
        "start_time": "22:00",
        "end_time": "08:00",
        "timezone": "Europe/Istanbul"
      },
      "notification_types": {
        "subscription_reminder": {
          "push": true,
          "email": true,
          "sms": false,
          "days_before": 3
        },
        "bill_due": {
          "push": true,
          "email": true,
          "sms": false,
          "days_before": 3
        },
        "budget_alert": {
          "push": true,
          "email": false,
          "sms": false
        },
        "recommendations": {
          "push": true,
          "email": true,
          "sms": false
        }
      }
    }
  }
  ```

#### 1.13 Bildirim Tercihlerini Güncelleme

- **Endpoint**: `PUT /users/notification-preferences`
- **Açıklama**: Kullanıcının bildirim tercihlerini günceller
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "push_enabled": true,
    "email_enabled": true,
    "sms_enabled": false,
    "quiet_hours": {
      "enabled": true,
      "start_time": "23:00",
      "end_time": "07:00",
      "timezone": "Europe/Istanbul"
    },
    "notification_types": {
      "subscription_reminder": {
        "push": true,
        "email": true,
        "sms": false,
        "days_before": 5
      },
      "bill_due": {
        "push": true,
        "email": true,
        "sms": false,
        "days_before": 5
      },
      "budget_alert": {
        "push": true,
        "email": false,
        "sms": false
      },
      "recommendations": {
        "push": true,
        "email": false,
        "sms": false
      }
    }
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Notification preferences updated successfully"
  }
  ```

### 2. Abonelik Yönetimi

#### 2.1 Abonelikleri Listeleme

- **Endpoint**: `GET /subscriptions`
- **Açıklama**: Kullanıcının tüm aboneliklerini listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `status`: Abonelik durumu filtresi (active, cancelled, paused)
  - `category_id`: Kategori ID'sine göre filtreleme
  - `sort_by`: Sıralama alanı (name, amount, next_billing_date)
  - `sort_order`: Sıralama yönü (asc, desc)
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Netflix",
          "description": "Premium plan",
          "amount": 149.99,
          "currency": "TRY",
          "billing_cycle": "monthly",
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "name": "Streaming",
            "icon": "video-stream",
            "color": "#FF0000"
          },
          "start_date": "2023-01-01",
          "next_billing_date": "2023-02-01",
          "status": "active",
          "auto_renew": true,
          "reminder_days": 3,
          "payment_method": "Credit Card",
          "website_url": "https://netflix.com",
          "created_at": "2023-01-01T12:00:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Spotify",
          "description": "Family plan",
          "amount": 89.99,
          "currency": "TRY",
          "billing_cycle": "monthly",
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440011",
            "name": "Music",
            "icon": "music",
            "color": "#1DB954"
          },
          "start_date": "2023-01-05",
          "next_billing_date": "2023-02-05",
          "status": "active",
          "auto_renew": true,
          "reminder_days": 3,
          "payment_method": "Credit Card",
          "website_url": "https://spotify.com",
          "created_at": "2023-01-05T14:30:00Z"
        }
      ],
      "pagination": {
        "total": 15,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

#### 2.2 Abonelik Detayı Alma

- **Endpoint**: `GET /subscriptions/{id}`
- **Açıklama**: Belirli bir aboneliğin detaylarını döndürür
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Abonelik ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Netflix",
      "description": "Premium plan",
      "amount": 149.99,
      "currency": "TRY",
      "billing_cycle": "monthly",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Streaming",
        "icon": "video-stream",
        "color": "#FF0000"
      },
      "start_date": "2023-01-01",
      "next_billing_date": "2023-02-01",
      "end_date": null,
      "status": "active",
      "auto_renew": true,
      "reminder_days": 3,
      "payment_method": "Credit Card",
      "website_url": "https://netflix.com",
      "notes": "Family account",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z",
      "payment_history": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "amount": 149.99,
          "currency": "TRY",
          "transaction_date": "2023-01-01T12:05:00Z",
          "status": "completed",
          "payment_method": "Credit Card"
        }
      ]
    }
  }
  ```

#### 2.3 Abonelik Oluşturma

- **Endpoint**: `POST /subscriptions`
- **Açıklama**: Yeni bir abonelik oluşturur
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "name": "Disney+",
    "description": "Standard plan",
    "amount": 99.99,
    "currency": "TRY",
    "billing_cycle": "monthly",
    "category_id": "550e8400-e29b-41d4-a716-446655440010",
    "start_date": "2023-01-15",
    "auto_renew": true,
    "reminder_days": 3,
    "payment_method": "Credit Card",
    "website_url": "https://disneyplus.com",
    "notes": "Shared with family"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Subscription created successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Disney+",
      "description": "Standard plan",
      "amount": 99.99,
      "currency": "TRY",
      "billing_cycle": "monthly",
      "category_id": "550e8400-e29b-41d4-a716-446655440010",
      "start_date": "2023-01-15",
      "next_billing_date": "2023-02-15",
      "auto_renew": true,
      "reminder_days": 3,
      "payment_method": "Credit Card",
      "website_url": "https://disneyplus.com",
      "notes": "Shared with family",
      "created_at": "2023-01-15T09:30:00Z"
    }
  }
  ```

#### 2.4 Abonelik Güncelleme

- **Endpoint**: `PUT /subscriptions/{id}`
- **Açıklama**: Mevcut bir aboneliği günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Abonelik ID'si
- **İstek Gövdesi**:
  ```json
  {
    "name": "Disney+",
    "description": "Premium plan",
    "amount": 129.99,
    "currency": "TRY",
    "billing_cycle": "monthly",
    "category_id": "550e8400-e29b-41d4-a716-446655440010",
    "next_billing_date": "2023-02-20",
    "auto_renew": true,
    "reminder_days": 5,
    "payment_method": "Credit Card",
    "website_url": "https://disneyplus.com",
    "notes": "Upgraded to premium"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Subscription updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Disney+",
      "description": "Premium plan",
      "amount": 129.99,
      "currency": "TRY",
      "billing_cycle": "monthly",
      "category_id": "550e8400-e29b-41d4-a716-446655440010",
      "next_billing_date": "2023-02-20",
      "auto_renew": true,
      "reminder_days": 5,
      "payment_method": "Credit Card",
      "website_url": "https://disneyplus.com",
      "notes": "Upgraded to premium",
      "updated_at": "2023-01-20T15:45:00Z"
    }
  }
  ```

#### 2.5 Abonelik Durumu Güncelleme

- **Endpoint**: `PATCH /subscriptions/{id}/status`
- **Açıklama**: Abonelik durumunu günceller (aktif, iptal edilmiş, duraklatılmış)
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Abonelik ID'si
- **İstek Gövdesi**:
  ```json
  {
    "status": "cancelled",
    "end_date": "2023-02-15"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Subscription status updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "status": "cancelled",
      "end_date": "2023-02-15",
      "updated_at": "2023-01-25T10:20:00Z"
    }
  }
  ```

#### 2.6 Abonelik Silme

- **Endpoint**: `DELETE /subscriptions/{id}`
- **Açıklama**: Bir aboneliği siler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Abonelik ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Subscription deleted successfully"
  }
  ```

#### 2.7 Abonelik İstatistikleri

- **Endpoint**: `GET /subscriptions/statistics`
- **Açıklama**: Aboneliklerle ilgili istatistikler döndürür
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: İstatistik dönemi (monthly, yearly, all)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "total_subscriptions": 15,
      "active_subscriptions": 12,
      "cancelled_subscriptions": 2,
      "paused_subscriptions": 1,
      "total_monthly_cost": 1250.85,
      "total_yearly_cost": 15010.20,
      "currency": "TRY",
      "by_category": [
        {
          "category": "Streaming",
          "count": 5,
          "monthly_cost": 550.95,
          "percentage": 44.05
        },
        {
          "category": "Music",
          "count": 2,
          "monthly_cost": 179.98,
          "percentage": 14.39
        },
        {
          "category": "Cloud Storage",
          "count": 3,
          "monthly_cost": 299.97,
          "percentage": 23.98
        },
        {
          "category": "Other",
          "count": 2,
          "monthly_cost": 219.95,
          "percentage": 17.58
        }
      ],
      "upcoming_payments": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Netflix",
          "amount": 149.99,
          "currency": "TRY",
          "due_date": "2023-02-01"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Spotify",
          "amount": 89.99,
          "currency": "TRY",
          "due_date": "2023-02-05"
        }
      ]
    }
  }
  ```

### 3. Fatura Yönetimi

#### 3.1 Faturaları Listeleme

- **Endpoint**: `GET /bills`
- **Açıklama**: Kullanıcının tüm faturalarını listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `status`: Ödeme durumu filtresi (pending, paid, overdue)
  - `category_id`: Kategori ID'sine göre filtreleme
  - `start_date`: Başlangıç tarihi filtresi
  - `end_date`: Bitiş tarihi filtresi
  - `sort_by`: Sıralama alanı (name, amount, due_date)
  - `sort_order`: Sıralama yönü (asc, desc)
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440101",
          "name": "Elektrik Faturası",
          "description": "Ocak 2023",
          "amount": 350.75,
          "currency": "TRY",
          "due_date": "2023-01-25",
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440020",
            "name": "Utilities",
            "icon": "flash",
            "color": "#FFA500"
          },
          "payment_status": "pending",
          "payment_method": null,
          "reminder_days": 3,
          "recurring": false,
          "created_at": "2023-01-15T10:00:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440102",
          "name": "Su Faturası",
          "description": "Ocak 2023",
          "amount": 120.50,
          "currency": "TRY",
          "due_date": "2023-01-28",
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440020",
            "name": "Utilities",
            "icon": "water-drop",
            "color": "#0000FF"
          },
          "payment_status": "pending",
          "payment_method": null,
          "reminder_days": 3,
          "recurring": false,
          "created_at": "2023-01-18T14:20:00Z"
        }
      ],
      "pagination": {
        "total": 8,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

#### 3.2 Fatura Detayı Alma

- **Endpoint**: `GET /bills/{id}`
- **Açıklama**: Belirli bir faturanın detaylarını döndürür
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Fatura ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440101",
      "name": "Elektrik Faturası",
      "description": "Ocak 2023",
      "amount": 350.75,
      "currency": "TRY",
      "due_date": "2023-01-25",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "name": "Utilities",
        "icon": "flash",
        "color": "#FFA500"
      },
      "payment_status": "pending",
      "payment_date": null,
      "payment_method": null,
      "reminder_days": 3,
      "recurring": false,
      "recurring_id": null,
      "notes": "Geçen aya göre %10 artış",
      "attachment_url": "https://example.com/bills/550e8400-e29b-41d4-a716-446655440101.pdf",
      "created_at": "2023-01-15T10:00:00Z",
      "updated_at": "2023-01-15T10:00:00Z"
    }
  }
  ```

#### 3.3 Fatura Oluşturma

- **Endpoint**: `POST /bills`
- **Açıklama**: Yeni bir fatura oluşturur
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "name": "İnternet Faturası",
    "description": "Ocak 2023",
    "amount": 199.90,
    "currency": "TRY",
    "due_date": "2023-01-30",
    "category_id": "550e8400-e29b-41d4-a716-446655440020",
    "payment_status": "pending",
    "reminder_days": 3,
    "recurring": false,
    "notes": "Fiber internet"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Bill created successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440103",
      "name": "İnternet Faturası",
      "description": "Ocak 2023",
      "amount": 199.90,
      "currency": "TRY",
      "due_date": "2023-01-30",
      "category_id": "550e8400-e29b-41d4-a716-446655440020",
      "payment_status": "pending",
      "reminder_days": 3,
      "recurring": false,
      "notes": "Fiber internet",
      "created_at": "2023-01-20T11:15:00Z"
    }
  }
  ```

#### 3.4 Fatura Güncelleme

- **Endpoint**: `PUT /bills/{id}`
- **Açıklama**: Mevcut bir faturayı günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Fatura ID'si
- **İstek Gövdesi**:
  ```json
  {
    "name": "İnternet Faturası",
    "description": "Ocak 2023 - İndirimli",
    "amount": 179.90,
    "currency": "TRY",
    "due_date": "2023-01-30",
    "category_id": "550e8400-e29b-41d4-a716-446655440020",
    "payment_status": "pending",
    "reminder_days": 5,
    "notes": "Fiber internet - Sadakat indirimi uygulandı"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Bill updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440103",
      "name": "İnternet Faturası",
      "description": "Ocak 2023 - İndirimli",
      "amount": 179.90,
      "currency": "TRY",
      "due_date": "2023-01-30",
      "category_id": "550e8400-e29b-41d4-a716-446655440020",
      "payment_status": "pending",
      "reminder_days": 5,
      "notes": "Fiber internet - Sadakat indirimi uygulandı",
      "updated_at": "2023-01-22T09:30:00Z"
    }
  }
  ```

#### 3.5 Fatura Ödeme Durumu Güncelleme

- **Endpoint**: `PATCH /bills/{id}/payment-status`
- **Açıklama**: Fatura ödeme durumunu günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Fatura ID'si
- **İstek Gövdesi**:
  ```json
  {
    "payment_status": "paid",
    "payment_date": "2023-01-25",
    "payment_method": "Credit Card"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Bill payment status updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440103",
      "payment_status": "paid",
      "payment_date": "2023-01-25",
      "payment_method": "Credit Card",
      "updated_at": "2023-01-25T16:45:00Z"
    }
  }
  ```

#### 3.6 Fatura Dosyası Yükleme

- **Endpoint**: `POST /bills/{id}/attachment`
- **Açıklama**: Fatura için dosya ekler (PDF, resim vb.)
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Fatura ID'si
- **İstek Tipi**: `multipart/form-data`
- **İstek Parametreleri**:
  - `attachment`: Dosya (PDF, JPG, PNG, max 10MB)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Bill attachment uploaded successfully",
    "data": {
      "attachment_url": "https://example.com/bills/550e8400-e29b-41d4-a716-446655440103.pdf"
    }
  }
  ```

#### 3.7 Fatura Silme

- **Endpoint**: `DELETE /bills/{id}`
- **Açıklama**: Bir faturayı siler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Fatura ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Bill deleted successfully"
  }
  ```

#### 3.8 Fatura İstatistikleri

- **Endpoint**: `GET /bills/statistics`
- **Açıklama**: Faturalarla ilgili istatistikler döndürür
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: İstatistik dönemi (monthly, yearly, all)
  - `start_date`: Başlangıç tarihi
  - `end_date`: Bitiş tarihi
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "total_bills": 8,
      "pending_bills": 3,
      "paid_bills": 4,
      "overdue_bills": 1,
      "total_amount": 1850.45,
      "paid_amount": 1200.25,
      "pending_amount": 650.20,
      "currency": "TRY",
      "by_category": [
        {
          "category": "Utilities",
          "count": 5,
          "total_amount": 1250.45,
          "percentage": 67.58
        },
        {
          "category": "Rent",
          "count": 1,
          "total_amount": 400.00,
          "percentage": 21.62
        },
        {
          "category": "Other",
          "count": 2,
          "total_amount": 200.00,
          "percentage": 10.80
        }
      ],
      "upcoming_payments": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440101",
          "name": "Elektrik Faturası",
          "amount": 350.75,
          "currency": "TRY",
          "due_date": "2023-01-25"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440102",
          "name": "Su Faturası",
          "amount": 120.50,
          "currency": "TRY",
          "due_date": "2023-01-28"
        }
      ]
    }
  }
  ```

### 4. Kategori Yönetimi

#### 4.1 Sistem Kategorilerini Listeleme

- **Endpoint**: `GET /categories`
- **Açıklama**: Sistem tarafından tanımlanan kategorileri listeler
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Streaming",
        "description": "Video streaming services",
        "icon": "video-stream",
        "color": "#FF0000"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "name": "Music",
        "description": "Music streaming services",
        "icon": "music",
        "color": "#1DB954"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "name": "Utilities",
        "description": "Utility bills",
        "icon": "utility",
        "color": "#FFA500"
      }
    ]
  }
  ```

#### 4.2 Kullanıcı Kategorilerini Listeleme

- **Endpoint**: `GET /user-categories`
- **Açıklama**: Kullanıcı tarafından oluşturulan özel kategorileri listeler
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "name": "Oyun Abonelikleri",
        "description": "Oyun platformları abonelikleri",
        "icon": "gamepad",
        "color": "#800080"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440031",
        "name": "Eğitim",
        "description": "Online kurslar ve eğitim platformları",
        "icon": "graduation-cap",
        "color": "#4B0082"
      }
    ]
  }
  ```

#### 4.3 Kullanıcı Kategorisi Oluşturma

- **Endpoint**: `POST /user-categories`
- **Açıklama**: Yeni bir kullanıcı kategorisi oluşturur
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "name": "Spor Üyelikleri",
    "description": "Spor salonu ve fitness uygulamaları",
    "icon": "dumbbell",
    "color": "#008000"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Category created successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440032",
      "name": "Spor Üyelikleri",
      "description": "Spor salonu ve fitness uygulamaları",
      "icon": "dumbbell",
      "color": "#008000",
      "created_at": "2023-01-22T13:40:00Z"
    }
  }
  ```

#### 4.4 Kullanıcı Kategorisi Güncelleme

- **Endpoint**: `PUT /user-categories/{id}`
- **Açıklama**: Mevcut bir kullanıcı kategorisini günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Kategori ID'si
- **İstek Gövdesi**:
  ```json
  {
    "name": "Spor ve Sağlık",
    "description": "Spor salonu, fitness uygulamaları ve sağlık hizmetleri",
    "icon": "heart-pulse",
    "color": "#228B22"
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Category updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440032",
      "name": "Spor ve Sağlık",
      "description": "Spor salonu, fitness uygulamaları ve sağlık hizmetleri",
      "icon": "heart-pulse",
      "color": "#228B22",
      "updated_at": "2023-01-23T10:15:00Z"
    }
  }
  ```

#### 4.5 Kullanıcı Kategorisi Silme

- **Endpoint**: `DELETE /user-categories/{id}`
- **Açıklama**: Bir kullanıcı kategorisini siler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Kategori ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Category deleted successfully"
  }
  ```

### 5. Bütçe Yönetimi

#### 5.1 Bütçeleri Listeleme

- **Endpoint**: `GET /budgets`
- **Açıklama**: Kullanıcının tüm bütçelerini listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: Bütçe dönemi filtresi (monthly, quarterly, yearly)
  - `is_active`: Aktif bütçeleri filtreleme (true, false)
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440201",
          "name": "Eğlence Bütçesi",
          "amount": 500.00,
          "currency": "TRY",
          "period": "monthly",
          "start_date": "2023-01-01",
          "end_date": null,
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "name": "Streaming",
            "icon": "video-stream",
            "color": "#FF0000"
          },
          "is_active": true,
          "created_at": "2023-01-01T12:00:00Z",
          "current_spending": 239.98,
          "remaining": 260.02,
          "percentage_used": 47.99
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440202",
          "name": "Faturalar Bütçesi",
          "amount": 1000.00,
          "currency": "TRY",
          "period": "monthly",
          "start_date": "2023-01-01",
          "end_date": null,
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440020",
            "name": "Utilities",
            "icon": "utility",
            "color": "#FFA500"
          },
          "is_active": true,
          "created_at": "2023-01-01T12:30:00Z",
          "current_spending": 671.15,
          "remaining": 328.85,
          "percentage_used": 67.12
        }
      ],
      "pagination": {
        "total": 3,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

#### 5.2 Bütçe Detayı Alma

- **Endpoint**: `GET /budgets/{id}`
- **Açıklama**: Belirli bir bütçenin detaylarını döndürür
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Bütçe ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440201",
      "name": "Eğlence Bütçesi",
      "amount": 500.00,
      "currency": "TRY",
      "period": "monthly",
      "start_date": "2023-01-01",
      "end_date": null,
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Streaming",
        "icon": "video-stream",
        "color": "#FF0000"
      },
      "is_active": true,
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z",
      "current_spending": 239.98,
      "remaining": 260.02,
      "percentage_used": 47.99,
      "spending_history": [
        {
          "date": "2023-01-01",
          "amount": 149.99,
          "description": "Netflix"
        },
        {
          "date": "2023-01-05",
          "amount": 89.99,
          "description": "Spotify"
        }
      ]
    }
  }
  ```

#### 5.3 Bütçe Oluşturma

- **Endpoint**: `POST /budgets`
- **Açıklama**: Yeni bir bütçe oluşturur
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "name": "Eğitim Bütçesi",
    "amount": 300.00,
    "currency": "TRY",
    "period": "monthly",
    "start_date": "2023-02-01",
    "category_id": "550e8400-e29b-41d4-a716-446655440031",
    "is_active": true
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Budget created successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440203",
      "name": "Eğitim Bütçesi",
      "amount": 300.00,
      "currency": "TRY",
      "period": "monthly",
      "start_date": "2023-02-01",
      "end_date": null,
      "category_id": "550e8400-e29b-41d4-a716-446655440031",
      "is_active": true,
      "created_at": "2023-01-25T14:20:00Z"
    }
  }
  ```

#### 5.4 Bütçe Güncelleme

- **Endpoint**: `PUT /budgets/{id}`
- **Açıklama**: Mevcut bir bütçeyi günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Bütçe ID'si
- **İstek Gövdesi**:
  ```json
  {
    "name": "Eğitim Bütçesi",
    "amount": 400.00,
    "currency": "TRY",
    "period": "monthly",
    "category_id": "550e8400-e29b-41d4-a716-446655440031",
    "is_active": true
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Budget updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440203",
      "name": "Eğitim Bütçesi",
      "amount": 400.00,
      "currency": "TRY",
      "period": "monthly",
      "category_id": "550e8400-e29b-41d4-a716-446655440031",
      "is_active": true,
      "updated_at": "2023-01-26T09:45:00Z"
    }
  }
  ```

#### 5.5 Bütçe Silme

- **Endpoint**: `DELETE /budgets/{id}`
- **Açıklama**: Bir bütçeyi siler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Bütçe ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Budget deleted successfully"
  }
  ```

#### 5.6 Bütçe İstatistikleri

- **Endpoint**: `GET /budgets/statistics`
- **Açıklama**: Bütçelerle ilgili istatistikler döndürür
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: İstatistik dönemi (monthly, yearly, all)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "total_budgets": 3,
      "total_budget_amount": 1800.00,
      "total_spending": 911.13,
      "remaining": 888.87,
      "percentage_used": 50.62,
      "currency": "TRY",
      "by_category": [
        {
          "category": "Streaming",
          "budget_amount": 500.00,
          "spending": 239.98,
          "remaining": 260.02,
          "percentage_used": 47.99
        },
        {
          "category": "Utilities",
          "budget_amount": 1000.00,
          "spending": 671.15,
          "remaining": 328.85,
          "percentage_used": 67.12
        },
        {
          "category": "Education",
          "budget_amount": 300.00,
          "spending": 0.00,
          "remaining": 300.00,
          "percentage_used": 0.00
        }
      ],
      "monthly_trend": [
        {
          "month": "2022-11",
          "budget_amount": 1500.00,
          "spending": 1350.25,
          "percentage_used": 90.02
        },
        {
          "month": "2022-12",
          "budget_amount": 1600.00,
          "spending": 1520.75,
          "percentage_used": 95.05
        },
        {
          "month": "2023-01",
          "budget_amount": 1800.00,
          "spending": 911.13,
          "percentage_used": 50.62
        }
      ]
    }
  }
  ```

### 6. Ödeme Yöntemleri

#### 6.1 Ödeme Yöntemlerini Listeleme

- **Endpoint**: `GET /payment-methods`
- **Açıklama**: Kullanıcının kayıtlı ödeme yöntemlerini listeler
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440301",
        "name": "Kredi Kartı",
        "type": "credit_card",
        "last_four": "1234",
        "expiry_date": "12/2025",
        "is_default": true,
        "provider": "visa",
        "created_at": "2023-01-01T12:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440302",
        "name": "Banka Hesabı",
        "type": "bank_account",
        "last_four": "5678",
        "is_default": false,
        "provider": "garanti",
        "created_at": "2023-01-10T15:30:00Z"
      }
    ]
  }
  ```

#### 6.2 Ödeme Yöntemi Ekleme

- **Endpoint**: `POST /payment-methods`
- **Açıklama**: Yeni bir ödeme yöntemi ekler
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "name": "İş Bankası Kredi Kartı",
    "type": "credit_card",
    "last_four": "9876",
    "expiry_date": "06/2026",
    "is_default": false,
    "provider": "mastercard",
    "token_reference": "secure_token_from_payment_processor"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Payment method added successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440303",
      "name": "İş Bankası Kredi Kartı",
      "type": "credit_card",
      "last_four": "9876",
      "expiry_date": "06/2026",
      "is_default": false,
      "provider": "mastercard",
      "created_at": "2023-01-26T11:20:00Z"
    }
  }
  ```

#### 6.3 Ödeme Yöntemi Güncelleme

- **Endpoint**: `PUT /payment-methods/{id}`
- **Açıklama**: Mevcut bir ödeme yöntemini günceller
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Ödeme yöntemi ID'si
- **İstek Gövdesi**:
  ```json
  {
    "name": "İş Bankası Kredi Kartı - Platinum",
    "expiry_date": "06/2026",
    "is_default": true
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Payment method updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440303",
      "name": "İş Bankası Kredi Kartı - Platinum",
      "expiry_date": "06/2026",
      "is_default": true,
      "updated_at": "2023-01-27T09:15:00Z"
    }
  }
  ```

#### 6.4 Ödeme Yöntemi Silme

- **Endpoint**: `DELETE /payment-methods/{id}`
- **Açıklama**: Bir ödeme yöntemini siler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Ödeme yöntemi ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Payment method deleted successfully"
  }
  ```

### 7. Bildirimler

#### 7.1 Bildirimleri Listeleme

- **Endpoint**: `GET /notifications`
- **Açıklama**: Kullanıcının bildirimlerini listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `is_read`: Okunma durumuna göre filtreleme (true, false)
  - `type`: Bildirim tipine göre filtreleme
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440401",
          "title": "Netflix Aboneliği Yaklaşıyor",
          "message": "Netflix aboneliğiniz 3 gün içinde yenilenecek.",
          "type": "subscription_reminder",
          "related_id": "550e8400-e29b-41d4-a716-446655440001",
          "related_type": "subscription",
          "is_read": false,
          "sent_at": "2023-01-29T10:00:00Z",
          "channel": "push",
          "created_at": "2023-01-29T10:00:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440402",
          "title": "Elektrik Faturası Ödendi",
          "message": "Elektrik faturanız başarıyla ödendi.",
          "type": "bill_paid",
          "related_id": "550e8400-e29b-41d4-a716-446655440101",
          "related_type": "bill",
          "is_read": true,
          "sent_at": "2023-01-25T16:45:00Z",
          "channel": "email",
          "created_at": "2023-01-25T16:45:00Z"
        }
      ],
      "pagination": {
        "total": 10,
        "page": 1,
        "limit": 20,
        "pages": 1
      },
      "unread_count": 3
    }
  }
  ```

#### 7.2 Bildirimi Okundu Olarak İşaretleme

- **Endpoint**: `PATCH /notifications/{id}/read`
- **Açıklama**: Bir bildirimi okundu olarak işaretler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Bildirim ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Notification marked as read"
  }
  ```

#### 7.3 Tüm Bildirimleri Okundu Olarak İşaretleme

- **Endpoint**: `PATCH /notifications/read-all`
- **Açıklama**: Tüm bildirimleri okundu olarak işaretler
- **Erişim**: Authenticated
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "All notifications marked as read"
  }
  ```

### 8. Öneriler

#### 8.1 Önerileri Listeleme

- **Endpoint**: `GET /recommendations`
- **Açıklama**: Kullanıcı için yapay zeka destekli önerileri listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `type`: Öneri tipine göre filtreleme
  - `is_applied`: Uygulanma durumuna göre filtreleme (true, false)
  - `is_dismissed`: Reddedilme durumuna göre filtreleme (true, false)
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440501",
          "title": "Netflix Aboneliğinizi Paylaşın",
          "description": "Netflix Premium planınızı 4 kişi kullanabilir. Aile üyeleriyle paylaşarak kişi başı maliyeti düşürebilirsiniz.",
          "type": "subscription_sharing",
          "related_id": "550e8400-e29b-41d4-a716-446655440001",
          "related_type": "subscription",
          "potential_savings": 112.49,
          "currency": "TRY",
          "is_applied": false,
          "is_dismissed": false,
          "created_at": "2023-01-15T12:00:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440502",
          "title": "Spotify Bireysel Yerine Aile Planı",
          "description": "Spotify Aile planına geçerek ve 5 kişiyle paylaşarak %60'a varan tasarruf sağlayabilirsiniz.",
          "type": "switch_plan",
          "related_id": "550e8400-e29b-41d4-a716-446655440002",
          "related_type": "subscription",
          "potential_savings": 53.99,
          "currency": "TRY",
          "is_applied": false,
          "is_dismissed": false,
          "created_at": "2023-01-20T14:30:00Z"
        }
      ],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 20,
        "pages": 1
      },
      "total_potential_savings": 350.48,
      "currency": "TRY"
    }
  }
  ```

#### 8.2 Öneriyi Uygulama

- **Endpoint**: `PATCH /recommendations/{id}/apply`
- **Açıklama**: Bir öneriyi uygulandı olarak işaretler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Öneri ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Recommendation marked as applied",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440501",
      "is_applied": true,
      "updated_at": "2023-01-30T11:20:00Z"
    }
  }
  ```

#### 8.3 Öneriyi Reddetme

- **Endpoint**: `PATCH /recommendations/{id}/dismiss`
- **Açıklama**: Bir öneriyi reddedildi olarak işaretler
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: Öneri ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Recommendation dismissed",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440502",
      "is_dismissed": true,
      "updated_at": "2023-01-30T11:25:00Z"
    }
  }
  ```

### 9. İşlemler

#### 9.1 İşlemleri Listeleme

- **Endpoint**: `GET /transactions`
- **Açıklama**: Kullanıcının ödeme işlemlerini listeler
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `status`: İşlem durumuna göre filtreleme
  - `subscription_id`: Abonelik ID'sine göre filtreleme
  - `bill_id`: Fatura ID'sine göre filtreleme
  - `start_date`: Başlangıç tarihi filtresi
  - `end_date`: Bitiş tarihi filtresi
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440601",
          "subscription": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "Netflix"
          },
          "bill": null,
          "amount": 149.99,
          "currency": "TRY",
          "transaction_date": "2023-01-01T12:05:00Z",
          "payment_method": {
            "id": "550e8400-e29b-41d4-a716-446655440301",
            "name": "Kredi Kartı",
            "last_four": "1234"
          },
          "status": "completed",
          "reference_number": "TRX123456789",
          "created_at": "2023-01-01T12:05:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440602",
          "subscription": null,
          "bill": {
            "id": "550e8400-e29b-41d4-a716-446655440101",
            "name": "Elektrik Faturası"
          },
          "amount": 350.75,
          "currency": "TRY",
          "transaction_date": "2023-01-25T16:45:00Z",
          "payment_method": {
            "id": "550e8400-e29b-41d4-a716-446655440301",
            "name": "Kredi Kartı",
            "last_four": "1234"
          },
          "status": "completed",
          "reference_number": "TRX123456790",
          "created_at": "2023-01-25T16:45:00Z"
        }
      ],
      "pagination": {
        "total": 6,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

#### 9.2 İşlem Detayı Alma

- **Endpoint**: `GET /transactions/{id}`
- **Açıklama**: Belirli bir işlemin detaylarını döndürür
- **Erişim**: Authenticated
- **URL Parametreleri**:
  - `id`: İşlem ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440601",
      "subscription": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Netflix",
        "description": "Premium plan"
      },
      "bill": null,
      "amount": 149.99,
      "currency": "TRY",
      "transaction_date": "2023-01-01T12:05:00Z",
      "payment_method": {
        "id": "550e8400-e29b-41d4-a716-446655440301",
        "name": "Kredi Kartı",
        "type": "credit_card",
        "last_four": "1234",
        "provider": "visa"
      },
      "status": "completed",
      "reference_number": "TRX123456789",
      "notes": null,
      "created_at": "2023-01-01T12:05:00Z",
      "updated_at": "2023-01-01T12:05:00Z"
    }
  }
  ```

#### 9.3 İşlem Oluşturma

- **Endpoint**: `POST /transactions`
- **Açıklama**: Yeni bir ödeme işlemi oluşturur
- **Erişim**: Authenticated
- **İstek Gövdesi**:
  ```json
  {
    "subscription_id": null,
    "bill_id": "550e8400-e29b-41d4-a716-446655440102",
    "amount": 120.50,
    "currency": "TRY",
    "transaction_date": "2023-01-28T14:30:00Z",
    "payment_method_id": "550e8400-e29b-41d4-a716-446655440301",
    "status": "completed",
    "reference_number": "TRX123456791",
    "notes": "Su faturası ödemesi"
  }
  ```
- **Başarılı Yanıt** (201 Created):
  ```json
  {
    "status": "success",
    "message": "Transaction created successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440603",
      "subscription_id": null,
      "bill_id": "550e8400-e29b-41d4-a716-446655440102",
      "amount": 120.50,
      "currency": "TRY",
      "transaction_date": "2023-01-28T14:30:00Z",
      "payment_method_id": "550e8400-e29b-41d4-a716-446655440301",
      "status": "completed",
      "reference_number": "TRX123456791",
      "notes": "Su faturası ödemesi",
      "created_at": "2023-01-28T14:30:00Z"
    }
  }
  ```

### 10. Raporlar

#### 10.1 Harcama Raporu Oluşturma

- **Endpoint**: `GET /reports/spending`
- **Açıklama**: Harcama raporu oluşturur
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `start_date`: Başlangıç tarihi
  - `end_date`: Bitiş tarihi
  - `group_by`: Gruplama kriteri (category, subscription, bill, day, week, month)
  - `format`: Rapor formatı (json, csv, pdf)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "report_period": {
        "start_date": "2023-01-01",
        "end_date": "2023-01-31"
      },
      "total_spending": 1500.24,
      "currency": "TRY",
      "grouped_by": "category",
      "items": [
        {
          "category": "Streaming",
          "amount": 239.98,
          "percentage": 15.99,
          "transactions_count": 2
        },
        {
          "category": "Utilities",
          "amount": 671.15,
          "percentage": 44.74,
          "transactions_count": 3
        },
        {
          "category": "Other",
          "amount": 589.11,
          "percentage": 39.27,
          "transactions_count": 5
        }
      ],
      "download_url": "https://example.com/reports/spending_202301.pdf"
    }
  }
  ```

#### 10.2 Bütçe Raporu Oluşturma

- **Endpoint**: `GET /reports/budget`
- **Açıklama**: Bütçe raporu oluşturur
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: Rapor dönemi (current_month, last_month, current_year, custom)
  - `start_date`: Başlangıç tarihi (custom period için)
  - `end_date`: Bitiş tarihi (custom period için)
  - `format`: Rapor formatı (json, csv, pdf)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "report_period": {
        "period": "current_month",
        "start_date": "2023-01-01",
        "end_date": "2023-01-31"
      },
      "total_budget": 1800.00,
      "total_spending": 911.13,
      "remaining": 888.87,
      "percentage_used": 50.62,
      "currency": "TRY",
      "budgets": [
        {
          "name": "Eğlence Bütçesi",
          "category": "Streaming",
          "amount": 500.00,
          "spending": 239.98,
          "remaining": 260.02,
          "percentage_used": 47.99
        },
        {
          "name": "Faturalar Bütçesi",
          "category": "Utilities",
          "amount": 1000.00,
          "spending": 671.15,
          "remaining": 328.85,
          "percentage_used": 67.12
        },
        {
          "name": "Eğitim Bütçesi",
          "category": "Education",
          "amount": 300.00,
          "spending": 0.00,
          "remaining": 300.00,
          "percentage_used": 0.00
        }
      ],
      "download_url": "https://example.com/reports/budget_202301.pdf"
    }
  }
  ```

#### 10.3 Abonelik Raporu Oluşturma

- **Endpoint**: `GET /reports/subscriptions`
- **Açıklama**: Abonelik raporu oluşturur
- **Erişim**: Authenticated
- **Sorgu Parametreleri**:
  - `period`: Rapor dönemi (current_month, last_month, current_year, custom)
  - `start_date`: Başlangıç tarihi (custom period için)
  - `end_date`: Bitiş tarihi (custom period için)
  - `format`: Rapor formatı (json, csv, pdf)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "report_period": {
        "period": "current_month",
        "start_date": "2023-01-01",
        "end_date": "2023-01-31"
      },
      "total_subscriptions": 15,
      "active_subscriptions": 12,
      "cancelled_subscriptions": 2,
      "paused_subscriptions": 1,
      "total_monthly_cost": 1250.85,
      "currency": "TRY",
      "subscriptions_by_category": [
        {
          "category": "Streaming",
          "count": 5,
          "monthly_cost": 550.95,
          "percentage": 44.05
        },
        {
          "category": "Music",
          "count": 2,
          "monthly_cost": 179.98,
          "percentage": 14.39
        },
        {
          "category": "Cloud Storage",
          "count": 3,
          "monthly_cost": 299.97,
          "percentage": 23.98
        },
        {
          "category": "Other",
          "count": 2,
          "monthly_cost": 219.95,
          "percentage": 17.58
        }
      ],
      "download_url": "https://example.com/reports/subscriptions_202301.pdf"
    }
  }
  ```

### 11. Admin API

#### 11.1 Kullanıcıları Listeleme (Admin)

- **Endpoint**: `GET /admin/users`
- **Açıklama**: Tüm kullanıcıları listeler
- **Erişim**: Admin
- **Sorgu Parametreleri**:
  - `search`: Arama terimi (email, isim)
  - `is_active`: Aktif kullanıcıları filtreleme (true, false)
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "email": "user@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "is_active": true,
          "is_verified": true,
          "created_at": "2023-01-01T12:00:00Z",
          "last_login": "2023-01-30T10:15:00Z",
          "subscription_count": 15,
          "bill_count": 8
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "email": "jane@example.com",
          "first_name": "Jane",
          "last_name": "Smith",
          "is_active": true,
          "is_verified": true,
          "created_at": "2023-01-05T14:30:00Z",
          "last_login": "2023-01-29T16:20:00Z",
          "subscription_count": 10,
          "bill_count": 5
        }
      ],
      "pagination": {
        "total": 50,
        "page": 1,
        "limit": 20,
        "pages": 3
      }
    }
  }
  ```

#### 11.2 Kullanıcı Detayı Alma (Admin)

- **Endpoint**: `GET /admin/users/{id}`
- **Açıklama**: Belirli bir kullanıcının detaylarını döndürür
- **Erişim**: Admin
- **URL Parametreleri**:
  - `id`: Kullanıcı ID'si
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+905551234567",
      "is_active": true,
      "is_verified": true,
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-15T10:30:00Z",
      "last_login": "2023-01-30T10:15:00Z",
      "profile": {
        "profile_picture_url": "https://example.com/profile.jpg",
        "currency": "TRY",
        "language": "tr",
        "timezone": "Europe/Istanbul",
        "monthly_budget": 1500.00
      },
      "roles": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440701",
          "name": "user"
        }
      ],
      "statistics": {
        "subscription_count": 15,
        "bill_count": 8,
        "total_monthly_spending": 1500.24,
        "currency": "TRY",
        "registration_days": 30,
        "login_count": 45
      }
    }
  }
  ```

#### 11.3 Kullanıcı Durumu Güncelleme (Admin)

- **Endpoint**: `PATCH /admin/users/{id}/status`
- **Açıklama**: Kullanıcı durumunu günceller (aktif/pasif)
- **Erişim**: Admin
- **URL Parametreleri**:
  - `id`: Kullanıcı ID'si
- **İstek Gövdesi**:
  ```json
  {
    "is_active": false
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "User status updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "is_active": false,
      "updated_at": "2023-01-31T09:45:00Z"
    }
  }
  ```

#### 11.4 Kullanıcı Rollerini Güncelleme (Admin)

- **Endpoint**: `PUT /admin/users/{id}/roles`
- **Açıklama**: Kullanıcı rollerini günceller
- **Erişim**: Admin
- **URL Parametreleri**:
  - `id`: Kullanıcı ID'si
- **İstek Gövdesi**:
  ```json
  {
    "role_ids": [
      "550e8400-e29b-41d4-a716-446655440701",
      "550e8400-e29b-41d4-a716-446655440702"
    ]
  }
  ```
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "message": "User roles updated successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "roles": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440701",
          "name": "user"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440702",
          "name": "premium_user"
        }
      ],
      "updated_at": "2023-01-31T10:15:00Z"
    }
  }
  ```

#### 11.5 Sistem İstatistikleri (Admin)

- **Endpoint**: `GET /admin/statistics`
- **Açıklama**: Sistem geneli istatistikler döndürür
- **Erişim**: Admin
- **Sorgu Parametreleri**:
  - `period`: İstatistik dönemi (daily, weekly, monthly, yearly)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "users": {
        "total": 1250,
        "active": 1150,
        "new_registrations": {
          "today": 15,
          "this_week": 85,
          "this_month": 320
        }
      },
      "subscriptions": {
        "total": 8750,
        "active": 7500,
        "total_monthly_value": 875000.00,
        "currency": "TRY",
        "by_category": [
          {
            "category": "Streaming",
            "count": 2500,
            "percentage": 28.57
          },
          {
            "category": "Music",
            "count": 1800,
            "percentage": 20.57
          },
          {
            "category": "Cloud Storage",
            "count": 1500,
            "percentage": 17.14
          },
          {
            "category": "Other",
            "count": 2950,
            "percentage": 33.72
          }
        ]
      },
      "bills": {
        "total": 12500,
        "pending": 3500,
        "paid": 8500,
        "overdue": 500,
        "total_value": 1250000.00,
        "currency": "TRY"
      },
      "system": {
        "api_requests": {
          "today": 125000,
          "average_response_time": 120
        },
        "notifications_sent": {
          "today": 8500,
          "this_week": 45000,
          "this_month": 180000
        }
      }
    }
  }
  ```

#### 11.6 Denetim Günlükleri (Admin)

- **Endpoint**: `GET /admin/audit-logs`
- **Açıklama**: Sistem denetim günlüklerini listeler
- **Erişim**: Admin
- **Sorgu Parametreleri**:
  - `user_id`: Kullanıcı ID'sine göre filtreleme
  - `action`: Eylem tipine göre filtreleme
  - `entity_type`: Varlık tipine göre filtreleme
  - `start_date`: Başlangıç tarihi filtresi
  - `end_date`: Bitiş tarihi filtresi
  - `page`: Sayfa numarası (default: 1)
  - `limit`: Sayfa başına öğe sayısı (default: 20)
- **Başarılı Yanıt** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440801",
          "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com"
          },
          "action": "update",
          "entity_type": "subscription",
          "entity_id": "550e8400-e29b-41d4-a716-446655440001",
          "old_values": {
            "amount": 149.99,
            "description": "Premium plan"
          },
          "new_values": {
            "amount": 169.99,
            "description": "Premium plan with 4K"
          },
          "ip_address": "192.168.1.1",
          "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
          "created_at": "2023-01-15T14:30:00Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440802",
          "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com"
          },
          "action": "login",
          "entity_type": "user",
          "entity_id": "550e8400-e29b-41d4-a716-446655440000",
          "old_values": null,
          "new_values": null,
          "ip_address": "192.168.1.1",
          "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
          "created_at": "2023-01-30T10:15:00Z"
        }
      ],
      "pagination": {
        "total": 1250,
        "page": 1,
        "limit": 20,
        "pages": 63
      }
    }
  }
  ```

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Bad Request - İstek formatı veya parametreleri hatalı |
| 401 | Unauthorized - Kimlik doğrulama gerekli |
| 403 | Forbidden - Yetkisiz erişim |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Çakışma (örn. e-posta zaten kayıtlı) |
| 422 | Unprocessable Entity - Doğrulama hatası |
| 429 | Too Many Requests - İstek limiti aşıldı |
| 500 | Internal Server Error - Sunucu hatası |

## Sürüm Bilgisi

Bu API dokümantasyonu v1.0 sürümü için hazırlanmıştır. API'nin gelecek sürümlerinde değişiklikler olabilir.

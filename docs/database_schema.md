# Subnest Veritabanı Şeması

## Veri Modeli

Subnest uygulaması için PostgreSQL veritabanı kullanılacak ve aşağıdaki temel tablolar oluşturulacaktır:

### 1. Users (Kullanıcılar)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE users IS 'Stores user account information and authentication details';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address, used for login and notifications';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt';
COMMENT ON COLUMN users.preferences IS 'User preferences stored as JSON (notification settings, UI preferences, etc.)';
```

### 2. User_Profiles (Kullanıcı Profilleri)

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_picture_url VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'TRY',
    language VARCHAR(10) DEFAULT 'tr',
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    monthly_budget DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN user_profiles.currency IS 'Preferred currency for displaying monetary values';
COMMENT ON COLUMN user_profiles.monthly_budget IS 'User-defined monthly budget for all subscriptions';
```

### 3. Categories (Kategoriler)

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE categories IS 'Subscription and bill categories';
COMMENT ON COLUMN categories.is_system IS 'Indicates if this is a system-defined category that cannot be deleted';
```

### 4. User_Categories (Kullanıcı Kategorileri)

```sql
CREATE TABLE user_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_categories IS 'User-defined custom categories';
```

### 5. Subscriptions (Abonelikler)

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TRY',
    billing_cycle VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
    category_id UUID REFERENCES categories(id),
    user_category_id UUID REFERENCES user_categories(id),
    start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER DEFAULT 3,
    payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'paused'
    website_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_category FOREIGN KEY (user_category_id) REFERENCES user_categories(id) ON DELETE SET NULL
);

COMMENT ON TABLE subscriptions IS 'Digital subscriptions and recurring bills';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Frequency of billing: weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Date when the next payment is due';
COMMENT ON COLUMN subscriptions.reminder_days IS 'Days before next_billing_date to send reminder';
```

### 6. Bills (Faturalar)

```sql
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TRY',
    due_date DATE NOT NULL,
    category_id UUID REFERENCES categories(id),
    user_category_id UUID REFERENCES user_categories(id),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    payment_date DATE,
    payment_method VARCHAR(100),
    reminder_days INTEGER DEFAULT 3,
    recurring BOOLEAN DEFAULT FALSE,
    recurring_id UUID REFERENCES subscriptions(id),
    notes TEXT,
    attachment_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_category FOREIGN KEY (user_category_id) REFERENCES user_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_recurring FOREIGN KEY (recurring_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

COMMENT ON TABLE bills IS 'One-time or recurring bills';
COMMENT ON COLUMN bills.payment_status IS 'Current payment status: pending, paid, overdue';
COMMENT ON COLUMN bills.recurring IS 'Indicates if this bill is part of a recurring subscription';
COMMENT ON COLUMN bills.recurring_id IS 'Reference to the subscription if this bill is recurring';
```

### 7. Payment_Methods (Ödeme Yöntemleri)

```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_account', 'digital_wallet', etc.
    last_four VARCHAR(4),
    expiry_date VARCHAR(7), -- 'MM/YYYY'
    is_default BOOLEAN DEFAULT FALSE,
    provider VARCHAR(50), -- 'visa', 'mastercard', 'paypal', etc.
    token_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE payment_methods IS 'User payment methods';
COMMENT ON COLUMN payment_methods.token_reference IS 'Tokenized reference to actual payment details stored in payment processor';
```

### 8. Budgets (Bütçeler)

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TRY',
    period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE,
    category_id UUID REFERENCES categories(id),
    user_category_id UUID REFERENCES user_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_category FOREIGN KEY (user_category_id) REFERENCES user_categories(id) ON DELETE SET NULL
);

COMMENT ON TABLE budgets IS 'User-defined budgets for categories or overall spending';
COMMENT ON COLUMN budgets.period IS 'Budget period: monthly, quarterly, yearly';
```

### 9. Notifications (Bildirimler)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'subscription_reminder', 'bill_due', 'budget_alert', etc.
    related_id UUID, -- ID of related subscription, bill, etc.
    related_type VARCHAR(50), -- 'subscription', 'bill', 'budget', etc.
    is_read BOOLEAN DEFAULT FALSE,
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    channel VARCHAR(20) NOT NULL, -- 'push', 'email', 'sms'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE notifications IS 'User notifications across different channels';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (subscription, bill, etc.)';
COMMENT ON COLUMN notifications.related_type IS 'Type of the related entity';
COMMENT ON COLUMN notifications.channel IS 'Notification delivery channel: push, email, sms';
```

### 10. Recommendations (Öneriler)

```sql
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cancel_subscription', 'switch_plan', 'budget_tip', etc.
    related_id UUID, -- ID of related subscription, bill, etc.
    related_type VARCHAR(50), -- 'subscription', 'bill', 'budget', etc.
    potential_savings DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'TRY',
    is_applied BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE recommendations IS 'AI-generated recommendations for savings';
COMMENT ON COLUMN recommendations.type IS 'Type of recommendation';
COMMENT ON COLUMN recommendations.potential_savings IS 'Estimated amount user could save by following recommendation';
```

### 11. Transactions (İşlemler)

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    bill_id UUID REFERENCES bills(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TRY',
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    status VARCHAR(20) NOT NULL, -- 'completed', 'pending', 'failed', 'refunded'
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    CONSTRAINT fk_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

COMMENT ON TABLE transactions IS 'Payment transactions for subscriptions and bills';
COMMENT ON COLUMN transactions.status IS 'Transaction status: completed, pending, failed, refunded';
```

### 12. Roles (Roller)

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'User roles for role-based access control';
```

### 13. User_Roles (Kullanıcı Rolleri)

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Mapping between users and their roles';
```

### 14. Permissions (İzinler)

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions IS 'Available permissions in the system';
```

### 15. Role_Permissions (Rol İzinleri)

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Mapping between roles and permissions';
```

### 16. Audit_Logs (Denetim Günlükleri)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'System audit logs for security and compliance';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: create, update, delete, login, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected: user, subscription, bill, etc.';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before change (for updates)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after change';
```

## İndeksler

Performans optimizasyonu için aşağıdaki indeksler oluşturulacaktır:

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Subscriptions table indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_category_id ON subscriptions(category_id);

-- Bills table indexes
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);
CREATE INDEX idx_bills_category_id ON bills(category_id);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);

-- Transactions table indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX idx_transactions_bill_id ON transactions(bill_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
```

## Tetikleyiciler (Triggers)

Veri bütünlüğünü ve otomatik güncellemeleri sağlamak için aşağıdaki tetikleyiciler oluşturulacaktır:

```sql
-- Updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_user_categories_timestamp BEFORE UPDATE ON user_categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_subscriptions_timestamp BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_bills_timestamp BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_payment_methods_timestamp BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_budgets_timestamp BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_notifications_timestamp BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_recommendations_timestamp BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_roles_timestamp BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_permissions_timestamp BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_OP, TG_TABLE_NAME, NEW.id, old_data, new_data);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        old_data = to_jsonb(OLD);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_OP, TG_TABLE_NAME, OLD.id, old_data);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        new_data = to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_OP, TG_TABLE_NAME, NEW.id, new_data);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to important tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON subscriptions FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_bills AFTER INSERT OR UPDATE OR DELETE ON bills FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_payment_methods AFTER INSERT OR UPDATE OR DELETE ON payment_methods FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
```

## İlişki Diyagramı

```
Users 1 --- * User_Profiles
Users 1 --- * User_Categories
Users 1 --- * Subscriptions
Users 1 --- * Bills
Users 1 --- * Payment_Methods
Users 1 --- * Budgets
Users 1 --- * Notifications
Users 1 --- * Recommendations
Users 1 --- * Transactions
Users * --- * Roles (through User_Roles)
Roles * --- * Permissions (through Role_Permissions)
Categories 1 --- * Subscriptions
Categories 1 --- * Bills
Categories 1 --- * Budgets
User_Categories 1 --- * Subscriptions
User_Categories 1 --- * Bills
User_Categories 1 --- * Budgets
Subscriptions 1 --- * Bills (recurring bills)
Subscriptions 1 --- * Transactions
Bills 1 --- * Transactions
Payment_Methods 1 --- * Transactions
```

Bu veritabanı şeması, Subnest uygulamasının tüm temel özelliklerini destekleyecek şekilde tasarlanmıştır. Şema, kullanıcı yönetimi, abonelik ve fatura takibi, bütçe yönetimi, bildirim sistemi, ödeme işlemleri ve yapay zeka destekli öneriler gibi tüm gereksinimleri karşılamaktadır.

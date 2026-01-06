-- GDPR Schema Migration
-- Creates tables for GDPR compliance

-- Sensitive member data table (separate from main members table)
CREATE TABLE IF NOT EXISTS member_sensitive_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
    tax_id VARCHAR(50),
    social_security VARCHAR(50),
    passport_number VARCHAR(50),
    driving_license VARCHAR(50),
    bank_account_iban VARCHAR(50),
    credit_card_last4 VARCHAR(4),
    medical_conditions TEXT,
    emergency_contact_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent tracking
CREATE TABLE IF NOT EXISTS member_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    withdrawn_date TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_consents_member ON member_consents(member_id);
CREATE INDEX idx_member_consents_type ON member_consents(consent_type);

-- GDPR data requests
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    export_file_url TEXT,
    notes TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gdpr_requests_member ON gdpr_requests(member_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- Audit log for sensitive data access
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_member ON audit_log(member_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Trigger for sensitive data audit
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (member_id, action, table_name, record_id, new_value)
        VALUES (NEW.member_id, 'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::text);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (member_id, action, table_name, record_id, old_value, new_value)
        VALUES (NEW.member_id, 'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::text, row_to_json(NEW)::text);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (member_id, action, table_name, record_id, old_value)
        VALUES (OLD.member_id, 'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::text);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_sensitive_data
AFTER INSERT OR UPDATE OR DELETE ON member_sensitive_data
FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

-- Function to anonymize member data
CREATE OR REPLACE FUNCTION anonymize_member_data(p_member_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE members
    SET 
        full_name = 'ANONYMIZED',
        email = 'deleted_' || id || '@anonymized.local',
        phone = NULL,
        address = NULL,
        date_of_birth = NULL,
        photo_url = NULL,
        notes = 'Account anonymized on ' || NOW()::date
    WHERE id = p_member_id;

    DELETE FROM member_sensitive_data WHERE member_id = p_member_id;

    UPDATE member_consents
    SET consent_given = FALSE, withdrawn_date = NOW()
    WHERE member_id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE member_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access sensitive data
CREATE POLICY "Admins can access sensitive data"
ON member_sensitive_data FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('gym_owner', 'admin', 'manager')
    )
);

-- Members can manage their own consents
CREATE POLICY "Members can manage own consents"
ON member_consents FOR ALL
TO authenticated
USING (
    member_id IN (
        SELECT id FROM members WHERE user_id = auth.uid()
    )
);

-- Members can create their own requests
CREATE POLICY "Members can create own requests"
ON gdpr_requests FOR INSERT
TO authenticated
WITH CHECK (
    member_id IN (
        SELECT id FROM members WHERE user_id = auth.uid()
    )
);

-- Members can view their own requests
CREATE POLICY "Members can view own requests"
ON gdpr_requests FOR SELECT
TO authenticated
USING (
    member_id IN (
        SELECT id FROM members WHERE user_id = auth.uid()
    )
);

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('gym_owner', 'admin')
    )
);

-- =============================================
-- NZILA FULL FEATURE SET - DATABASE SCHEMA
-- =============================================

-- 1. SALES CRM - Leads & Pipeline
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE public.lead_source AS ENUM ('walk_in', 'instagram', 'facebook', 'referral', 'website', 'other');

CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source lead_source DEFAULT 'walk_in',
    status lead_status DEFAULT 'new',
    notes TEXT,
    estimated_value NUMERIC(10,2) DEFAULT 0,
    assigned_to UUID REFERENCES auth.users(id),
    converted_member_id UUID REFERENCES public.members(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. FAMILY BILLING - Add tutor relationship
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.members(id);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS health_conditions TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gdpr_anonymized_at TIMESTAMP WITH TIME ZONE;

-- 3. INVOICES
CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'void');

CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    status invoice_status DEFAULT 'draft',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. INVENTORY & POS
CREATE TYPE public.product_category AS ENUM ('supplement', 'gear', 'apparel', 'snack', 'other');

CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category product_category DEFAULT 'other',
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost NUMERIC(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    asset_tag TEXT,
    category TEXT,
    purchase_date DATE,
    purchase_price NUMERIC(10,2),
    condition TEXT DEFAULT 'good',
    location_id UUID REFERENCES public.locations(id),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id),
    cashier_id UUID REFERENCES auth.users(id),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. GRADING SYSTEM
CREATE TABLE public.disciplines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.discipline_ranks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.member_ranks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    rank_id UUID NOT NULL REFERENCES public.discipline_ranks(id),
    awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    awarded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(member_id, discipline_id)
);

-- 6. PERFORMANCE TRACKING
CREATE TABLE public.performance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    unit TEXT NOT NULL,
    is_pr BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view leads in their gyms" ON public.leads
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can create leads in their gyms" ON public.leads
    FOR INSERT WITH CHECK (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can update leads in their gyms" ON public.leads
    FOR UPDATE USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can delete leads in their gyms" ON public.leads
    FOR DELETE USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));

-- RLS Policies for lead_tasks
CREATE POLICY "Users can view lead tasks in their gyms" ON public.lead_tasks
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can manage lead tasks in their gyms" ON public.lead_tasks
    FOR ALL USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their gyms" ON public.invoices
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can create invoices in their gyms" ON public.invoices
    FOR INSERT WITH CHECK (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));
CREATE POLICY "Users can update invoices in their gyms" ON public.invoices
    FOR UPDATE USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items" ON public.invoice_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.has_gym_role(auth.uid(), i.gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[])));
CREATE POLICY "Users can manage invoice items" ON public.invoice_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.has_gym_role(auth.uid(), i.gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[])));

-- RLS Policies for products
CREATE POLICY "Users can view products in their gyms" ON public.products
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can manage products in their gyms" ON public.products
    FOR ALL USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their gyms" ON public.assets
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can manage assets in their gyms" ON public.assets
    FOR ALL USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));

-- RLS Policies for sales
CREATE POLICY "Users can view sales in their gyms" ON public.sales
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can create sales in their gyms" ON public.sales
    FOR INSERT WITH CHECK (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));

-- RLS Policies for sale_items
CREATE POLICY "Users can view sale items" ON public.sale_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.has_gym_role(auth.uid(), s.gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[])));
CREATE POLICY "Users can create sale items" ON public.sale_items
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.has_gym_role(auth.uid(), s.gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[])));

-- RLS Policies for disciplines
CREATE POLICY "Users can view disciplines in their gyms" ON public.disciplines
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can manage disciplines in their gyms" ON public.disciplines
    FOR ALL USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[]));

-- RLS Policies for discipline_ranks
CREATE POLICY "Users can view discipline ranks" ON public.discipline_ranks
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.disciplines d WHERE d.id = discipline_id AND public.has_gym_role(auth.uid(), d.gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[])));
CREATE POLICY "Users can manage discipline ranks" ON public.discipline_ranks
    FOR ALL USING (EXISTS (SELECT 1 FROM public.disciplines d WHERE d.id = discipline_id AND public.has_gym_role(auth.uid(), d.gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[])));

-- RLS Policies for member_ranks
CREATE POLICY "Users can view member ranks" ON public.member_ranks
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND public.has_gym_role(auth.uid(), m.gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[])));
CREATE POLICY "Users can manage member ranks" ON public.member_ranks
    FOR ALL USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND public.has_gym_role(auth.uid(), m.gym_id, ARRAY['super_admin', 'gym_owner', 'admin']::app_role[])));

-- RLS Policies for performance_records
CREATE POLICY "Users can view performance records in their gyms" ON public.performance_records
    FOR SELECT USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));
CREATE POLICY "Users can manage performance records in their gyms" ON public.performance_records
    FOR ALL USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['super_admin', 'gym_owner', 'admin', 'staff']::app_role[]));

-- Indexes for performance
CREATE INDEX idx_leads_gym_id ON public.leads(gym_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_invoices_gym_id ON public.invoices(gym_id);
CREATE INDEX idx_invoices_member_id ON public.invoices(member_id);
CREATE INDEX idx_products_gym_id ON public.products(gym_id);
CREATE INDEX idx_sales_gym_id ON public.sales(gym_id);
CREATE INDEX idx_member_ranks_member_id ON public.member_ranks(member_id);

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
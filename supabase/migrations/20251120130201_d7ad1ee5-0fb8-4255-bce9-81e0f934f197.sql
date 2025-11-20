-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'rh_manager', 'user');

-- Create user roles table
CREATE TABLE public.concrem_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.concrem_user_roles ENABLE ROW LEVEL SECURITY;

-- Create HR applications table
CREATE TABLE public.concrem_hr_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color VARCHAR(20),
  route TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.concrem_hr_applications ENABLE ROW LEVEL SECURITY;

-- Create user application permissions table
CREATE TABLE public.concrem_user_application_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.concrem_hr_applications(id) ON DELETE CASCADE NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, application_id)
);

ALTER TABLE public.concrem_user_application_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.concrem_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check application permission
CREATE OR REPLACE FUNCTION public.has_app_permission(_user_id UUID, _app_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.concrem_user_application_permissions uap
    JOIN public.concrem_hr_applications app ON app.id = uap.application_id
    WHERE uap.user_id = _user_id
      AND app.code = _app_code
      AND app.is_active = true
  ) OR public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for concrem_user_roles
CREATE POLICY "Users can view their own roles"
  ON public.concrem_user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
  ON public.concrem_user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.concrem_user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.concrem_user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for concrem_hr_applications
CREATE POLICY "Everyone can view active applications"
  ON public.concrem_hr_applications
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage applications"
  ON public.concrem_hr_applications
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for concrem_user_application_permissions
CREATE POLICY "Users can view their own permissions"
  ON public.concrem_user_application_permissions
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and RH managers can grant permissions"
  ON public.concrem_user_application_permissions
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh_manager'));

CREATE POLICY "Admins and RH managers can revoke permissions"
  ON public.concrem_user_application_permissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh_manager'));

-- Triggers for updated_at
CREATE TRIGGER update_concrem_user_roles_updated_at
  BEFORE UPDATE ON public.concrem_user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_concrem_hr_applications_updated_at
  BEFORE UPDATE ON public.concrem_hr_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_concrem_user_application_permissions_updated_at
  BEFORE UPDATE ON public.concrem_user_application_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial HR applications
INSERT INTO public.concrem_hr_applications (code, name, description, icon, color, route, display_order) VALUES
  ('premiacoes', 'Premiações', 'Sistema de controle e gestão de premiações', 'Trophy', '#10b981', '/premiacoes', 1),
  ('cargos_salarios', 'Cargos e Salários', 'Gestão de cargos e estrutura salarial', 'Briefcase', '#3b82f6', '/cargos-salarios', 2),
  ('indicadores_rh', 'Indicadores RH', 'Análise e acompanhamento de indicadores de RH', 'BarChart3', '#8b5cf6', '/indicadores-rh', 3);
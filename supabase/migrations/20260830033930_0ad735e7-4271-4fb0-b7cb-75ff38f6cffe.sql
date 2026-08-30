CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL UNIQUE,
  email text NOT NULL,
  service_type text NOT NULL DEFAULT 'document',
  file_name text NOT NULL,
  file_path text NOT NULL,
  user_notes text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  recovered_password text,
  result_file_path text,
  result_file_name text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recovery_requests TO authenticated;
GRANT ALL ON public.recovery_requests TO service_role;
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage recovery requests" ON public.recovery_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER recovery_requests_updated_at BEFORE UPDATE ON public.recovery_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can upload a document for recovery" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'recovery-uploads');
CREATE POLICY "Admins read uploads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recovery-uploads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage results" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'recovery-results' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'recovery-results' AND public.has_role(auth.uid(), 'admin'));
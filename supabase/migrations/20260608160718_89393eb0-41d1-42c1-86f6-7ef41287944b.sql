UPDATE auth.users SET email_confirmed_at = now() WHERE email='luiz.junior@itstransdata.com' AND email_confirmed_at IS NULL;
INSERT INTO public.user_roles (user_id, role)
SELECT '882e1a2e-c711-4feb-948c-0e6a118801d5', 'admin'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '882e1a2e-c711-4feb-948c-0e6a118801d5')
ON CONFLICT (user_id, role) DO NOTHING;
-- PASSO MANUAL APÓS CRIAR SUA CONTA NORMAL NO SITE.
-- SQL Editor (administrador do projeto). NUNCA coloque esta query no frontend.
-- Confira o e-mail real em Authentication > Users antes de executar.
-- Altere SOMENTE a string abaixo. Não há credenciais administrativas hardcoded.
-- Exemplo: 'admin@seudominio.com'
DO $$
DECLARE target_email text := 'PREENCHA_EMAIL_DA_SUA_CONTA_AQUI'; target_id uuid;
BEGIN
 SELECT id INTO target_id FROM auth.users WHERE lower(email)=lower(target_email);
 IF target_id IS NULL THEN RAISE EXCEPTION 'Conta não encontrada. Crie a conta primeiro no Sonorum.'; END IF;
 UPDATE public.user_roles SET role='admin',assigned_at=now() WHERE user_id=target_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'user_roles não existe para esta conta. Rode SQL 01.'; END IF;
 RAISE NOTICE 'Perfil admin atribuído à conta escolhida. Saia e entre novamente.';
END $$;

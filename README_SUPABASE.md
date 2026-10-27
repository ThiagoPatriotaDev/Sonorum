# SONORUM V7 — RF03 + base de dados no Supabase

## Entrega

A V7 troca o HMAC e o JSON local por **Supabase Auth** e dados Postgres. Os módulos existentes foram preservados: home, RF01, RF02, aulas, comunidade, notícias, conta e estúdio. A persistência de **videoaulas, notícias, partituras e progresso de aulas** utiliza Supabase com RLS; no modo visitante, partituras/progresso ficam somente na memória desta aba do navegador.

**A verificação de e-mail NÃO é exigida nesta fase.** Esta decisão não significa vínculo validado com o IFPE. Todo usuário entra como `student`, sem autoelevação de papel. Antes da produção, reavaliar e ativar uma forma de validação de identidade: SSO institucional, SMTP/confirm email ou convite autorizado.

## 1. Configure o projeto

1. Acesse https://supabase.com/dashboard, crie ou selecione um projeto.
2. Em **Project Settings → API Keys**, copie a **Project URL** e a **Publishable key** (`sb_publishable_...`). Não use a Secret key ou service_role no frontend.
3. Em **Authentication → Sign In / Providers → Email**, habilite cadastro por e-mail, MAS desligue **Confirm Email** para o ciclo atual de testes. Confira as opções do painel, pois elas podem mudar.
4. **Authentication → URL Configuration**: Site URL `http://localhost:5173`, Redirect URLs `http://localhost:5173/**` para recuperação de senha. Ajuste para o domínio real depois.
5. Para recuperação de senha em destinatários reais, configure SMTP personalizado ou provedor de envio. O e-mail de confirmação no cadastro foi removido, mas a recuperação AINDA depende do serviço de e-mail.
6. **Não use e-mails de terceiros sem consentimento**: sem confirmação, um atacante pode cadastrar o e-mail de outra pessoa. Não use contas dessa fase para produção com dados sensíveis.

## 2. Execute as queries

No **SQL Editor**, escolha **uma única forma** de instalar: execute `querys_supa/00_INSTALAR_SUPABASE_RF03_COMPLETO.sql` uma vez, **OU** execute os arquivos de 01 a 03 nesta ordem:

- `querys_supa/01_auth_e_perfis.sql` — perfis, roles, trigger de novos usuários `student` e RLS.
- `querys_supa/02_comunidade_redacao.sql` — notícias e videoaulas, com controle de acesso.
- `querys_supa/03_partituras_e_progresso.sql` — documentos e evolução por usuário.
- `querys_supa/05_validacao_queries.sql` — verificação somente leitura.

Nunca execute o 00 completo e também 01–03 na mesma instalação (isso é redundante).

`04_promover_admin_MANUAL.sql` **não faz parte da instalação automática**. Execute APENAS depois de criar a conta que será administradora. Edite a string `PREENCHA_EMAIL_DA_SUA_CONTA_AQUI` com o e-mail correto. Confira primeiro em **Authentication → Users**.

**Segurança:** scripts pensados para Supabase PostgreSQL, mas ainda não executados no seu banco. Faça backup e avalie políticas já existentes antes de aplicar em um projeto com dados reais. Se o SQL de gerência anterior tiver políticas próprias, revise eventuais políticas que permitam acessos mais amplos; políticas RLS permissivas são combinadas por OR.

## 3. Informe as chaves e inicie

Em `frontend/.env`, substitua os dois campos `SEU_PROJECT_REF` e `COLE_SUA_KEY_AQUI`:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_COLE_SUA_KEY_AQUI
```

Em `backend/.env` use a MESMA URL e a chave publicável (o backend usa JWT do visitante/autenticado para operar sob RLS):

```dotenv
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_COLE_SUA_KEY_AQUI
SONORUM_FRONTEND_ORIGIN=http://localhost:5173
PORT=3333
```

Os arquivos `.env` incluídos têm somente marcadores de posição, **não possuem segredos reais**, e são ignorados por Git. Não cole `service_role` ou `sb_secret_...` no navegador nem no repositório. O backend **não precisa** dessa chave para gerenciar permissões: utiliza a identidade `auth.uid()` + RLS.

Abra dois terminais:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

É necessário acesso ao registro npm para instalar `@supabase/supabase-js` em ambos os diretórios. Como o registro npm estava inacessível aqui, os lockfiles antigos (incompatíveis com as novas dependências) foram retirados. Execute `npm install` em cada pasta para gerar `package-lock.json` atualizado, valide o build e faça commit dos novos lockfiles.

## 4. Teste a autenticação

- Cadastre a conta A: papel `student` aparece no perfil e na tabela `user_roles`.
- Tente usar um e-mail de professor / metadata `role=admin`: continua `student`.
- Crie a conta B, faça login: não deve ler as partituras nem o progresso de A.
- Abra a comunidade e publique uma videoaula: os dados aparecem em `sonorum_videos`, não em JSON local.
- Abra a conta e altere o nome: deve salvar em `profiles` sem mudar `user_roles`.
- Saia da conta: painel e estado pessoal devem desaparecer. O token de acesso anterior pode continuar válido por sua curta janela de expiração, embora o refresh token seja revogado no logout. Use expiração curta e regras reforçadas para operações críticas.
- A recuperação de senha mostra resposta genérica. A entrega do link requer SMTP configurado.
- Faça login com a conta escolhida para administração, execute `04_promover_admin_MANUAL.sql` e entre novamente. Abrirá o painel administrativo. Não há usuário/senha base hardcoded.
- Depois de validar institucionalmente uma pessoa **fora do Sonorum**, o admin pode atribuir `teacher`, `staff` ou `coordinator`; o domínio do e-mail não vale como verificação.
- Na redação, o professor edita seus rascunhos; coordenação e admin publicam; estudante e anônimo não acessam.
- Com login, o estúdio salva em `sonorum_scores` e o progresso em `sonorum_lesson_progress`; ambos são privados via RLS.

## 5. O que NÃO foi migrado automaticamente

- Usuários antigos do `backend/data/community.json` **não são importados** com hash/salt. Criar as contas de novo no Supabase e definir senha nova. Não transforme hashes antigos em senhas ou JWT.
- Videoaulas e notícias JSON antigas também **não são importadas automaticamente**. Se houver dados reais, faça backup e escreva migração revisada antes de retirar o sistema antigo.
- Partituras que já estavam no navegador permanecem no armazenamento da versão antiga do navegador, mas **esta versão não as lê ou modifica automaticamente** para evitar perda. Exporte seus arquivos JSON/MusicXML pela versão anterior antes de migrar, e crie/importa no editor novo conforme necessário.
- Preferências cosméticas (`sonorum_preferences_v4`) ainda ficam no navegador. Elas não são informações de autenticação, partituras ou dados institucionais.
- As seções institucionais e eventos ainda possuem conteúdo ilustrativo estático. A administração dinâmica RF01/RF02 é uma etapa posterior.

## 6. Estado da entrega / limites

Código e scripts gerados localmente. **Não foram executados contra uma instância Supabase real** e o build completo não foi concluído devido à indisponibilidade do registro npm. Portanto, o teste integrado deve ser feito no projeto Supabase criado por você, antes de uso oficial.

Documentos a consultar: https://supabase.com/docs/guides/auth/passwords e https://supabase.com/docs/guides/database/postgres/row-level-security.

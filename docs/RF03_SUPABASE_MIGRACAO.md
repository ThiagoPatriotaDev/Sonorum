# RF03 — Autenticação migrada para Supabase

**Escopo:** `frontend/src/services/{supabaseClient,communityApi,editorialApi,storageService}.js`, `frontend/src/components/AuthModal.jsx`, `frontend/src/App.jsx` e `backend/src/community/{auth,news,videos,userData,routes}.js`.

## Critérios de aceite

- Login/cadastro geridos por Supabase Auth; nenhum HMAC JWT próprio ou `backend/src/community/store.js`.
- Confirmação de e-mail temporariamente desligada pelo proprietário no Dashboard.
- Novo usuário recebe `student` pelo trigger, mesmo que cliente mande `role=admin` no metadata.
- RLS de `profiles`, `user_roles`, `sonorum_news`, `sonorum_videos`, `sonorum_scores` e `sonorum_lesson_progress`.
- Perfil administrativo só após promoção MANUAL/validação institucional. Nunca cadastrar admin por formulário.
- API com `supabase.auth.getUser(token)` + banco contextualizado pelo token de usuário, nunca aceita user_id do corpo da requisição como autoridade.
- Navegação, conta, editor e redação preservados.
- Recuperação de senha incluída, com envio dependente de provedor de e-mail.
- Logout apaga o estado do usuário e desativa as telas protegidas; tokens já emitidos têm janela de validade até expirarem, salvo mecanismos adicionais de checagem de sessão.

## Segurança residual

Desligar confirmação por e-mail é uma simplificação de desenvolvimento que permite abuso de endereços. Não tratar como validação IFPE. Implementar verificação institucional real antes de produção, e revisar as políticas SQL se a conta Supabase já tiver políticas antigas.

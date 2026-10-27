# SONORUM V6 — RF03, RF04 e Redação de Notícias

## O que foi implementado

- **RF03**: cadastro institucional, autenticação com senhas protegidas por `scrypt`, sessão assinada, verificação de permissões no backend, cinco tipos institucionais + `pending`.
- **RF04**: painel editorial responsivo, listagem, pesquisa, status (rascunho/publicado/arquivado), edição com prévia simultânea, e gestão de permissões por um administrador.
- **Notícias públicas**: página `#/noticias`, matéria individual `#/noticia/slug`, chamada de notícias na home **somente quando há publicações**.
- **Conta administrativa de demonstração**: habilitada **apenas** quando o backend roda em modo `dev:demo` (loopback). A conta é bloqueada caso o modo demonstração seja desligado e em `NODE_ENV=production`.
- **Artigo exemplo**: rascunho explicitamente identificado como DEMONSTRAÇÃO, não publicado automaticamente.

## EXECUÇÃO: Windows / PowerShell

Abra uma pasta nova com o ZIP completo para não misturar versões.

### Backend de demonstração

```powershell
cd Sonorum/backend
npm install
npm run dev:demo
```

### Frontend

```powershell
cd Sonorum/frontend
npm install
npm run dev
```

Abra `http://localhost:5173`, clique em **Entrar** e use:

- E-mail: `admin.demo@sonorum.local`
- Senha: `Sonorum#Demo2026!`

Em seguida, clique no avatar e escolha **Painel editorial**. Lá, experimente **Nova matéria**, salvamento, prévia, publicação, arquivo e **Usuários**. O rascunho de demonstração está disponível no painel.

O comando `npm run dev` do backend **não ativa** o administrador de teste. O comando `npm run dev:demo` existe apenas para testar localmente. **Nunca publique esse modo na internet**.

## Domínios, papéis e autorizações

| Tipo | E-mail | Perfil inicial | Pode publicar notícia? |
|---|---|---|---|
| Aluno | `@discente.ifpe.edu.br` | `student` | Não |
| Docente/servidor | `@ifpe.edu.br` ou `@belojardim.ifpe.edu.br` | `pending` | Não |
| Docente aprovado pelo administrador | Domínio institucional, verificado manualmente | `teacher` | Apenas rascunhos próprios |
| Servidor aprovado | Domínio institucional, verificado manualmente | `staff` | Não |
| Coordenação aprovada | Domínio institucional, verificado manualmente | `coordinator` | Sim |
| Administrador de desenvolvimento | `admin.demo@sonorum.local` | `admin` | Sim, somente no modo demo |

**Atenção:** a validação por sufixo de e-mail NÃO confirma propriedade da conta. A versão usa autenticação local apenas para testes. Em produção é obrigatório usar confirmação de e-mail institucional, preferencialmente SSO/OIDC ou Supabase Auth com e-mail verificado, e persistir papéis em tabela protegida por RLS. Nunca tornar admin um usuário só porque seu e-mail termina em um domínio institucional. Os domínios de docentes/servidores devem ser validados formalmente com o IFPE antes de colocar o sistema no ar.

## Regras da redação

- `student`, `pending` e `staff`: não entram no editor.
- `teacher`: cria e edita **seus próprios rascunhos**.
- `coordinator`: edita e publica matérias.
- `admin`: gerencia conteúdos e perfis de acesso.
- A publicação exige título, resumo e corpo de pelo menos 40 caracteres.
- O texto é exibido como texto simples em parágrafos, **sem HTML inserido pelo autor** (reduz risco de XSS).
- O link da capa deve ser HTTP(S). Upload local de arquivos ainda não foi implementado.
- Ao publicar, uma matéria ganha endereço público permanente baseado no slug original.
- O histórico de revisões, agendamento editorial, mídia no storage e workflow de dupla aprovação são expansões futuras.

## Onde estão os arquivos

**Backend**: `src/community/auth.js`, `src/community/news.js`, `src/community/store.js`, `src/community/routes.js`, `src/demo-server.js`.

**Frontend**: `src/pages/AdminConsolePage.jsx`, `src/pages/NewsPage.jsx`, `src/components/NewsHighlights.jsx`, `src/services/editorialApi.js`, `src/styles/editorial.css`, além dos ajustes de integração em `App.jsx`, `Header.jsx`, `HomePage.jsx`, `AuthModal.jsx`, `AccountPage.jsx`.

**Persistência de teste**: `backend/data/community.json` (criado localmente, ignorado pelo Git). **Não é o banco final.** Não execute em múltiplas instâncias, nem exponha a base na internet. Não migre senhas desta base para produção sem revisão.

## Integração futura com Supabase

A V6 entrega os fluxos e autorização do protótipo local. **Ela não afirma integração efetiva ao Supabase.** Para produção, substituir a base JSON e o login local por Supabase Auth + tabelas PostgreSQL para `profiles`, `role_assignments`, `news`, `news_revisions`, `news_media`, com políticas RLS e histórico de auditoria. O administrador inicial deverá ser criado por processo controlado, não por credenciais públicas no código.

Referências verificadas:
- IFPE: `https://portal.ifpe.edu.br/cabo/ensino/orientacoes-aos-estudantes/`
- IFPE Contatos campus: `https://portal.ifpe.edu.br/wp-content/uploads/2025/09/CONTATOS-PARA-SITE-IFPE-Pagina1-1.pdf`

## Critérios de teste manual

1. Iniciar backend com `npm run dev:demo` e frontend com `npm run dev`.
2. Entrar com a conta de teste, abrir o painel e editar o rascunho de demonstração.
3. Salvar rascunho, testar prévia e publicar. Verificar matéria em `#/noticias` e `#/noticia/slug`.
4. Arquivar, verificar que deixou de aparecer na parte pública.
5. Registrar um estudante `@discente.ifpe.edu.br`. Não deve acessar `/api/admin/news`.
6. Registrar um endereço de servidor `@ifpe.edu.br`. Deve ficar `pending`.
7. Aprovar o perfil em Usuários. O servidor poderá efetuar login novamente com as permissões atualizadas.
8. Testar menu por teclado, celular, foco visível e mensagens de erro.
9. Verificar se há URLs de imagem quebradas, anúncios de demonstração acidentalmente públicos e conflitos de z-index.

## Limitações de segurança ainda pendentes para publicação

A produção exige: identidade institucional comprovada (SSO/confirm-email), banco de dados transacional, backups, RLS, auditoria, proteção contra CSRF quando cookies forem utilizados, rate limit persistente, revisão LGPD e armazenamento seguro de imagens. A autenticação atual mantém token em `localStorage`: requer revisão da política de sessão e análise contra XSS antes de colocar dados reais. Os endpoints antigos de partituras de demonstração foram restringidos para escrita privilegiada; o editor local do aluno continua usando armazenamento do navegador.

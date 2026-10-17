# Sonorum: música em movimento

Portal do curso de Música com **home institucional**, **trilhas para instrumentos**, **estúdio de partituras** e **comunidade de videoaulas**. Esta versão evolui o projeto React + Express enviado originalmente, preservando o editor interativo e os exercícios existentes.

## Começar

Requisitos: Node.js 20+ e acesso à internet para instalar pacotes.

Abra **dois terminais** na raiz deste projeto:

```bash
# Terminal 1
cd backend
npm install
npm run dev
```

```bash
# Terminal 2
cd frontend
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador. O Vite encaminha `/api` ao backend em `http://localhost:3333`.

> O backend deve estar iniciado para criar contas, entrar e publicar videoaulas. Sem ele, a apresentação institucional, as aulas existentes, os exercícios sonoros e a edição de partituras continuam disponíveis; publicar não funciona.

## O que já está implementado

- **Início**: apresentação editorial do Sonorum, obras de arte feitas com SVG e CSS em pseudo-3D, chamada para instrumentos, estúdio e informações institucionais (a validar).
- **Explorar aulas**: quatro instrumentos com roteiros de prática, progresso no navegador, exemplos de som via Web Audio API e acesso direto ao estúdio.
- **Comunidade**: autenticação por e-mail/senha, perfil autodeclarado de professor ou estudante; publicação de links públicos do YouTube com título, descrição, instrumento e créditos; reprodução incorporada no portal e exclusão pelo autor.
- **Estúdio de partituras**: edição interativa da pauta original, reprodução sonora, exportação `.musicxml` e **visualização profissional com OpenSheetMusicDisplay (OSMD)**, carregada sob demanda. A visualização usa a versão `2.1.2` do pacote via CDN, exigindo acesso à internet.
- **Minha biblioteca**: salvar, editar, ouvir, exportar JSON e apagar partituras **por conta, neste navegador**.

## Limites importantes do protótipo

1. **Partituras e progresso são locais ao navegador** (localStorage). Não há sincronização de partituras entre dispositivos, mesmo com login. As videoaulas e contas, porém, são compartilhadas por todos os visitantes conectados ao mesmo backend.
2. O servidor salva usuários e os **links** das videoaulas em `backend/data/community.json`. Senhas são protegidas com `scrypt` e sal individual; os vídeos não são armazenados localmente. Esse banco em arquivo é adequado para um protótipo local, **não é infraestrutura de produção**.
3. O perfil de professor é **autodeclarado**, não validado. É necessário aprovar contas docentes por uma equipe/coordenação antes de colocar o site em produção.
4. O upload direto de MP4 não foi implementado. Para publicar, a pessoa precisa ter enviado previamente seu vídeo ao YouTube e colar o link.
5. OSMD é **renderizador de MusicXML**, não um editor completo. A edição continua no compositor SVG original. A exportação MusicXML atual cobre uma pauta melódica simples, não escrita polifônica, acordes múltiplos nem sistemas orquestrais.
6. Conteúdos concretos sobre processo seletivo, grade, duração e instituição precisam ser confirmados com a coordenação. A home **não inventa editais ou dados oficiais**.
7. Sessões são assinadas no backend. Para manter sessões após reinicializações, defina uma variável de ambiente `SONORUM_SESSION_SECRET` com uma chave forte e secreta. Sem ela, uma chave aleatória temporária é criada a cada início.

## Endpoints novos

| Método | Rota | Propósito |
|---|---|---|
| POST | `/api/auth/register` | Criar conta e receber token |
| POST | `/api/auth/login` | Entrar |
| GET | `/api/auth/me` | Verificar token |
| GET | `/api/videos` | Listar videoaulas; `?instrument=violao` opcional |
| POST | `/api/videos` | Publicar link do YouTube; token necessário |
| DELETE | `/api/videos/:id` | Excluir publicação própria; token necessário |

## Estrutura

```text
Sonorum/
├── backend/src/
│   ├── community/      # Contas, sessão e publicação de videoaulas
│   ├── data/           # Aulas e instrumentos originais
│   └── ...             # Rotas originais do projeto
├── frontend/src/
│   ├── pages/          # Início, instrumentos, comunidade, estúdio e biblioteca
│   ├── components/     # Cabeçalho, arte sonora, login, OSMD e pauta original
│   ├── utils/musicXml.js
│   ├── services/       # Web Audio, localStorage e API de comunidade
│   └── styles/global.css
└── docs/SONORUM_BRIEF_E_ROADMAP.md
```

## Para produção

Migrar a persistência para banco relacional, proteger as operações de partitura no backend, verificar docentes e e-mails, implementar recuperação de senha, moderação de conteúdo, política de direitos autorais, backup, LGPD, testes automatizados e upload seguro (caso desejado). Consulte `docs/SONORUM_BRIEF_E_ROADMAP.md`.

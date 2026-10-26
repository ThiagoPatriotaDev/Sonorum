> **Sonorum Studio V4.** Alterações de navegação, imagens e perfil em `docs/ALTERACOES_V4.md`. O frontend passou a usar a dependência `three` e deve receber `npm install` antes de executar.

# SONORUM V3 | Portal de Música + Studio de Partituras

Esta edição do Sonorum reúne quatro áreas: **Início, Explorar aulas, Comunidade e Partituras**. O visual da home foi simplificado, a escolha de instrumento agora abre uma tela exclusiva e a antiga divisão entre biblioteca e estúdio foi substituída por um único ambiente de criação.

## Instalação limpa no Windows / PowerShell

**IMPORTANTE:** extraia o novo ZIP em uma pasta vazia. Não copie seus arquivos para uma pasta antiga com outro `backend/src/services/auth.service.js`, pois isso mistura versões e pode causar erros de pacotes como `bcryptjs` / `jsonwebtoken`. Nesta edição o backend utiliza somente `express` e `cors`, com autenticação baseada no código incluído em `backend/src/community/`.

Abra dois terminais em `Sonorum/`:

**Terminal 1:**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2:**

```powershell
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. O frontend usa o Vite e encaminha `/api` para **http://localhost:3333**.

Se `npm install` falhar por motivos de rede, verifique a conexão e as configurações locais do npm. `node_modules` não está incluído no ZIP. É preciso instalar as dependências em cada uma das pastas.

## Como usar

### Home

**Novo na V3:** seta `Descubra mais ↓` no rodapé roxo da primeira dobra, com rolagem suave até o conteúdo do curso.

A página mantém a escultura sonora e a identidade editorial, mas remove legendas decorativas como `FIG. 01 / FREQUÊNCIA`, microtextos laterais e numeradores desnecessários.

### Explorar aulas

O visitante vê **8 instrumentos**: violão, violino, teclado/piano, flauta, canto, baixo elétrico, saxofone e bateria. Ao clicar, entra imediatamente na página própria do instrumento, com **Voltar aos instrumentos**, progresso, trilha de aprendizagem e aba **Videoaulas da comunidade**. A videoaula aparece no instrumento correspondente à categoria escolhida ao publicá-la.

A V3 oferece **56 aulas guiadas (7 por instrumento)**, com objetivos, práticas, etapas específicas e progressão por módulo. O catálogo exibe **oito imagens locais** e uma busca; as videoaulas ficam acessíveis no topo da página do instrumento, independentemente da quantidade de aulas. Os áudios são síntese local aproximada: não são gravações acústicas nem notação especializada de bateria ou sax.

### Partituras

A aba **Partituras** agora é a entrada única do Studio: **Nova partitura**, recentes, busca, filtro, reprodução e exportação. Clique numa partitura para abrir o editor estilo documento com folha branca e faixa superior de ferramentas.

No editor:

- **Notas**: clique na pauta para inserir; clique na nota para selecioná-la; escolha semibreve, mínima, semínima, colcheia, semicolcheia ou pausa; aplique sustenido, bemol ou natural à seleção; mova e exclua notas.
- **Compasso**: altere fórmula de compasso (2/4, 3/4, 4/4 ou 6/8), BPM e instrumento.
- **Detalhes**: edite título, compositor e anotações.
- **Arquivo**: crie documento, salve localmente, importe JSON do Sonorum, exporte JSON/MusicXML e imprima ou use a impressão do navegador para gerar PDF.
- **Visualizar**: alterne entre pauta editável e apresentação profissional via OSMD, ajuste zoom e mostre/oculte piano virtual.
- **Teclado**: atalhos `Ctrl+Z` / `Ctrl+Y` (desfazer/refazer), `Ctrl+S` (salvar), `1` a `7` para inserir Dó a Si, `↑` / `↓` para mudar a altura da nota selecionada, `Delete` para apagar e `Esc` para desmarcar.

**Salvar não exige conta** para testar: os documentos do visitante ficam salvos localmente no navegador. Ao entrar em uma conta, o acervo exibido passa a ser o acervo local daquela conta. Os documentos dos dois contextos não são sincronizados nem transferidos automaticamente.

### Comunidade

Login/cadastro, envio de links públicos do YouTube, categorias por instrumento e exclusão de publicação pelo próprio autor. **Publicar ainda exige conta e backend ativo.** O perfil de professor é autodeclarado e precisa de validação antes de qualquer uso público.

**Veja a documentação completa das melhorias em [`docs/ALTERACOES_V3.md`](docs/ALTERACOES_V3.md).**

## Limites desta versão

- A pauta editável ainda usa um modelo **monofônico de sequência de notas/pausas**. O Studio não é um substituto completo de MuseScore/Dorico: faltam múltiplas vozes simultâneas, acordes polifônicos, transposição automática, ligaduras, quiálteras, tablaturas e notação específica de percussão.
- A pauta de edição fornece uma diagramação funcional e aproximada. Para **visualização e impressão musical mais completas**, use a aba profissional (OSMD, carregada por CDN, requer internet).
- Arquivos `.musicxml` podem ser **exportados**, mas não importados nesta versão. A importação implementada é a de arquivos JSON do Sonorum.
- As partituras ficam no `localStorage`, sem recuperação entre dispositivos e sem proteção contra limpeza dos dados do navegador. **Exporte os seus arquivos** para ter cópias de segurança.
- Backend salva usuários e links de vídeo em JSON (`backend/data/community.json`) e foi pensado para teste local. Em produção, use banco de dados, moderação, verificação de docentes, HTTPS e medidas de LGPD.
- Informações institucionais de curso, editais, duração e grade devem ser preenchidas com dados oficiais validados pela coordenação.

## Estrutura resumida

```text
Sonorum/
  frontend/src/
    App.jsx                       Navegação em quatro áreas
    pages/ScoreWorkspacePage.jsx  Studio + biblioteca (entrada unificada)
    pages/ScoreEditorPage.jsx     Editor com ribbon e folha branca
    pages/InstrumentsPage.jsx     Catálogo e telas próprias de aula
    components/StaffCanvas.jsx    Pauta SVG selecionável
    components/MusicXmlPreview.jsx Visualização OSMD
    data/instruments.js           Instrumentos e trilhas
    services/storageService.js    Acervo local e progresso
  backend/src/                   Express, autenticação, API de videoaulas
  docs/SONORUM_BRIEF_E_ROADMAP.md
```

## Verificações realizadas

- Sintaxe JSX/JS analisada com o transpiler TypeScript.
- Arquivos JS do backend analisados com `node --check`.
- Componentes renderizados com ReactDOMServer (Home, catálogo, detalhes, biblioteca, editor e App).
- Backend Express testado com requisições HTTP de cadastro, publicar/filtrar/excluir videoaulas.
- Armazenamento local e exportação MusicXML testados com notas e pausas.

**Não foi possível concluir `npm ci` nem uma validação interativa do Vite neste ambiente**, porque a instalação de dependências do registro npm não concluiu. Ao executar na sua máquina, teste primeiro `Partituras → Nova partitura → Inserir nota → Salvar → Recentes → Abrir` e `Explorar aulas → Violino → Videoaulas → Voltar`.

## Ajuste V4.1

O retrato de Beethoven foi reposicionado para a seção **“Mais que estudar música”**, abaixo da primeira dobra. A escultura abstrata original foi restaurada na área inicial. Detalhes em [`docs/ALTERACOES_V4_1.md`](docs/ALTERACOES_V4_1.md).

## RF01 · Site público do curso (nova navegação)

O cabeçalho tem uma experiência de navegação institucional no item **Início**, com painel de prévia para O curso, Matriz curricular, Docentes e Infraestrutura. Com mouse abre em hover; com clique funciona como painel expansível; no celular usa menu por toque.

Os endereços `#/curso`, `#/matriz`, `#/docentes` e `#/infraestrutura` podem ser abertos diretamente.

Consulte `docs/RF01_SITE_PUBLICO_E_NAVEGACAO.md` para preencher os dados oficiais, os critérios de aceite e os testes de navegação. As informações institucionais ainda não fornecidas estão explicitamente identificadas como pendentes de validação.

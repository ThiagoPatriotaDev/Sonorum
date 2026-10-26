# Sonorum · RF01 | Site público e navegação institucional

## Entrega

Adicionada navegação de descoberta institucional a partir do botão **Início** no cabeçalho. Com mouse (desktop), o painel abre ao passar sobre o item; com clique, abre pelo próprio texto ou seta. Com teclado, recebe foco e pode ser percorrido por `Tab`; `Escape` fecha. Em telas menores que 960px, o cabeçalho é um menu expansível com acesso por toque.

O painel contém: **Página inicial**, **O curso**, **Matriz curricular**, **Docentes** e **Infraestrutura**. As quatro áreas institucionais são páginas próprias, acessíveis também diretamente por `#/curso`, `#/matriz`, `#/docentes` e `#/infraestrutura`. Dentro de cada página, uma barra de seções permite mudar sem reabrir o menu.

## Brainstorm aplicado

Foram considerados três caminhos: (A) dropdown clássico vertical, econômico mas pouco memorável; (B) coleção de cartões na home, visual porém dependente de rolagem; e (C) **painel editorial de descoberta com prévia ao foco/hover**, complementado por navegação de seções em cada página. C foi escolhido por preservar a hierarquia e dar contexto às seções sem exigir mais cliques. O mobile usa expansão por toque, sem depender de hover.

O painel usa princípios de reconhecimento em vez de memorização (descrições e prévias), divulgação progressiva (o cabeçalho permanece enxuto), feedback de foco e redução de movimento. Nenhum conteúdo depende apenas da animação.

## Onde editar

- `frontend/src/components/Header.jsx`: mega-menu, interação mouse/teclado/toque.
- `frontend/src/pages/PublicCoursePage.jsx`: quatro páginas institucionais e seus layouts.
- `frontend/src/data/publicCourse.js`: dados do curso e futuros cadastros.
- `frontend/src/App.jsx`: navegação e URLs por hash.
- `frontend/src/pages/HomePage.jsx`: botão da home para a página pública do curso.
- `frontend/src/styles/global.css`: visual e responsividade.

## Dados reais pendentes

O documento de requisitos estabelece **o dever de exibir** páginas do curso, matriz, docentes e infraestrutura, mas não apresenta a matriz curricular homologada, a relação atual dos professores, fotos autorizadas dos ambientes nem a modalidade/duração específica da graduação. Esses campos estão marcados como pendentes, não foram inventados.

No arquivo `publicCourse.js`, preencha após validação institucional:

```js
PUBLIC_CONTENT.curriculum = [
  { period: 'PERÍODO OFICIAL', disciplines: [ { name: 'COMPONENTE OFICIAL', hours: 60 } ] }
];
// Atenção: altere os campos no objeto existente; não use dados fictícios em produção.
```

O arquivo também contém listas `faculty` (nome, qualificação, áreas, fotografia autorizada) e `spaces` (nome, descrição, capacidade, foto, recursos). Os exemplos acima são exclusivamente de formato: nem `60` nem os nomes escritos correspondem a registros reais do IFPE.

**Nota técnica:** a versão implementada lê esses dados de um arquivo JS, não do Supabase. Quando o módulo de administração estiver pronto, substitua a fonte pelos dados publicados no banco com políticas apropriadas.

## Checklist manual no navegador

1. Inicie `frontend` e `backend`, como indicado no README. Abra o Sonorum.
2. No desktop, passe o mouse em **Início** e navegue pelas prévias. Clique nos quatro itens e confira o conteúdo.
3. Clique no botão **Início** ou na seta; use `Tab` para percorrer itens, `Enter` para abrir e `Escape` para fechar.
4. Acesse `http://localhost:5173/#/matriz` diretamente e atualize a página; a seção deve continuar aberta.
5. Use a largura de tela de 390px ou menor, abra o menu mobile, expanda **Início** e selecione uma seção.
6. Confira que **Explorar aulas**, **Comunidade**, **Partituras** e **Perfil** continuam na navegação.
7. Teste `prefers-reduced-motion: reduce` e o ajuste de reduzir animações do próprio Sonorum.
8. Substitua os dados demonstrativos por informações aprovadas pela instituição antes da publicação oficial.

## Situação do RF01

**Interface e navegação implementadas**, com seções e campos prontos para publicação. **Conteúdo institucional validado ainda pendente**. O requisito não deve ser considerado entregue à instituição antes de inserir e homologar os dados reais.

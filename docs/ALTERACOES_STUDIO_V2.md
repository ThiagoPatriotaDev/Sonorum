# Sonorum Studio V2 | Resumo das alterações

## Produto

- Header com quatro destinos: Início, Explorar aulas, Comunidade e Partituras.
- Home sem o texto lateral, sem `FIG. 01 / FREQUÊNCIA`, sem faixas de frases repetidas, sem índices decorativos na apresentação.
- Seleção de instrumentos em grade. Ao clicar, a grade desaparece, mostrando uma tela própria com botão de retorno, trilha de aprendizagem e videoaulas filtradas por instrumento.
- Inclusão de canto, baixo elétrico, saxofone e bateria com exercícios iniciais. Não são aulas completas de instrumento: o conteúdo e o áudio servem de demonstração inicial.
- Comunidade e backend reconhecem os oito instrumentos.
- Unificação entre biblioteca e editor em uma aba Partituras: abertura com Nova Partitura + recentes + busca/filtro. Editar abre documento com ribbon semelhante à faixa de opções de um processador de texto.

## Editor

**Feito:**
- Folha branca com título, compositor, pautas, compasso e representação de notas e pausas.
- Barra de abas Notas, Compasso, Detalhes, Arquivo e Visualizar.
- Inserção de notas por clique na pauta, barra de notas e piano virtual.
- Seleção por clique, edição de duração e acidente, mover nota na sequência, excluir, desfazer/refazer, atalhos de teclado.
- Andamento, compasso, instrumento, título, autor e anotações.
- Reprodução com realce da nota atual e comando parar.
- MusicXML, JSON, importação JSON, visualização OSMD, impressão/PDF e zoom.
- Salvamento no navegador em modo visitante e para conta logada; histórico recente.
- Confirmação ao sair do editor com alterações não salvas; aviso ao fechar/atualizar a página.

**Ainda não feito:**
- Partitura polifônica, múltiplos instrumentos na mesma folha, ligaduras, quiálteras, armaduras configuráveis, tablaturas, edição por arrastar, reprodução de instrumentos com amostras reais, importação `.musicxml`.
- Sincronização remota e colaboração em tempo real.
- Moderação e validação de professores para ambiente de produção.

## IHC aplicado

- **Correspondência entre interface e tarefa:** área de documento, barra superior e menu de arquivos próximos ao paradigma Word.
- **Visibilidade:** indicar documento salvo/não salvo, nota selecionada, trilha concluída e vídeos por instrumento.
- **Controle e liberdade:** voltar, desfazer/refazer, cancelar exclusão, proteção contra saída com alterações.
- **Reconhecimento em vez de memorização:** botão de criar partitura no início, instrumentos claramente clicáveis, abas com rótulos descritivos, modos Editar/Visualizar.
- **Prevenção de erros:** selecionar notas não as exclui; remoção explícita e confirmação para limpeza geral.
- **Acessibilidade inicial:** aria-labels, foco visível, atalhos, legendas curtas e layout adaptativo.

## Testes feitos neste ambiente

- Parse de todos os arquivos JSX/JS do frontend pelo TypeScript: **sem diagnósticos**.
- `node --check` dos arquivos JS do backend: **sem erros**.
- Renderização real com ReactDOMServer de Home, catálogo, instrumento, recentes, editor e App: **todas passaram**.
- Teste de save/update/delete local, catalogação de oito instrumentos, MusicXML com sustenido/bemol e pausas: **passou**.
- Backend Express testado por HTTP com registro de conta, publicação e filtragem de saxofone e exclusão da própria publicação: **passou**.
- Testes de navegador interativo e Vite build não puderam ser completados aqui, pois a instalação npm pela rede falhou e as dependências antigas do ZIP original eram compiladas para Windows (módulo nativo Rollup incompatível com Linux).

## Próximo ciclo recomendado

Testar no Windows o fluxo `Partituras > Nova partitura > Inserir notas > Selecionar > Alterar duração > Desfazer > Salvar > Recentes > Reabrir`, depois `Explorar aulas > Violino > Vídeos > Voltar`. Após isso, profissionalizar o motor de notação musical e migrar persistência para banco de dados.

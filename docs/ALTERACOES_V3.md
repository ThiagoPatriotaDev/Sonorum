# Sonorum V3 · Trilha e interface refinadas

## O que mudou

1. **Home**: a escultura sonora e o título foram preservados; o fundo ameixa vai até o rodapé da primeira dobra. Uma chamada discreta `DESCUBRA MAIS ↓` indica continuidade, desloca para `sobre-curso` e respeita a preferência de movimento reduzido.
2. **Imagens locais**: oito ilustrações/fotos geradas para a interface, nos arquivos `frontend/public/images/instruments/*.webp`, uma por instrumento, exibidas no catálogo, banner e cabeçalho das aulas. Os assets foram recortados de um conceito visual original gerado para o Sonorum. Por isso são imagens estilizadas, não fotografias documentais de um curso real.
3. **Catálogo**: busca local, oito instrumentos com imagem, descrição, contador de aulas, barra de progresso e navegação direta para a trilha.
4. **Página do instrumento**: banner com imagem, descrição, dados de progresso e **botão de videoaulas visível sem precisar rolar**. Abas de trilha e comunidade; menu de aulas com **altura limitada e rolagem interna**, preservando o acesso a vídeos. Em celular, a lista fica acima do conteúdo.
5. **Conteúdo pedagógico**: 56 aulas estruturadas (7 por instrumento), preservando IDs das aulas anteriores; cada aula tem etapas específicas, referência rítmico-melódica, objetivos, áudio para orientação e atalho para estudar no Studio. O conteúdo é de introdução e necessita revisão de professor habilitado antes do uso curricular formal.
6. **Editor/áudio**: timbres sintetizados por instrumento com envelopes, parciais e durações melhor controladas; golpes sintéticos diferenciados para bumbo, caixa e pratos no modo Bateria. Agora `Parar` cancela o restante da sequência e interrompe os sons em reprodução com um fade curto. Sem novas dependências.
7. **Fluxos preservados**: login, publicação de links do YouTube, biblioteca, salvamento local, importação JSON, exportação MusicXML, impressão e painel de notas, como na V2.

## O que ainda não é realismo instrumental

O sistema **não inclui gravações acústicas** de violão, violino etc. Os sons são produzidos pelo navegador via Web Audio, para estudo rítmico e melódico. Para a fidelidade próxima de um instrumento real, o próximo passo é incorporar bibliotecas de samples licenciados (SoundFont/SFZ ou arquivos individuais), cache local, variações de dinâmica, transposição apropriada e teste de latência em celulares. A notação de bateria é representativa, e não uma pauta de percussão completa.

## Cuidados pedagógicos

- As 56 aulas são planos de prática, **não videoaulas gravadas** e não há vídeos fictícios populando a comunidade. Videoaulas reais aparecem quando docentes/estudantes publicarem links válidos.
- Os exercícios do baixo são representados na pauta demonstrativa em oitava mais aguda que sua tessitura real.
- Os exercícios de saxofone usam alturas de concerto; a transposição para Si♭/Mi♭ não é aplicada no Studio.
- Estudos de bateria usam representação rítmica e timbres sintetizados, mas ainda não partituras especializadas de percussão.
- Registros vocais devem ser adaptados à extensão confortável, sem forçar.
- O conteúdo precisa de revisão pedagógica por um professor de cada instrumento antes de uso institucional.

## Como verificar

1. Extraia esta versão **em pasta nova**.
2. No PowerShell, em `backend`, rode `npm install` e `npm run dev`.
3. Em outro terminal, em `frontend`, rode `npm install` e `npm run dev`.
4. No navegador, acesse `http://localhost:5173`.
5. Na **Home**, observe a seta `Descubra mais`; clicar deve rolar até o curso.
6. Em **Explorar aulas**, confira oito fotos, digite `violino` na busca, abra e verifique se o botão `Ver videoaulas` fica no topo.
7. Abra qualquer instrumento e percorra as sete aulas; ao marcar uma, o progresso aparece no catálogo.
8. Em **Partituras**, crie uma, selecione `Compasso > Instrumento`, toque uma nota e reproduza. Compare os timbres e use `Parar`.
9. Na **Comunidade**, valide o fluxo de publicar link do YouTube com backend ativo. A publicação depende de cadastro.

## Qualidade e limitações dos testes

- Sintaxe JavaScript verificada.
- ReactDOMServer renderizou home, catálogo, detalhe, biblioteca, editor e aplicação sem erros.
- Verificação automatizada confirmou 8 instrumentos, 56 aulas únicas, exercícios com notas válidas e 8 imagens existentes.
- **Build via Vite não foi concluído neste ambiente**: a cópia local do `node_modules` é de Windows e não possui o binário Linux opcional do Rollup. A versão para Windows deve ser instalada normalmente com `npm install` nas duas pastas.
- Captura visual interativa no Chromium também não concluiu neste ambiente. O teste no seu computador continua recomendado.

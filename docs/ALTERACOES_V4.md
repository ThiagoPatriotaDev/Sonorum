# Sonorum Studio V4 — Refinamento e Conta

## Entregas implementadas

- **Explorar aulas:** oito ilustrações vetoriais originais, sem pixels e sem cortes agressivos. As imagens foram montadas em SVG responsivo e substituem as antigas fotos comprimidas. Preservadas todas as 56 aulas e o áudio aprovado na V3.
- **Detalhe da aula:** faixa de Fundamentos/Aula X de Y ocupa toda a largura do documento; contraste maior no rótulo “Referência musical”, no diagrama e nas orientações.
- **Início:** retrato artístico de Beethoven derivado de geração visual do projeto, integrado à escultura de ondas; Three.js anima em WebGL anéis tridimensionais e cinco cordas ressonantes. Renderização limitada a ~35fps e pixel ratio a 1.6. Há fallback visual SVG quando WebGL não está disponível e respeito a movimento reduzido.
- **Conta:** avatar clicável, menu acessível Perfil/Configurações/Sair, página Meu Perfil com alteração de nome persistida no backend por PATCH /api/auth/me; preferências locais de menos animações e trilha compacta. Menu fecha ao clicar fora ou usar Escape; conta também acessível no menu móvel.
- **Responsividade:** estilos adicionais para área do editor de aulas, perfil e home.

## Instalação limpa (Windows)

Extraia o ZIP em uma pasta **nova**, por exemplo `Documentos/Sonorum_V4`, sem mesclar com versões anteriores.

**Terminal backend**:

```powershell
cd backend
npm install
npm run dev
```

**Terminal frontend**:

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

O frontend agora depende de `three` (`^0.180.0`) instalado pelo `npm install`. O lockfile do frontend será gerado automaticamente nessa primeira instalação. **Não use `npm ci` na primeira instalação**, pois não incluímos um lockfile atualizado (o ambiente de desenvolvimento não permitiu baixar Three.js da rede).

## Testes executados

- Parse XML de 8 SVG: OK.
- Renderização no servidor dos componentes React da home, catálogo, aula de instrumento, biblioteca, editor e aplicativo: OK (Three.js substituído por stub apenas nesse teste de estrutura).
- Verificação de sintaxe do backend e módulos JavaScript: OK.
- HTTP real de API: cadastro (201), alteração de nome autenticada (200), consulta do perfil (200) e vídeos (200).
- Verificação de exportação do ZIP: executada.

**Não validado:** build completo do frontend com a biblioteca Three.js instalada e teste WebGL interativo no navegador. O ambiente de teste estava sem acesso ao registro npm. A aplicação possui um fallback para a escultura em SVG se WebGL estiver indisponível, mas a dependência `three` precisa ser instalada.

## Decisões de escopo

- Não mudou o áudio das partituras nesta revisão.
- Alterar e-mail, senha e confirmar professores como usuários institucionais não foram implementados.
- As capas dos instrumentos são ilustrações vetoriais nítidas em vez de fotografias: uma escolha intencional para eliminar a compressão e manter o estilo coeso.
- As preferências ficam neste navegador; nome e publicações ficam no armazenamento do backend.


## Ajuste V4.2
- Hero principal restaurado para uma composição mais limpa e próxima da versão anterior.
- Removidas as órbitas/linhas de fundo da escultura principal.
- Destaque da palavra SONORUM reforçado e reposicionado mais acima no disco central.

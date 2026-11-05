# Sonorum V10 · Prompt 04 | Conteúdo institucional e agenda

## O que foi implementado

- **Início**: apresentação, matriz curricular, docentes, infraestrutura, galeria e notícias.
- **Comunidade**: agenda de eventos, reservas de salas e acervo patrimonial.
- **Área do aluno**: explorar aulas, mural musical e partituras; portfólio artístico identificado como evolução futura, não é uma funcionalidade ativa.
- Mega-menus responsivos com hover assistido, clique, saída com tolerância e tecla Escape; páginas e URLs anteriores (`#/salas`, `#/acervo`, `#/eventos`, `#/curso` etc.) mantidas.
- Conteúdo de `course_pages`, `course_events` e `course_gallery` lido exclusivamente do Supabase via backend. **Não há dados fictícios nem seeds institucionais.**
- Painel **Perfil > Painel editorial > Institucional** somente para `admin`/`coordinator`. Professores com acesso à redação de notícias não recebem direito a páginas oficiais.
- Cada página, evento e foto é salvo em rascunho, recebe registro de revisão válido para sua versão e só então pode ser publicado. Quando conteúdo muda, a revisão anterior deixa de valer e o registro retorna a rascunho.
- Agenda com busca, categorias, períodos, detalhes e formatação de datas em `America/Recife`; valores registrados em `timestamptz` UTC.
- Galeria com imagens por URL HTTPS e texto alternativo obrigatório. **A própria tela exige que a coordenação registre comprovação e hipótese de publicação** antes de liberar o conteúdo. O documento comprobatório deve ficar armazenado em local protegido. Nenhum dado pessoal ou foto institucional é inventado.

## Instalando no Supabase

**Pré-requisito:** banco da V7 instalado e perfis `admin`/`coordinator` configurados por meio seguro. Banco da V8 e V9 pode continuar normalmente. Faça backup antes de alterar qualquer banco em uso.

1. Abra **Supabase Dashboard → SQL Editor** do projeto Sonorum.
2. Execute `querys_supa/10_RF04_conteudo_institucional.sql` **uma vez**.
3. Execute `querys_supa/11_RF04_verificacao.sql` (somente leitura). Confira **seis tabelas** com RLS, suas políticas e os triggers.
4. Preserve os arquivos `.env` de sua instalação local. A V10 não exige uma chave nova.
5. Atualize frontend e backend e execute `npm install`/`npm run dev` em ambos.
6. Entre com a conta de admin/coordinator e abra **Painel editorial → Institucional**.

**Atenção:** a query 10 é uma migração incremental e não deve ser concatenada à query inicial V7. Não execute a query de criação de contas do zero em um banco já utilizado. Evite expor chaves secretas em variáveis `VITE_*`.

## Fluxos de publicação

### Página do curso, matriz, docentes e infraestrutura

1. Selecione a seção desejada na lista.
2. Preencha título, resumo, texto e blocos. Na matriz, os blocos usam **grupo=período**, **título=componente**, **meta=carga horária**. Não informe dados sem confirmação.
3. Clique **Salvar alterações**.
4. Registre referência da validação (ata, protocolo, documento, comunicação) em um sistema institucional protegido. Para docentes, preencha também a base apropriada de divulgação dos dados pessoais.
5. Clique **Registrar revisão** e, depois, **Publicar no site**.
6. Alterar o conteúdo exige salvamento e revisão novamente antes de nova publicação.

### Evento

1. Em **Agenda de eventos**, clique **Novo**.
2. Informe categoria, título, início/fim, local, público e descrição confirmados.
3. Clique **Salvar rascunho** e informe a referência da confirmação institucional.
4. Clique **Registrar revisão** e **Publicar evento**.
5. A agenda pública mostra apenas registros `published`. Horários são apresentados no fuso `America/Recife`.

### Galeria

1. Em **Galeria autorizada**, cadastre título, URL da imagem **HTTPS**, legenda e texto alternativo.
2. Salve em rascunho. **Não publique imagens nem dados pessoais sem base apropriada e sem comprovação.**
3. Selecione consentimento documentado ou outra hipótese adequada documentada, registre o identificador interno da evidência e clique **Registrar comprovação**.
4. Publique. Quando a imagem, legenda ou descrição é alterada, o sistema exige nova revisão.
5. O documento de consentimento/base adequada **não é entregue pela API pública**. A URL da própria imagem deve ser autorizada para exibição pública. Nunca use URLs com tokens ou chaves privadas.

## Casos de teste recomendados

1. Visitante anônimo acessa `#/curso` e `#/eventos` antes de haver publicação: visualiza mensagens úteis de preparação, sem nomes/carga horária/eventos inventados.
2. Admin cria rascunho; visitante acessa a mesma página: **não vê o rascunho**.
3. Admin tenta publicar página sem revisão: banco deve bloquear.
4. Admin revisa e publica: visitante consegue ver o conteúdo.
5. Admin edita material publicado: banco reverte para `draft` e a publicação anterior deixa de aparecer até nova revisão.
6. Admin cadastra evento, revisa e publica; filtro de categoria e datas funcionam.
7. Tente publicar imagem sem registro de autorização: banco deve bloquear; com registro da versão atual, permitir.
8. Estudante/teacher tenta ler rascunhos ou chamar endpoints `/api/admin/course/*`: recebe acesso negado.
9. Valide responsividade, foco do teclado, teclado Esc nos mega-menus e texto alternativo das imagens.

## Limitações e prioridades seguintes

- O módulo de galeria recebe imagem por URL HTTPS, não inclui ainda upload binário direto para o Supabase Storage. Para upload direto, será necessária política adicional de armazenamento com autorização e moderação.
- A existência de um **identificador de comprovação** não verifica, por si só, o documento; é um controle de publicação que pressupõe revisão real pela coordenação.
- O pacote foi validado estaticamente (sintaxe, importações, contratos) e depende de executar a query no projeto Supabase real para validar RLS e triggers transacionalmente.
- Nenhuma query foi executada remotamente, nenhum conteúdo institucional foi publicado e nenhuma credencial existente foi alterada.

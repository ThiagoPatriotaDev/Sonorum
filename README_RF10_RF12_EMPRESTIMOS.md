# Sonorum V9 | PROMPT 03 – Acervo e empréstimos patrimoniais

> Implantação incremental a partir da V8.1, com a autenticação Supabase já operacional. **Não execute novamente o SQL completo da V7 ou da V8.**

## O que foi construído

- **Um exemplar por patrimônio.** `instruments.asset_code` é único, sem confundir categoria e unidade física.
- **Aluno:** consulta o catálogo, vê se a peça está disponível, solicita a retirada informando finalidade e data pretendida de devolução, acompanha seus próprios pedidos e histórico.
- **Equipe (`staff`, `coordinator`, `admin`):** cadastra e edita unidades, envia foto para Storage, analisa a fila, aprova/recusa, registra a condição na retirada e confere na devolução.
- **Fluxo de estados no PostgreSQL:** `pending → approved → checked_out → returned`; `pending → rejected/cancelled`. Sem deleção de empréstimos concluídos.
- **Conflitos:** um índice único **parcial** (`instrument_loans_one_active_per_asset`) bloqueia duas linhas `approved`/`checked_out` para o mesmo `instrument_id`, inclusive em duas transações simultâneas. A API converte `23505` em HTTP 409.
- **RLS:** estudante só consulta linhas em que `student_id = auth.uid()`. Equipe autorizada vê a fila. A disponibilidade é exposta por uma função agregada que revela somente os IDs de exemplares ocupados, nunca o estudante ou a finalidade.
- **Auditoria:** `reviewed_by/at`, `checked_out_by/at`, `returned_by/at`, `decision_note`, `checkout_condition/note`, `return_condition/note` são registrados e protegidos no banco; identidade vem da sessão Supabase.
- **Navegação:** mega-menu **Comunidade** concentra Mural, Eventos, Reserva de salas, Acervo e empréstimos, Explorar aulas e o futuro Portfólio.

## 1. Antes de aplicar

1. Faça backup do esquema/dados existentes no Supabase.
2. Confira se o projeto apontado por `frontend/.env` e `backend/.env` é o Sonorum, não outro projeto.
3. Confirme que a V7 e a query `06_RF05_RF09_reservas_salas.sql` já estão instaladas.
4. No **SQL Editor**, execute `querys_supa/08_RF10_RF12_acervo_emprestimos.sql` **uma única vez**. O script contém `BEGIN/COMMIT`; em caso de falha, corrija os dados legados antes de repetir.
5. Execute `querys_supa/09_RF10_RF12_verificacao.sql` (somente consultas de leitura).
6. Não adicione chave `service_role` ao frontend ou ao backend. O projeto continua usando `SUPABASE_PUBLISHABLE_KEY` e o JWT do usuário.
7. Se ainda não tiver, dê papel de equipe a uma conta usando a gestão de perfis da V7; a conta **de estudante não pode se autopromover**.

**Compatibilidade com o primeiro kit do MVP:** aquele SQL antigo podia ter criado `instruments.asset_tag` e `instrument_loans.borrower_id`. A query 08 inclui uma migração **aditiva** para esses campos, preservando a identidade e o histórico. Se houver patrimônio duplicado, dados inválidos, fotos antigas em HTTP ou empréstimos com estados inconsistentes, a aplicação pode rejeitar a migração até você revisar os dados. Não apague o histórico para fazê-la passar.

**Fotos:** o SQL cria o bucket público `sonorum-instruments`, limitado a JPG/PNG/WebP até 2 MB. Apenas operadores podem enviar arquivos. A leitura das fotos é pública porque são imagens institucionais do catálogo. Evite fotos com dados pessoais sem autorização.

## 2. Instalar a atualização do código

- **ZIP de atualização:** extraia as pastas `backend/`, `frontend/`, `querys_supa/`, `tests/` sobre o projeto Sonorum existente; mantenha seus arquivos `.env` locais.
- **ZIP completo:** contém a pasta `Sonorum/` pronta para uma instalação limpa; copie suas chaves locais com cuidado, nunca as compartilhe.

Terminais no Windows:

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

Abra `http://localhost:5173/#/acervo` ou **Comunidade → Acervo e empréstimos**. O backend usa a porta 3333 pelo proxy do Vite.

## 3. Critérios de aceite e testes manuais

Teste com **duas contas `student` distintas** e **uma conta `staff`** ou `admin` autorizada:

| Verificação | Resultado esperado |
|---|---|
| Equipe cria patrimônio `MUS-001` com categoria Violão | Exemplar aparece no catálogo; cadastro com mesmo código retorna 409 |
| Equipe cria patrimônio `MUS-002`, também Violão | Ambos aparecem separadamente; categorias podem repetir |
| Aluno A solicita `MUS-001` com finalidade e data | Pedido `pending`; nenhuma retirada automática |
| Aluno B solicita o mesmo `MUS-001` | Pode haver pedido `pending` também; ainda não é reserva garantida |
| Operador aprova pedido de A | Status `approved`, data e identidade da decisão registradas |
| Operador tenta aprovar pedido de B | HTTP 409 por índice único parcial, inclusive em concorrência |
| Aluno B consulta `/api/instrument-loans` | Não recebe a finalidade, o nome nem o pedido do aluno A |
| Aluno A tenta aprovar via HTTP direto | 403, sem autorização por papel vindo do frontend |
| Operador registra retirada | Exige estado inspecionado; vira `checked_out` e registra timestamp/operador |
| Operador confere devolução | Exige estado conferido; vira `returned`; instrumento volta ao acervo |
| Devolução como `needs_repair` | Conservação atualizada e exemplar entra em manutenção |
| Student cancela seu pedido `pending` | Vira `cancelled`, permanece no histórico |
| Staff recusa `pending` sem justificativa | Negado, exige ao menos cinco caracteres |
| Tentar deletar empréstimo concluído na API | Não há rota DELETE; SQL não concede DELETE; registro preservado |
| Consulta de histórico com mais de 60 linhas | Botão “Carregar movimentações anteriores” oferece paginação |

**Teste de corrida obrigatório no Supabase real:** crie dois pedidos pendentes para o mesmo exemplar e faça dois operadores aprovarem de duas sessões separadas ao mesmo tempo. Uma aprovação deve vencer e a outra deve falhar com `23505` (traduzido na API para 409). A garantia vem do índice do Postgres, não da interface.

## 4. Arquivos principais

- `querys_supa/08_RF10_RF12_acervo_emprestimos.sql` : tabelas, migração aditiva, índice único parcial, triggers, RLS, RPCs e Storage.
- `querys_supa/09_RF10_RF12_verificacao.sql` : inspeção de esquema e regras.
- `backend/src/instrumentLoans/routes.js` : GET/POST/PATCH de acervo e empréstimos autenticados.
- `backend/src/app.js` : montagem das rotas.
- `frontend/src/services/communityApi.js` : métodos do novo módulo.
- `frontend/src/pages/InstrumentLoansPage.jsx` : catálogo, fila, inspeções, histórico e inventário.
- `frontend/src/styles/assets.css` : identidade visual isolada.
- `frontend/src/components/Header.jsx` e `frontend/src/App.jsx` : mega-menu e navegação.

## 5. Limitações e refinamentos posteriores

- O banco remoto **não foi alterado automaticamente**: a query deve ser executada no Supabase certo por você.
- O build integrado e o teste de concorrência real dependem da instalação de dependências e do banco remoto. Neste ambiente foi possível checar sintaxe, importações e regras estáticas, não um teste end-to-end.
- A emissão de um termo de responsabilidade, assinaturas digitais, relatórios patrimoniais exportáveis e notificações por e-mail são melhorias futuras, fora deste PROMPT 03.
- A foto é enviada ao Storage antes da gravação da ficha. Se o cadastro falhar depois do upload, o arquivo pode ficar órfão. Uma rotina controlada de limpeza desses arquivos será necessária antes de produção.
- Sem confirmação do e-mail, a titularidade da conta não é comprovada. Mantenha o cadastro institucional em homologação e autorize perfis elevados manualmente.

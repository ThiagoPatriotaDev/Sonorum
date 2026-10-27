# Sonorum V8.1 — Correção da integração de reservas

## Sintoma

`Uncaught TypeError: CommunityApi.getRooms is not a function` na tela `#/salas`.

## Causa

A V8 incluiu a tela e as rotas Express, porém faltaram 7 métodos no objeto `CommunityApi` do frontend.

## Arquivo atualizado

`frontend/src/services/communityApi.js`. Foram adicionados: `getRooms`, `roomReservations`, `roomBusySlots`, `requestRoom`, `decideRoom`, `createRoom` e `updateRoom`.

Todas as chamadas passam por `apiRequest` e enviam o token da sessão Supabase. Não alteramos as tabelas, nem a autenticação, nem o design.

## Como aplicar

Se está usando a V8, extraia o ZIP pequeno e copie `frontend/src/services/communityApi.js` para a mesma pasta do projeto, substituindo o arquivo anterior. Reinicie o frontend (`npm run dev`) ou atualize a página.

Certifique-se de que **backend** (`localhost:3333`) e **frontend** (`localhost:5173`) estejam funcionando. O arquivo SQL `querys_supa/06_RF05_RF09_reservas_salas.sql` só precisa ser executado uma vez.

**Verificação:** carregue `#/salas` com uma conta autenticada; a consulta de salas deve ocorrer sem o erro de método ausente. Se aparecer HTTP 404/500, confira a inicialização do backend e a execução da query SQL.

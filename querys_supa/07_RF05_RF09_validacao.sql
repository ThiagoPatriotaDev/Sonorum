-- SQL de INSPEÇÃO: pode executar sem alterar dados.
SELECT 'rooms' AS tabela,count(*) AS quantidade FROM public.rooms
UNION ALL SELECT 'room_reservations',count(*) FROM public.room_reservations;
SELECT conname,contype,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid='public.room_reservations'::regclass
AND conname='room_reservations_approved_no_overlap';
SELECT tablename,policyname,cmd,roles,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('rooms','room_reservations') ORDER BY tablename,policyname;
-- Cenários a validar por duas contas de teste na aplicação:
-- 1: estudante A solicita um horário; estudante B não vê a finalidade ou proprietário.
-- 2: operador aprova pedido A; segundo pedido de mesma sala com interseção gera 409 SQLSTATE 23P01.
-- 3: aprovar 14:00-15:00 e 15:00-16:00 é permitido (limites [)).
-- 4: dois operadores tentam aprovar simultaneamente; no máximo um commit deve ocorrer.
-- 5: estudante não aprova, cancela sua solicitação pendente e só cancela aprovada antes do início.
-- 6: recusas administrativas exigem justificativa; concluir somente após horário final.
-- 7: sessão anônima não pode selecionar dados privados nem executar room_busy_slots.

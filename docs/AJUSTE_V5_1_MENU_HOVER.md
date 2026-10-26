# Sonorum V5.1 | Correção da navegação institucional

## Correção aplicada

- O dropdown institucional agora permanece aberto enquanto o mouse está sobre o botão **Início** ou sobre o próprio painel.
- Foi criada uma área invisível de passagem do cursor entre o botão e o mega-menu. Ela elimina o fechamento causado pelo pequeno espaço entre os dois elementos.
- Ao atravessar diagonais ou pequenos espaços fora da área de passagem, há uma tolerância de **320 ms** antes de fechar. A contagem é cancelada assim que o mouse entra novamente no botão ou painel.
- Ao sair de ambos os espaços, o menu fecha. A tecla **Escape** ou um clique fora também fecha o menu.
- O menu para telas sensíveis ao toque continua por clique, sem depender de hover.

## Arquivos alterados

- `frontend/src/components/Header.jsx`
- `frontend/src/styles/global.css`

## Teste manual rápido

1. Na home, passar o mouse sobre **Início**.
2. Mover lentamente para baixo, até entrar no mega-menu. Ele não deve desaparecer.
3. Navegar com o cursor pelos quatro itens e pelo painel de prévia. Deve continuar aberto.
4. Mover o cursor para fora do painel e do botão. O menu deve fechar após uma curta tolerância.
5. Abrir pelo botão ou seta; pressionar **Escape** e clicar fora para confirmar fechamento.
6. Em tela pequena, testar abertura/fechamento pelo toque.

## Aplicação

Use o ZIP completo V5.1 em uma pasta nova ou substitua apenas os dois arquivos do patch na V5 existente. Reinicie o Vite se necessário e recarregue a página.

# Sonorum Studio V4.1 — Beethoven na seção abaixo

Revisão pontual do design da página inicial, feita a partir da V4.

## Alterações

1. **Primeira tela (hero):** a imagem de Beethoven foi removida do componente `SonicSculpture`. O título “Toda grande história começa com um som”, os botões, a seta “Descubra mais”, a escultura de ondas em SVG e a animação Three.js continuam no mesmo lugar. A escultura recuperou a opacidade original do disco e das ondas, que havia sido reduzida na V4.
2. **Seção abaixo da seta:** o retrato artístico agora aparece na seção “Mais que estudar música. Fazer parte dela.”, ao lado do texto do curso. Foi inserido em uma área própria com cantos assimétricos, borda discreta e tratamento responsivo. A mesma arte local `frontend/public/images/beethoven-art.webp` foi reaproveitada; nenhum download externo é necessário para exibi-la.
3. **Sem mudanças funcionais:** ferramentas de partitura, comunidade, perfil, áudio, trilhas e endpoints do backend seguem iguais à V4.

## Arquivos alterados

- `frontend/src/components/SonicSculpture.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/styles/global.css`

## Como rodar no Windows

Extraia o arquivo em uma **pasta nova**, sem misturar com versões anteriores.

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` e role a primeira dobra até “Mais que estudar música” para conferir o reposicionamento.

A V4.1 continua dependendo de `three`, listado no `frontend/package.json`. Se necessário, execute `npm install three` **dentro da pasta frontend**.

## Validação realizada

- JSX editado analisado com `@babel/parser`: OK.
- Referência a Beethoven fora do componente da primeira tela, e presente na seção de introdução: OK.
- Imagem local de 750 × 816 pixels verificada: OK.
- Integridade do ZIP verificada: OK.

*Não houve teste de renderização WebGL em navegador nesta etapa. A alteração é somente de layout e não modifica a implementação do Three.js.*

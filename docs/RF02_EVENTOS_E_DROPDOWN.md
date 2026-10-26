# Sonorum V5.4 | RF02, Agenda de eventos e navegação de Comunidade

## Objetivo
Exibir agenda pública do curso (apresentações, projetos, oficinas, encontros) com data, horário, local e descrição. O documento de requisitos não fornece eventos oficiais já confirmados; por isso, o sistema **não inventa dados oficiais**.

## Navegação
- O item **Comunidade** mantém seu destino anterior ao ser clicado: mural de videoaulas.
- Passar o mouse na região do item ou clicar no ícone triangular abre o mega-menu.
- O painel mantém-se aberto quando o cursor passa do gatilho para o próprio menu, com tolerância de 320 ms; fecha ao sair de ambas as regiões, clicar fora ou pressionar Esc.
- No celular, toque no ícone de Comunidade para expandir. Não depende de hover.
- O menu oferece **Mural musical** e **Agenda de eventos**. O portfólio artístico aparece como futuro módulo, sem botão inativo.
- O triângulo arredondado de ambos os menus e o da conta foi reduzido e alinhado ao texto.

## Página de Eventos
- Endereço direto `#/eventos`.
- Agenda oficial como visualização inicial. Se não houver eventos confirmados, apresenta mensagem clara.
- Modo **Demonstração**, com três eventos explicitamente *fictícios*, serve apenas para validar visualização, filtros, detalhes e navegação. **Não divulgue os exemplos como programação do IFPE**.
- Filtros por tipo, busca textual e período (próximos / anteriores / todos).
- Cada evento deve ter título, tipo, data/hora, local e descrição. Detalhes aparecem sob demanda.

## Para cadastrar eventos oficiais
Abra `frontend/src/data/events.js` e preencha o array `OFFICIAL_EVENTS` com dados homologados pela coordenação. Exemplo de estrutura, **não de evento real**:

```js
{
  id: 'slug-unico',
  category: 'apresentacao', // apresentacao | projeto | oficina | encontro
  title: 'TÍTULO APROVADO',
  startAt: '2026-11-15T19:00:00-03:00',
  endAt: '2026-11-15T20:30:00-03:00',
  location: 'LOCAL CONFIRMADO',
  description: 'DESCRIÇÃO APROVADA',
  audience: 'PÚBLICO-ALVO',
}
```

A aplicação apresenta todas as datas no fuso `America/Recife`.

## Integração futura com Supabase
Quando o banco estiver conectado, a fonte `OFFICIAL_EVENTS` poderá ser substituída por registros publicados no Supabase. O painel administrativo deverá ter autenticação e permissões; visitantes devem acessar apenas eventos publicados. **Essa integração ainda não foi implementada nesta versão.**

## Checklist de aceitação
- [ ] Acesso a Comunidade > Agenda de eventos por mouse e toque.
- [ ] Dropdown não fecha enquanto mouse permanece em botão ou painel.
- [ ] Fora da região, menu fecha após 320 ms.
- [ ] Menu fecha ao clicar fora e ao pressionar Esc.
- [ ] Ícones dos dois dropdowns têm o mesmo tamanho reduzido.
- [ ] Agenda oficial inicialmente vazia não exibe eventos fictícios como reais.
- [ ] Modo demonstração exibe exemplos identificados.
- [ ] Busca, filtro por tipo, período e expandir/recolher funcionam.
- [ ] Acesso direto por `#/eventos` funciona.
- [ ] Layout responsivo no celular.

## Instalação
Dentro de `frontend`: `npm install` e `npm run dev`. Backend como nas versões anteriores. Não há novas dependências obrigatórias introduzidas pelo RF02.

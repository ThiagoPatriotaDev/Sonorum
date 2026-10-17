# MelodiaLab — Arquitetura em Camadas (React + Node.js + JS Modular)

Este projeto foi refatorado de um arquivo monolítico para uma **arquitetura em camadas** separando responsabilidades entre **Frontend (React)**, **Backend (Node.js / Express)** e **Módulos JavaScript Independentes (Web Audio API, Renderizador SVG de Partituras e Persistência Híbrida `localStorage` + API REST)**.

## Estrutura de Pastas do Projeto

```text
melodialab-projeto/
├── README.md                         # Documentação da arquitetura e instruções
├── backend/                          # Camada de Servidor e API REST (Node.js + Express)
│   ├── package.json
│   └── src/
│       ├── server.js                 # Ponto de entrada HTTP
│       ├── app.js                    # Configuração do Express, CORS e rotas
│       ├── data/
│       │   └── seedData.js           # Dados iniciais de instrumentos, aulas e partituras
│       ├── repositories/
│       │   ├── instruments.repository.js  # Camada de acesso a dados de instrumentos/aulas
│       │   └── scores.repository.js       # Camada de persistência de partituras (JSON/Disco)
│       ├── services/
│       │   ├── instruments.service.js     # Regras de negócio de ensino e progresso
│       │   └── scores.service.js          # Regras de validação e manipulação de partituras
│       ├── controllers/
│       │   ├── instruments.controller.js  # Tratamento de requisições HTTP de ensino
│       │   └── scores.controller.js       # Tratamento de requisições HTTP de partituras
│       └── routes/
│           ├── instruments.routes.js      # Endpoints /api/instruments
│           └── scores.routes.js           # Endpoints /api/scores
│
├── frontend/                         # Camada de Interface Web (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                  # Bootstrap do React
│       ├── App.jsx                   # Roteamento de abas e estado global
│       ├── styles/
│       │   └── global.css            # Estilos modulares e layout de impressão
│       ├── constants/
│       │   └── musicCatalog.js       # Catálogo de frequências, notas na Clave de Sol e dados base
│       ├── services/
│       │   ├── storageService.js     # Camada de persistência (localStorage + sincronização com API Node)
│       │   └── audioEngine.js        # Motor de áudio Web Audio API por instrumento
│       ├── utils/
│       │   └── exportUtils.js        # Exportação de arquivos (.svg, .json) e impressão
│       ├── components/
│       │   ├── Header.jsx            # Barra de navegação superior e contador de partituras
│       │   └── StaffCanvas.jsx       # Renderizador SVG interativo do pentagrama musical
│       └── pages/
│           ├── InstrumentsPage.jsx   # Aba 1: Seleção de instrumentos e trilha de aulas
│           ├── ScoreEditorPage.jsx   # Aba 2: Editor interativo de partituras
│           └── MyScoresPage.jsx      # Aba 3: Gerenciador de partituras salvas
│
└── web-modular/                      # Versão Web em Camadas Puro (HTML + CSS + ES Modules JS)
    ├── index.html                    # Estrutura semântica limpa (sem CSS/JS inline)
    ├── css/
    │   └── styles.css                # Folha de estilo isolada
    └── js/
        ├── main.js                   # Inicializador da aplicação
        ├── data/
        │   └── catalog.js            # Catálogo musical e aulas
        ├── services/
        │   ├── storageRepository.js  # Camada de persistência no localStorage
        │   └── audioEngine.js        # Sintetizador Web Audio API
        ├── components/
        │   └── staffRenderer.js      # Gerador puro de SVG do pentagrama
        └── controllers/
            └── appController.js      # Controlador de eventos e atualização de DOM
```

## Como Executar o Projeto

### 1. Rodando o Backend (Node.js + Express)
```bash
cd backend
npm install
npm run dev
# Servidor disponível em http://localhost:3333/api
```

### 2. Rodando o Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Aplicação React disponível em http://localhost:5173
```
> **Nota sobre o `localStorage`**: O serviço `frontend/src/services/storageService.js` funciona de forma híbrida. Ele salva e lê imediatamente do `localStorage` do navegador (garantindo funcionamento offline instantâneo) e também sincroniza com o backend Node.js quando o servidor está ativo.

### 3. Rodando a Camada Web Modular (Sem precisar de build)
Se quiser testar a separação em camadas usando apenas o navegador (ES Modules nativos):
```bash
cd web-modular
npx serve .
# Ou abra com a extensão Live Server do VS Code
```

# Sonorum | Brief criativo e roadmap

## Norte criativo

**O Sonorum não deve parecer um painel escolar nem um agregador genérico de cards.** Deve transmitir a experiência de entrar em um estúdio/conservatório contemporâneo. Sua voz visual combina calor humano, disciplina de partitura e experimentação sonora.

### Brainstorm de três direções

**Resonância** (aplicada nesta versão) | Editorial e sensorial. Fundo ameixa profundo, superfícies de papel, laranja/cobre e rosa antigo. Tipos grandes e serifados sobre uma geometria de ondas sonoras em pseudo-3D (SVG + CSS). A navegação tem uma hierarquia clara: conhecer o curso → explorar instrumentos → produzir música → compartilhar.

**Partitura Viva** (alternativa para futuro) | Fundo de papel creme e linhas finas de pentagrama atravessando seções. Microinterações que fazem as notas responderem a ações, elementos editoriais recortados e seções compostas como movimentos de uma suíte.

**Frequência** (alternativa para campanhas e eventos) | Noturno, mais elétrico, waveform reativa ao áudio e instalações audiovisuais. Usar com moderação, com opção de reduzir movimento, para não perder acessibilidade e identidade acadêmica.

### Design system escolhido

- **Cores**: ameixa `#18131e`, superfície creme `#f8f5ef`, acento cobre `#b5644e`, luz dourada `#edb58b`, verde conclusão `#4e8162`.
- **Fontes**: DM Sans (interface), Instrument Serif (expressão), DM Mono (legendas e metadados).
- **Componentes**: CTA em cápsula, blocos editoriais abertos, cards de instrumento coloridos, linhas de separação discretas.
- **Arte**: ondas procedurais em SVG, disco sonoro com profundidade, símbolos musicais 3D construídos com CSS. Sem bibliotecas 3D pesadas na primeira etapa.
- **Acessibilidade**: teclado, textos legíveis, controles com rótulos, e suporte a `prefers-reduced-motion`.

## Arquitetura de experiência

| Área | Visitante | Aluno ou professor logado |
|---|---|---|
| Página inicial e informações do curso | Pode ler | Pode ler |
| Instrumentos e tutoriais | Pode explorar e praticar | Pode explorar e praticar |
| Videoaulas de estudantes e professores | Pode assistir | Pode assistir e publicar |
| Estúdio | Pode experimentar e exportar MusicXML | Pode salvar e organizar suas composições locais |
| Biblioteca pessoal | Incentivo ao cadastro | Consulta o acervo salvo neste navegador |

### Inovações a explorar na etapa seguinte

1. **Pentagrama vivo**: ao passar o cursor por uma nota da partitura, destacar o som e sua posição num pequeno teclado virtual.
2. **Laboratório de escuta**: demonstração em áudio com modos de estudo lento, repetir trecho e comparar gravações.
3. **Sala de ensemble**: alunos montam pequenas coleções coletivas de exercícios e vídeos, organizadas por instrumento ou projeto.
4. **Trilhas com objetivos reais**: módulos de leitura rítmica, postura, percepção auditiva e repertório, com progresso por usuário.
5. **Vitrine de recitais**: sessões institucionais para concertos, apresentações e atividades do curso, com aprovação editorial.
6. **Caderno de ensaio**: anotações anexadas a aulas e partituras, privadas ou compartilháveis pelo autor.
7. **Compositor avançado**: andamento, compassos, pausas, acidentes, claves, harmonização e exportação compatível com MuseScore. Exige modelagem musical mais robusta que a atual lista linear de notas.
8. **Acessibilidade musical**: navegação por teclado, descrições sonoras do conteúdo da pauta, controle de velocidade e legendas de vídeos.
9. **Identidade viva em eventos**: capas e mensagens do portal podem refletir apresentações e calendários do curso, sem sobrecarregar o usuário.

## Ponto técnico: OpenSheetMusicDisplay versus VexFlow

OSMD lê e apresenta **MusicXML** com diagramação automática. É excelente para a etapa de visualização/impressão, mas **não oferece um editor completo**. VexFlow fornece os componentes básicos para desenho de pautas e notas, exigindo mais lógica para layout e manipulação.

A arquitetura proposta separa: **modelo musical editável** → **exportador MusicXML** → **renderizador OSMD**. O áudio continua via Web Audio API (ou motor mais avançado em versões futuras). Documentação:
- https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started
- https://opensheetmusicdisplay.org/typescript-library/
- https://github.com/0xfe/vexflow

## Prioridades reais

### Etapa 1 | Protótipo visual e funcional (iniciada)
- [x] Identidade visual diferenciada e home institucional
- [x] Trilhas de quatro instrumentos preservadas
- [x] Exemplo sonoro e passagem da aula para o editor
- [x] Contas básicas de alunos/professores, com perfil autodeclarado
- [x] Publicação de videoaulas via link do YouTube
- [x] Exportação MusicXML e visualização OSMD sob demanda
- [x] Biblioteca de partituras local segmentada por conta
- [x] Estilos responsivos e movimento reduzido

### Etapa 2 | Pronto para pilotos com curso real
- [ ] Confirmar instituição, nome oficial do curso, coordenação, grade, duração e URLs de editais.
- [ ] Substituir arquivo JSON por banco de dados com backup e políticas de acesso.
- [ ] Adicionar verificação de email, recuperação de senha e aprovação de perfil docente.
- [ ] Implementar revisão/moderação de videoaulas (denúncia, ocultação, retirada e direitos autorais).
- [ ] Sincronizar partituras e progresso entre dispositivos por usuário.
- [ ] Escrever testes de integração e realizar testes em navegadores/telas pequenas.
- [ ] Integrar estatísticas e acessibilidade de ensino com consentimento e controles LGPD.

### Etapa 3 | Experiência musical avançada
- [ ] Revisar estrutura do modelo de partitura para música polifônica, múltiplas vozes e compassos editáveis.
- [ ] Adicionar clique na nota profissional para escuta isolada e prática lenta.
- [ ] Criar criação de aulas vinculadas a módulos e fluxo de aprovação da coordenação.
- [ ] Explorar instrumentos 3D otimizados com WebGL apenas se agregarem aprendizagem, com fallback 2D.
- [ ] Dar suporte opcional a vídeo enviado diretamente e armazenado em serviço de objetos com transcodificação.

## Restrições e decisões honestas

- **Não inventar** informações oficiais sobre seleção, matrícula ou currículo.
- **Não prometer** 3D pesado: nesta versão, a arte é SVG/CSS, rápida e adaptativa.
- **Não afirmar** que vídeos são arquivos enviados ao servidor. A publicação atual aceita links YouTube.
- **Não afirmar** que salvar partitura sincroniza na conta em qualquer máquina: o armazenamento atual é local ao navegador.
- **Não tratar** perfil docente autodeclarado como autorização institucional real.

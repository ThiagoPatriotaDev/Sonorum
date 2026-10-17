export const INITIAL_INSTRUMENTS = [
  {
    id: 'violao',
    name: 'Violão',
    scoreInstrument: 'Violão',
    emoji: '🎸',
    category: 'Cordas Dedilhadas',
    description: 'Aprenda acordes abertos, ritmos populares, dedilhado e leitura de cifras e partituras.',
    lessons: [
      {
        id: 'violao-1',
        title: '1. Postura, Afinação Padrão e as 6 Cordas Soltas',
        level: 'Iniciante',
        duration: '12 min',
        summary: 'Conheça o nome de cada corda solta (Mi, Si, Sol, Ré, Lá, Mi) e como posicionar as mãos sem tensão.',
        steps: [
          'Apoie o bojo do violão sobre a perna mantendo a coluna alinhada e os ombros relaxados.',
          'Posicione o polegar esquerdo atrás do braço na vertical para dar alcance aos dedos 1, 2, 3 e 4.',
          'Toque as cordas soltas usando o polegar (P) nos bordões e Indicador (I), Médio (M) e Anelar (A) nas primas.'
        ],
        diagram: '1ª corda: e (Mi4) ---0---\n2ª corda: B (Si3) ---0---\n3ª corda: G (Sol3) ---0---\n4ª corda: D (Ré3) ---0---\n5ª corda: A (Lá2) ---0---\n6ª corda: E (Mi2) ---0---',
        practiceNotes: [
          { pitch: 'E4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'B4', dur: 1 },
          { pitch: 'E5', dur: 1 }, { pitch: 'B4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'E4', dur: 2 }
        ],
        annotations: 'Exercício de cordas soltas e arpejo P - I - M - A no violão.'
      },
      {
        id: 'violao-2',
        title: '2. Primeiros Acordes: Dó Maior (C), Sol Maior (G) e Lá Menor (Am)',
        level: 'Iniciante',
        duration: '18 min',
        summary: 'Domine a transição limpa entre três dos acordes mais usados na música popular.',
        steps: [
          'Monte o Dó Maior (C) com Dedo 1 na 2ª corda (casa 1), Dedo 2 na 4ª corda (casa 2) e Dedo 3 na 5ª corda (casa 3).',
          'Para o Lá Menor (Am), mantenha os dedos 1 e 2 fixos e mova apenas o Dedo 3 para a 3ª corda (casa 2).',
          'Pratique 4 batidas por compasso alternando C -> Am -> G -> C a 80 BPM.'
        ],
        diagram: 'C (Dó Maior): x-3-2-0-1-0 | Am (Lá Menor): x-0-2-2-1-0 | G (Sol Maior): 3-2-0-0-0-3',
        practiceNotes: [
          { pitch: 'C4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'G4', dur: 1 },
          { pitch: 'C5', dur: 1 }, { pitch: 'A4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'G4', dur: 2 }
        ],
        annotations: 'Progressão harmônica C -> Am -> G.'
      }
    ]
  },
  {
    id: 'violino',
    name: 'Violino',
    scoreInstrument: 'Violino',
    emoji: '🎻',
    category: 'Cordas Friccionadas',
    description: 'Domine a empunhadura do arco, afinação em quintas (Sol-Ré-Lá-Mi) e primeira posição.',
    lessons: [
      {
        id: 'violino-1',
        title: '1. Postura, Espaleira e Empunhadura do Arco',
        level: 'Iniciante',
        duration: '15 min',
        summary: 'Aprenda a equilibrar o arco com o polegar curvo e passar o arco paralelo ao cavalete.',
        steps: [
          'Ajuste a espaleira para sustentar o violino sem erguer o ombro esquerdo.',
          'Posicione o polegar direito curvado entre o talão e a guarnição e deixe o dedo mínimo redondo sobre a vareta.',
          'Execute notas longas de 2 tempos nas cordas soltas Ré (D4), Lá (A4) e Mi (E5).'
        ],
        diagram: 'Cordas Soltas: 4ª Sol (G3) | 3ª Ré (D4) | 2ª Lá (A4) | 1ª Mi (E5)',
        practiceNotes: [
          { pitch: 'D4', dur: 2 }, { pitch: 'A4', dur: 2 }, { pitch: 'E5', dur: 2 }, { pitch: 'A4', dur: 2 }
        ],
        annotations: 'Estudo de cordas soltas com arco inteiro.'
      },
      {
        id: 'violino-2',
        title: '2. Melodia Clássica: Tema da Ode à Alegria (Beethoven)',
        level: 'Intermediário',
        duration: '25 min',
        summary: 'Aplique a fôrma de dedos 1-2-3 na corda Ré para tocar o tema da 9ª Sinfonia.',
        steps: [
          'Na corda Ré (D4): Dedo 1 = Mi (E4), Dedo 2 = Fá# (F#4), Dedo 3 colado ao 2 = Sol (G4).',
          'Use a corda Lá solta (0) ou o 4º dedo para a nota Lá (A4).',
          'Mantenha o arco na região central com articulação détaché suave.'
        ],
        diagram: 'Notas: F#4 F#4 G4 A4 | A4 G4 F#4 E4 | D4 D4 E4 F#4 | F#4 E4 E4',
        practiceNotes: [
          { pitch: 'F#4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'A4', dur: 1 },
          { pitch: 'A4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'E4', dur: 1 },
          { pitch: 'D4', dur: 1 }, { pitch: 'D4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'F#4', dur: 1 },
          { pitch: 'F#4', dur: 2 }, { pitch: 'E4', dur: 2 }
        ],
        annotations: 'Ode à Alegria — 1ª posição na corda Ré e corda Lá.'
      }
    ]
  },
  {
    id: 'teclado',
    name: 'Teclado / Piano',
    scoreInstrument: 'Teclado',
    emoji: '🎹',
    category: 'Teclas',
    description: 'Localize o Dó Central, pratique passagem de polegar nas escalas e coordene melodia e harmonia.',
    lessons: [
      {
        id: 'teclado-1',
        title: '1. Dó Central (C4) e Escala com Passagem de Polegar',
        level: 'Iniciante',
        duration: '15 min',
        summary: 'Identifique o Dó Central à esquerda do par de teclas pretas e pratique o dedilhado 1-2-3-1-2-3-4-5.',
        steps: [
          'Toque Dó4 (1), Ré4 (2) e Mi4 (3) com a mão direita.',
          'Passe o polegar (1) por baixo do dedo médio para tocar o Fá4 e siga até o Dó5 (5).',
          'Mantenha os pulsos alinhados e os dedos curvados como se segurasse uma pequena esfera.'
        ],
        diagram: 'Notas: C4(1) - D4(2) - E4(3) - F4(1) - G4(2) - A4(3) - B4(4) - C5(5)',
        practiceNotes: [
          { pitch: 'C4', dur: 1 }, { pitch: 'D4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'F4', dur: 1 },
          { pitch: 'G4', dur: 1 }, { pitch: 'A4', dur: 1 }, { pitch: 'B4', dur: 1 }, { pitch: 'C5', dur: 2 }
        ],
        annotations: 'Escala de Dó Maior ascendente (1 oitava).'
      }
    ]
  },
  {
    id: 'flauta',
    name: 'Flauta Doce',
    scoreInstrument: 'Flauta',
    emoji: '🪈',
    category: 'Sopro',
    description: 'Controle a articulação com a sílaba "Tu", respiração diafragmática e digitação de Si, Lá e Sol.',
    lessons: [
      {
        id: 'flauta-1',
        title: '1. Primeiras Notas da Mão Esquerda: Si, Lá e Sol',
        level: 'Iniciante',
        duration: '12 min',
        summary: 'Aprenda a vedar os três furos superiores com a mão esquerda e produzir som limpo.',
        steps: [
          'Feche o furo portavoz traseiro com o polegar esquerdo.',
          'Indicador no 1º furo = Si (B4); adicione o médio no 2º furo = Lá (A4); adicione o anelar no 3º furo = Sol (G4).',
          'Articule cada nota soprando suavemente como se dissesse "Tu".'
        ],
        diagram: 'Si (B4): ● | ● ○ ○   Lá (A4): ● | ● ● ○   Sol (G4): ● | ● ● ●',
        practiceNotes: [
          { pitch: 'B4', dur: 1 }, { pitch: 'A4', dur: 1 }, { pitch: 'G4', dur: 2 },
          { pitch: 'B4', dur: 1 }, { pitch: 'A4', dur: 1 }, { pitch: 'G4', dur: 2 }
        ],
        annotations: 'Articulação suave com sopro constante.'
      }
    ]
  },
  {
    id: 'canto', name: 'Canto', scoreInstrument: 'Canto', emoji: '🎤', category: 'Voz',
    description: 'Respiração, afinação e técnica vocal com exercícios de escuta.',
    lessons: [{ id: 'canto-1', title: '1. Respiração e Aquecimento Vocal', level: 'Iniciante', duration: '14 min',
      summary: 'Pratique emissão confortável e afinação em pequenas sequências de notas.',
      steps: ['Alinhe a postura sem tensionar pescoço e ombros.', 'Expire em fluxo contínuo e sem forçar a garganta.', 'Cante as notas Dó, Ré, Mi, Ré, Dó em volume moderado e região confortável.'],
      diagram: 'Solfejo: Dó – Ré – Mi – Ré – Dó',
      practiceNotes: [{pitch:'C4',dur:1},{pitch:'D4',dur:1},{pitch:'E4',dur:2},{pitch:'D4',dur:1},{pitch:'C4',dur:2}], annotations: 'Aqueça sem esforço e interrompa diante de desconforto.' }]
  },
  {
    id: 'baixo', name: 'Baixo elétrico', scoreInstrument: 'Baixo', emoji: '🎸', category: 'Cordas',
    description: 'Pulsação, linhas graves e coordenação das mãos.',
    lessons: [{ id:'baixo-1', title:'1. Pulsação e Primeira Linha de Baixo', level:'Iniciante', duration:'16 min',
      summary:'Pratique a marcação de pulsos regulares com um padrão simples.',
      steps:['Posicione o instrumento de forma confortável e relaxe os ombros.', 'Alternando indicador e médio, mantenha a pulsação constante.', 'Ouça uma frase simples e repita em andamento lento.'],
      diagram:'Padrão: Dó – Dó – Sol – Sol | Lá – Lá – Sol',
      practiceNotes:[{pitch:'C4',dur:1},{pitch:'C4',dur:1},{pitch:'G4',dur:1},{pitch:'G4',dur:1},{pitch:'A4',dur:1},{pitch:'A4',dur:1},{pitch:'G4',dur:2}], annotations:'Exercício demonstrativo. O som sintetizado não reproduz a tessitura grave real do baixo.' }]
  },
  {
    id: 'saxofone', name: 'Saxofone', scoreInstrument: 'Saxofone', emoji: '🎷', category: 'Sopro',
    description: 'Embocadura, coluna de ar e primeiras melodias.',
    lessons: [{ id:'saxofone-1', title:'1. Coluna de Ar e Frases Curtas', level:'Iniciante', duration:'17 min',
      summary:'Descubra como sustentar notas e construir pequenas frases musicais.',
      steps:['Mantenha a postura ereta, sem rigidez.', 'Trabalhe ataques suaves com emissão estável.', 'Repita a sequência demonstrativa em velocidade lenta.'],
      diagram:'Frase de referência: Sol – Lá – Si – Lá – Sol',
      practiceNotes:[{pitch:'G4',dur:2},{pitch:'A4',dur:1},{pitch:'B4',dur:1},{pitch:'A4',dur:1},{pitch:'G4',dur:2}], annotations:'Notas de referência em som de concerto; a transposição específica do saxofone não está implementada.' }]
  },
  {
    id: 'bateria', name: 'Bateria', scoreInstrument: 'Bateria', emoji: '🥁', category: 'Percussão',
    description: 'Coordenação, divisão rítmica e primeiros grooves.',
    lessons: [{ id:'bateria-1', title:'1. Pulso e Divisão de Quatro Tempos', level:'Iniciante', duration:'13 min',
      summary:'Conte os quatro tempos e separe pulsação de subdivisão.',
      steps:['Conte em voz alta: um, dois, três, quatro.', 'Marque os tempos 1 e 3 com o pé e os tempos 2 e 4 com as mãos.', 'Acompanhe uma sequência rítmica simples, repetindo de forma constante.'],
      diagram:'Contagem: 1 & 2 & 3 & 4 &',
      practiceNotes:[{pitch:'C4',dur:1},{pitch:'REST',dur:.5},{pitch:'G4',dur:.5},{pitch:'C4',dur:1},{pitch:'G4',dur:1}], annotations:'A pauta usa alturas demonstrativas. Notação e timbres de bateria dedicados são uma evolução futura.' }]
  }
];

export const INITIAL_SCORES = [
  {
    id: 'score-demo-1',
    title: 'Ode à Alegria (Tema de Beethoven)',
    author: 'L. van Beethoven',
    instrument: 'Violino',
    tempo: 108,
    meter: '4/4',
    updatedAt: '13/10/2026',
    annotations: 'Tocar na 1ª posição (cordas Ré e Lá) com arcadas longas e destacadas.',
    notes: [
      { pitch: 'F#4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'A4', dur: 1 },
      { pitch: 'A4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'E4', dur: 1 },
      { pitch: 'D4', dur: 1 }, { pitch: 'D4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'F#4', dur: 1 },
      { pitch: 'F#4', dur: 2 }, { pitch: 'E4', dur: 2 }
    ]
  },
  {
    id: 'score-demo-2',
    title: 'Arpejo Clássico em Dó Maior',
    author: 'Estudo de Violão',
    instrument: 'Violão',
    tempo: 92,
    meter: '4/4',
    updatedAt: '13/10/2026',
    annotations: 'Dedilhado mão direita: P - I - M - A | Acordes: C - Am - G7 - C',
    notes: [
      { pitch: 'C4', dur: 0.5 }, { pitch: 'E4', dur: 0.5 }, { pitch: 'G4', dur: 0.5 }, { pitch: 'C5', dur: 0.5 },
      { pitch: 'G4', dur: 0.5 }, { pitch: 'E4', dur: 0.5 }, { pitch: 'C4', dur: 1 },
      { pitch: 'D4', dur: 1 }, { pitch: 'F4', dur: 1 }, { pitch: 'B4', dur: 1 }, { pitch: 'C5', dur: 2 }
    ]
  }
];

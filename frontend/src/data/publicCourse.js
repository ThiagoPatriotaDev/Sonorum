/**
 * Conteúdo institucional público do Sonorum.
 * Fonte: documento de Gerência de Projetos (RF01).
 * Não publicar como informação oficial uma matriz, nomes docentes, carga horária,
 * modalidades ou fotos antes da validação junto ao curso do IFPE-BJ.
 * Edite este arquivo quando receber os dados autorizados.
 */
export const PUBLIC_SECTIONS = [
  { id: 'curso', number: '01', label: 'O curso', title: 'Onde a música encontra seu caminho.', short: 'Apresentação, formação e informações para quem quer ingressar.', symbol: '𝄞', kicker: 'CONHEÇA O CURSO' },
  { id: 'matriz', number: '02', label: 'Matriz curricular', title: 'Toda formação tem sua partitura.', short: 'Organização curricular, componentes e cargas horárias.', symbol: '♬', kicker: 'PERCURSO ACADÊMICO' },
  { id: 'docentes', number: '03', label: 'Docentes', title: 'Pessoas que transformam o aprendizado.', short: 'Conheça os professores, atuações e trajetórias.', symbol: '♩', kicker: 'QUEM FAZ A MÚSICA' },
  { id: 'infraestrutura', number: '04', label: 'Infraestrutura', title: 'Os espaços onde o som ganha vida.', short: 'Ambientes de estudo, acervo e espaços de prática.', symbol: '♫', kicker: 'ESPAÇOS E RECURSOS' }
];

export const PUBLIC_CONTENT = {
  institution: 'IFPE · Campus Belo Jardim',
  title: 'Curso Superior de Música',
  /** Campos aguardando confirmação institucional */
  curriculum: [], // { period: '1º período', disciplines: [{ name, hours, type }] }
  faculty: [], // { id, name, qualification, teachingAreas, bio, image, profileUrl }
  spaces: [], // { id, name, description, image, capacity, resources }
  entryInformation: null, // { summary, officialUrl, updatedAt }
  courseFacts: [
    { name: 'Aprendizagem', detail: 'Uma apresentação pública do curso e de suas possibilidades de formação.' },
    { name: 'Vivência', detail: 'Acesso à comunidade, a produções artísticas e a experiências musicais.' },
    { name: 'Organização', detail: 'Uma futura visão dos espaços e recursos usados no dia a dia do curso.' }
  ],
  illustrativeAxes: [
    { label: 'Teoria e percepção', detail: 'Leitura, escuta e linguagem musical.' },
    { label: 'Prática musical', detail: 'Instrumentos, repertório e interpretação.' },
    { label: 'Criação e performance', detail: 'Composição, arranjos e apresentações.' },
    { label: 'Pesquisa e cultura', detail: 'Projetos, reflexão e extensão musical.' }
  ],
  plannedSpaceTypes: [
    { number: 'A', title: 'Salas de estudo', detail: 'Apresentação dos espaços de prática e consulta de disponibilidade, quando o inventário estiver validado.' },
    { number: 'B', title: 'Acervo de instrumentos', detail: 'Catálogo com categoria, patrimônio e condição de uso, mediante cadastro autorizado.' },
    { number: 'C', title: 'Ambientes do curso', detail: 'Galeria e informações oficiais sobre os ambientes e a infraestrutura disponível.' }
  ]
};

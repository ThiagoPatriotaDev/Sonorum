import React from 'react';
import SonicSculpture from '../components/SonicSculpture.jsx';

const instruments = [
  { name: 'Violão', description: 'Cordas, ritmo e harmonia', emoji: '♬', id: 'violao', number: '01' },
  { name: 'Piano', description: 'Teclas, expressão e teoria', emoji: '♩', id: 'teclado', number: '02' },
  { name: 'Violino', description: 'Melodia, arco e escuta', emoji: '𝄞', id: 'violino', number: '03' },
  { name: 'Flauta', description: 'Respiração e musicalidade', emoji: '♫', id: 'flauta', number: '04' },
];

export default function HomePage({ onNavigate, onChooseInstrument }) {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> UM ESPAÇO PARA VIVER MÚSICA <span className="eyebrow-star">✳</span></div>
          <h1 id="hero-title">Toda grande<br />história começa<br /><em>com um som<span>.</span></em></h1>
          <p>Descubra o universo do curso de Música, aprenda com outras pessoas e transforme suas ideias em partituras. Seu próximo acorde começa aqui.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary hero-cta" onClick={() => onNavigate('ensino')}>Explorar o Sonorum <span>↗</span></button>
            <button className="btn btn-text" onClick={() => document.getElementById('sobre-curso')?.scrollIntoView({ behavior: 'smooth' })}>Conhecer o curso <span>↘</span></button>
          </div>
          <div className="hero-footnote"><span className="footnote-sound"><i /><i /><i /><i /><i /><i /><i /></span> APRENDER • CRIAR • COMPARTILHAR</div>
        </div>
        <SonicSculpture />
        <span className="hero-side-note">UMA EXPERIÊNCIA FEITA DE MÚSICA</span>
      </section>
      <div className="ticker-band" aria-hidden="true"><div>OUÇA COM CURIOSIDADE <b>✳</b> CRIE SEM LIMITES <b>✳</b> APRENDA EM COMUNIDADE <b>✳</b> OUÇA COM CURIOSIDADE <b>✳</b> CRIE SEM LIMITES <b>✳</b></div></div>
      <section className="home-intro" id="sobre-curso">
        <div className="intro-side"><span className="section-index">01 / APRESENTAÇÃO</span><div className="intro-seal">𝄞 <small>O SOM<br />NOS UNE</small></div></div>
        <div className="intro-main"><div className="section-kicker">BEM-VINDO AO SONORUM</div><h2>Mais que estudar música.<br /><em>Fazer parte dela.</em></h2><p>Um portal para conhecer a formação musical e um espaço de aprendizagem contínua. Explore instrumentos, assista a aulas compartilhadas por estudantes e professores e escreva suas próprias composições.</p><div className="intro-split"><div><span>01</span><strong>Conheça o curso</strong><p>Entenda as possibilidades de formação, a rotina de estudos e como buscar informações oficiais de ingresso.</p></div><div><span>02</span><strong>Aprenda fazendo</strong><p>Experimente exercícios, ouça exemplos e pratique no estúdio de partituras.</p></div></div></div>
      </section>
      <section className="instrument-feature">
        <div className="feature-heading"><div><span className="section-index">02 / SEU PRIMEIRO ACORDE</span><h2>Qual som combina<br /><em>com você?</em></h2></div><button className="text-link" onClick={() => onNavigate('ensino')}>Ver todas as aulas <span>↗</span></button></div>
        <div className="feature-grid">{instruments.map((i) => <button className={`feature-instrument feature-${i.id}`} key={i.id} onClick={() => onChooseInstrument(i.id)}><span className="feature-num">{i.number} / INSTRUMENTO</span><span className="feature-glyph" aria-hidden="true">{i.emoji}</span><span className="feature-bottom"><span><strong>{i.name}</strong><small>{i.description}</small></span><span className="feature-arrow">↗</span></span></button>)}</div>
      </section>
      <section className="home-path"><div className="path-art"><span className="path-big-symbol">♪</span><div className="path-rings"><i/><i/><i/></div><small>DA PRIMEIRA NOTA<br />À SUA PRÓPRIA OBRA</small></div><div className="path-copy"><span className="section-index">03 / EXPERIMENTE</span><h2>Seu som merece<br /><em>sair do papel.</em></h2><p>Um estúdio simples de usar para registrar ideias, escutar o que você escreveu e construir partituras. Comece do zero ou pratique a partir de uma aula.</p><button className="btn btn-primary" onClick={() => onNavigate('editor')}>Abrir estúdio de partituras <span>↗</span></button></div></section>
      <section className="course-info"><div><span className="section-index">04 / O CURSO DE MÚSICA</span><h2>Quer transformar<br />paixão em <em>caminho?</em></h2></div><div className="course-info-right"><p>Além da prática, o Sonorum é a porta de entrada para conhecer a formação em Música: áreas de estudo, vivência acadêmica e oportunidades para quem quer seguir nessa jornada.</p><div className="course-row"><b>Formação</b><span>Teoria, prática, criação e escuta musical</span></div><div className="course-row"><b>Como ingressar</b><span>Consulte os editais e canais oficiais da sua instituição</span></div><div className="course-row"><b>Grade e duração</b><span>Informações a confirmar com a coordenação do curso</span></div><p className="course-disclaimer">* Dados institucionais específicos serão incluídos após validação com o curso.</p></div></section>
      <footer className="sonorum-footer"><span>sonorum<span>.</span></span><p>A música é melhor quando circula.</p><button onClick={() => onNavigate('comunidade')}>Conhecer a comunidade ↗</button><small>© {new Date().getFullYear()} SONORUM</small></footer>
    </div>
  );
}

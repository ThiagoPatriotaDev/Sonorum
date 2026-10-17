import React, { useEffect, useRef, useState } from 'react';
import { toMusicXml } from '../utils/musicXml.js';

let scriptPromise;
function loadLibrary() {
  if (window.opensheetmusicdisplay?.OpenSheetMusicDisplay) return Promise.resolve(window.opensheetmusicdisplay);
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@2.1.2/build/opensheetmusicdisplay.min.js';
    script.async = true;
    script.onload = () => window.opensheetmusicdisplay ? resolve(window.opensheetmusicdisplay) : reject(new Error('OSMD não encontrada.'));
    script.onerror = () => reject(new Error('Não foi possível carregar a biblioteca de partituras.'));
    document.head.appendChild(script);
  }).catch((error) => { scriptPromise = null; throw error; });
  return scriptPromise;
}

export default function MusicXmlPreview({ score }) {
  const host = useRef(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let mounted = true;
    setState('loading');
    if (host.current) host.current.innerHTML = '';
    loadLibrary().then(async ({ OpenSheetMusicDisplay }) => {
      if (!mounted || !host.current) return;
      const renderer = new OpenSheetMusicDisplay(host.current, { autoResize: true, backend: 'svg', drawTitle: false });
      await renderer.load(toMusicXml(score));
      if (mounted) { renderer.render(); setState('ready'); }
    }).catch(() => { if (mounted) setState('failed'); });
    return () => { mounted = false; };
  }, [score.title, score.author, score.meter, score.tempo, score.notes]);
  return <div className="professional-preview"><div className="preview-label"><span>VISUALIZAÇÃO PROFISSIONAL</span><span>OPEN SHEET MUSIC DISPLAY / MUSICXML</span></div>{state === 'loading' && <p role="status">Preparando a partitura...</p>}{state === 'failed' && <p role="alert">Não foi possível carregar a visualização externa. Você ainda pode editar na pauta interativa e exportar o arquivo MusicXML.</p>}<div ref={host} className="osmd-host" /></div>;
}

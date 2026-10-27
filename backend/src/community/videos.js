import crypto from 'node:crypto';
import { communityStore } from './store.js';

export function getYouTubeId(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

export function listVideos(req, res) {
  const videos = communityStore.read().videos;
  const instrument = typeof req.query.instrument === 'string' ? req.query.instrument : '';
  res.json(instrument ? videos.filter((video) => video.instrumentId === instrument) : videos);
}

export function publishVideo(req, res) {
  if (req.user.role === 'pending') return res.status(403).json({error:'Seu perfil institucional aguarda aprovação.'});
  const { title, description, instrumentId, url } = req.body || {};
  const youtubeId = getYouTubeId(url);
  const name = typeof title === 'string' ? title.trim() : '';
  const caption = typeof description === 'string' ? description.trim() : '';
  if (name.length < 5 || name.length > 120 || caption.length > 500 || !['violao', 'violino', 'teclado', 'flauta', 'canto', 'baixo', 'saxofone', 'bateria'].includes(instrumentId) || !youtubeId) {
    return res.status(400).json({ error: 'Informe título (5 a 120 caracteres), instrumento e link válido do YouTube.' });
  }
  const video = { id: crypto.randomUUID(), title: name, description: caption, instrumentId, youtubeId, authorId: req.user.id, author: req.user.name, authorRole: req.user.role, createdAt: new Date().toISOString() };
  communityStore.write((state) => state.videos.unshift(video));
  res.status(201).json(video);
}

export function deleteVideo(req, res) {
  const video = communityStore.read().videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Videoaula não encontrada.' });
  if (video.authorId !== req.user.id && !['admin','coordinator'].includes(req.user.role)) return res.status(403).json({ error: 'Você só pode excluir suas publicações.' });
  communityStore.write((state) => { state.videos = state.videos.filter((v) => v.id !== video.id); });
  res.json({ deleted: true });
}

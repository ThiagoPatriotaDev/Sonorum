export function slugify(text) {
  return (text || 'partitura')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportScoreAsJSON(score) {
  const blob = new Blob([JSON.stringify(score, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  downloadBlob(blob, `${slugify(score.title)}.json`);
}

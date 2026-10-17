import app from './app.js';

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`[MelodiaLab API] Servidor Node.js rodando em http://localhost:${PORT}`);
});

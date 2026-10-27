import app from './app.js';
const PORT=Number(process.env.PORT||3333);
const HOST=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');
app.listen(PORT,HOST,()=>console.log(`[Sonorum API] Servidor rodando em http://${HOST}:${PORT}`));

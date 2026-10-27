import express from 'express';
import cors from 'cors';
import instrumentsRoutes from './routes/instruments.routes.js';
import scoresRoutes from './routes/scores.routes.js';
import communityRoutes from './community/routes.js';

const app = express();

const allowedOrigin = process.env.SONORUM_FRONTEND_ORIGIN;
if (process.env.NODE_ENV === 'production' && !allowedOrigin) throw Error('Configure SONORUM_FRONTEND_ORIGIN em produção.');
app.use(cors({origin: allowedOrigin ? allowedOrigin.split(',').map(s=>s.trim()) : ['http://localhost:5173','http://127.0.0.1:5173']}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Sonorum API', timestamp: new Date().toISOString() });
});

app.use('/api/instruments', instrumentsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api', communityRoutes);

export default app;

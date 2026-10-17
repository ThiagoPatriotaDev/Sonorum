import express from 'express';
import cors from 'cors';
import instrumentsRoutes from './routes/instruments.routes.js';
import scoresRoutes from './routes/scores.routes.js';
import communityRoutes from './community/routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Sonorum API', timestamp: new Date().toISOString() });
});

app.use('/api/instruments', instrumentsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api', communityRoutes);

export default app;

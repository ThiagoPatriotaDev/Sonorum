import express from 'express';
import cors from 'cors';
import instrumentsRoutes from './routes/instruments.routes.js';
import scoresRoutes from './routes/scores.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MelodiaLab API', timestamp: new Date().toISOString() });
});

app.use('/api/instruments', instrumentsRoutes);
app.use('/api/scores', scoresRoutes);

export default app;

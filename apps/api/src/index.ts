import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import exercisesRoutes from './routes/exercises';
import plansRoutes from './routes/plans';
import logsRoutes from './routes/logs';
import reportsRoutes from './routes/reports';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/exercises', exercisesRoutes);
app.use('/plans', plansRoutes);
app.use('/logs', logsRoutes);
app.use('/reports', reportsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

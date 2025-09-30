import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Existing summary route...

// --- CSV Export (with safe fallback) ---
router.get('/export/csv', async (req, res) => {
  const { userId } = req.query;
  const where = userId ? { userId: String(userId) } : {};
  const logs = await prisma.log.findMany({ where, include: { exercise: true } });

  try {
    // Dynamically import json2csv so app still runs if missing
    const { Parser } = await import('json2csv');

    const parser = new Parser({
      fields: ['date', 'exerciseName', 'setNumber', 'reps', 'weight', 'rpe', 'volume']
    });

    const csv = parser.parse(
      logs.map(l => ({
        date: l.date.toISOString().slice(0, 10),
        exerciseName: l.exercise?.name || l.exerciseName,
        setNumber: l.setNumber,
        reps: l.reps,
        weight: l.weight,
        rpe: l.rpe,
        volume: l.volume,
      }))
    );

    res.header('Content-Type', 'text/csv');
    res.attachment('logs.csv');
    return res.send(csv);

  } catch (err) {
    console.warn('⚠️ CSV export failed, falling back to JSON.', err);
    return res.json(logs);
  }
});

export default router;


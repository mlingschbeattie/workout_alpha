import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

async function fetchLogs(q: any) {
  const { userId, exerciseId, startDate, endDate } = q;
  return prisma.log.findMany({
    where: {
      AND: [
        userId ? { userId: String(userId) } : {},
        exerciseId ? { exerciseId: String(exerciseId) } : {},
        startDate ? { date: { gte: new Date(String(startDate)) } } : {},
        endDate ? { date: { lte: new Date(String(endDate)) } } : {},
      ],
    },
    include: { exercise: true, user: true },
    orderBy: { date: 'asc' },
  });
}

/** GET /reports/volume?groupBy=exercise|user */
router.get('/volume', async (req, res) => {
  const { groupBy } = req.query as any;
  const data = await fetchLogs(req.query);

  if (groupBy === 'exercise' || groupBy === 'user') {
    const acc: Record<string, Record<string, number>> = {};
    data.forEach(l => {
      const week = isoWeek(new Date(l.date));
      const key = groupBy === 'exercise'
        ? (l.exercise?.name || l.exerciseName || l.exerciseId || 'Unknown')
        : (l.user?.name || l.userId);
      const vol = Number.isFinite(l.volume) ? Number(l.volume) : Number(l.reps) * Number(l.weight);
      acc[week] = acc[week] || {};
      acc[week][key] = (acc[week][key] || 0) + vol;
    });
    const weeks = Object.keys(acc).sort();
    const seriesKeys = Array.from(new Set(weeks.flatMap(w => Object.keys(acc[w]))));
    const rows = weeks.map(week => {
      const row: any = { week };
      seriesKeys.forEach(k => row[k] = acc[week][k] || 0);
      return row;
    });
    return res.json({ seriesKeys, rows });
  }

  const weekly: Record<string, number> = {};
  data.forEach(l => {
    const week = isoWeek(new Date(l.date));
    const vol = Number.isFinite(l.volume) ? Number(l.volume) : Number(l.reps) * Number(l.weight);
    weekly[week] = (weekly[week] || 0) + vol;
  });
  const result = Object.entries(weekly).map(([week, volume]) => ({ week, volume }));
  res.json(result);
});

/** GET /reports/daily?ma=7 */
router.get('/daily', async (req, res) => {
  const { ma } = req.query as any;
  const window = Math.max(0, Number(ma) || 0);
  const data = await fetchLogs(req.query);

  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const byDay: Record<string, number> = {};
  data.forEach(l => {
    const k = ymd(new Date(l.date));
    const vol = Number.isFinite(l.volume) ? Number(l.volume) : Number(l.reps) * Number(l.weight);
    byDay[k] = (byDay[k] || 0) + vol;
  });
  const days = Object.keys(byDay).sort();
  const rows = days.map(d => ({ day: d, volume: byDay[d] }));

  if (window > 1) {
    const maRows = rows.map((r, i) => {
      let sum = 0, count = 0;
      for (let k = Math.max(0, i - window + 1); k <= i; k++) { sum += rows[k].volume; count++; }
      return { day: r.day, volume: r.volume, ma: Math.round((sum / count) * 100) / 100 };
    });
    return res.json(maRows);
  }

  res.json(rows);
});

/** GET /reports/prs — best set per exercise */
router.get('/prs', async (req, res) => {
  const data = await fetchLogs(req.query);
  const byEx: Record<string, typeof data> = {};
  data.forEach(l => {
    const key = l.exercise?.name || l.exerciseName || l.exerciseId || 'Unknown';
    (byEx[key] = byEx[key] || []).push(l);
  });
  const prs = Object.entries(byEx).map(([exercise, sets]) => {
    sets.sort((a, b) => (Number(b.weight) - Number(a.weight)) || (Number(b.reps) - Number(a.reps)));
    const top = sets[0];
    return { exercise, date: top.date, reps: top.reps, weight: top.weight, volume: top.volume };
  });
  res.json(prs);
});

/** GET /reports/compliance — % days logged per week */
router.get('/compliance', async (req, res) => {
  const data = await fetchLogs(req.query);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const weekDays: Record<string, Set<string>> = {};
  data.forEach(l => {
    const d = new Date(l.date);
    const week = isoWeek(d);
    (weekDays[week] = weekDays[week] || new Set()).add(ymd(d));
  });
  const result = Object.entries(weekDays)
    .map(([week, days]) => ({ week, daysLogged: days.size, compliancePct: Math.round((days.size / 7) * 100) }))
    .sort((a, b) => a.week.localeCompare(b.week));
  res.json(result);
});

router.get('/summary', async (req, res) => {
  const { userId, planId } = req.query;
  const where: any = {};

  if (userId) where.userId = String(userId);
  if (planId) where.user = { planId: String(planId) };

  const logs = await prisma.log.findMany({ where });

  const totalVolume = logs.reduce((a, b) => a + (b.volume || 0), 0);
  const totalReps = logs.reduce((a, b) => a + (b.reps || 0), 0);

  res.json({ count: logs.length, totalVolume, totalReps });
});

import { Parser } from 'json2csv';

router.get('/export/csv', async (req, res) => {
  const { userId } = req.query;
  const where = userId ? { userId: String(userId) } : {};
  const logs = await prisma.log.findMany({ where, include: { exercise: true } });

  const parser = new Parser({
    fields: ['date', 'exerciseName', 'setNumber', 'reps', 'weight', 'rpe', 'volume']
  });
  const csv = parser.parse(logs.map(l => ({
    date: l.date.toISOString().slice(0,10),
    exerciseName: l.exercise?.name || l.exerciseName,
    setNumber: l.setNumber,
    reps: l.reps,
    weight: l.weight,
    rpe: l.rpe,
    volume: l.volume
  })));

  res.header('Content-Type', 'text/csv');
  res.attachment('logs.csv');
  res.send(csv);
});


export default router;


import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

/** GET /plans */
router.get('/', async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(plans);
});

/** GET /plans/:id */
router.get('/:id', async (req, res) => {
  const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
  if (!plan) return res.status(404).json({ error: 'not found' });
  res.json(plan);
});

/** POST /plans */
router.post('/', async (req, res) => {
  const { name, weeks = 4, days = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const plan = await prisma.plan.create({ data: { name, weeks: Number(weeks), days } });
  res.status(201).json(plan);
});

/** PATCH /plans/:id */
router.patch('/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
    res.json(plan);
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

/** DELETE /plans/:id */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

// Utility: compute "which plan day" applies on a specific date
function computePlanDayIndex(opts: {
  startDate: Date;
  onDate: Date;
  totalDays: number;
}) {
  const { startDate, onDate, totalDays } = opts;
  if (!totalDays || totalDays <= 0) return 0;
  // zero-based days since start
  const ms = 24 * 60 * 60 * 1000;
  const start = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
  const on = new Date(Date.UTC(onDate.getFullYear(), onDate.getMonth(), onDate.getDate()));
  const elapsed = Math.floor((on.getTime() - start.getTime()) / ms);
  const idx = ((elapsed % totalDays) + totalDays) % totalDays; // wrap safely
  return idx;
}

/**
 * GET /plans/for-user/:userId?date=YYYY-MM-DD
 * Returns { user, plan, dayIndex, day, message }
 */
router.get('/for-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const rawDate = String(req.query.date || '').trim();
  const onDate = rawDate ? new Date(rawDate) : new Date();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (!user.planId) return res.status(200).json({ user, plan: null, message: 'No plan assigned.' });
  if (!user.planStartDate) return res.status(200).json({ user, plan: null, message: 'Plan start date not set.' });

  const plan = await prisma.plan.findUnique({ where: { id: user.planId } });
  if (!plan) return res.status(404).json({ error: 'plan missing for user' });

  const days = Array.isArray((plan as any).days) ? (plan as any).days : [];
  if (!days.length) return res.status(200).json({ user, plan, dayIndex: null, day: null, message: 'Plan has no days.' });

  const dayIndex = computePlanDayIndex({
    startDate: new Date(user.planStartDate),
    onDate,
    totalDays: days.length,
  });

  const day = days[dayIndex] ?? null;

  return res.json({
    user,
    plan: { id: plan.id, name: plan.name, weeks: plan.weeks },
    dayIndex,
    day,
    message: day ? undefined : 'No day found for this date.',
  });
});

  // Mark a day complete
router.post('/for-user/:userId/complete', async (req, res) => {
  const userId = req.params.userId;
  const date = String(req.body.date || new Date().toISOString().slice(0,10));

  const user = await prisma.user.update({
    where: { id: userId },
    data: { completedDates: { push: date } }
  });

  res.json(user);
});

// Mark a day complete
router.post('/for-user/:userId/complete', async (req, res) => {
  const userId = req.params.userId;
  const date = String(req.body.date || new Date().toISOString().slice(0,10));

  const user = await prisma.user.update({
    where: { id: userId },
    data: { completedDates: { push: date } }
  });

  res.json(user);
});


export default router;


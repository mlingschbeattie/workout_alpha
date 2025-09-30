import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

/** GET /logs?userId=&exerciseId=&from=YYYY-MM-DD&to=YYYY-MM-DD */
router.get('/', async (req, res) => {
  const { userId, exerciseId, from, to } = req.query;
  const list = await prisma.log.findMany({
    where: {
      AND: [
        userId ? { userId: String(userId) } : {},
        exerciseId ? { exerciseId: String(exerciseId) } : {},
        from ? { date: { gte: new Date(String(from)) } } : {},
        to ? { date: { lte: new Date(String(to)) } } : {},
      ],
    },
    orderBy: { date: 'asc' },
  });
  res.json(list);
});

/** GET /logs/:id */
router.get('/:id', async (req, res) => {
  const log = await prisma.log.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ error: 'not found' });
  res.json(log);
});

/** POST /logs */
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(400).json({ error: `userId not found: ${userId}` });

    // Normalize optional exerciseId and validate if present
    let exerciseId: string | null = null;
    if (b.exerciseId !== undefined && b.exerciseId !== null) {
      const raw = String(b.exerciseId).trim();
      if (raw && raw.toLowerCase() !== 'null') exerciseId = raw;
    }
    if (exerciseId) {
      const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
      if (!ex) return res.status(400).json({ error: `exerciseId not found: ${exerciseId}` });
    }

    const reps = Number(b.reps || 0);
    const weight = Math.max(0, Number(b.weight || 0));
    const volume = ('volume' in b && b.volume != null) ? Number(b.volume) : reps * weight;

    const log = await prisma.log.create({
      data: {
        userId,
        exerciseId,
        exerciseName: b.exerciseName || null,
        date: b.date ? new Date(b.date) : new Date(),
        week: b.week ?? null,
        dayId: b.dayId || null,
        dayTitle: b.dayTitle || null,
        setNumber: Number(b.setNumber || 1),
        reps,
        weight,
        rpe: b.rpe !== undefined ? Number(b.rpe) : null,
        volume,
      },
    });

    res.status(201).json(log);
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: 'invalid payload or FK constraint', detail: String((e as Error).message || e) });
  }
});

/** PATCH /logs/:id */
router.patch('/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if ((body.reps != null || body.weight != null) && body.volume == null) {
      const current = await prisma.log.findUnique({ where: { id: req.params.id } });
      if (!current) return res.status(404).json({ error: 'not found' });
      const reps = body.reps != null ? Number(body.reps) : current.reps;
      const weight = body.weight != null ? Number(body.weight) : current.weight;
      body.volume = reps * Math.max(0, weight);
    }
    const updated = await prisma.log.update({ where: { id: req.params.id }, data: body });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

/** DELETE /logs/:id */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.log.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

export default router;


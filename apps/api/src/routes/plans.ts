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

export default router;


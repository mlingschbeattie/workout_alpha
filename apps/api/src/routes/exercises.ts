import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

/**
 * GET /exercises
 * Optional query: ?q=bench&category=strength
 */
router.get('/', async (req, res) => {
  const { q, category } = req.query;
  const list = await prisma.exercise.findMany({
    where: {
      AND: [
        category ? { category: String(category) } : {},
        q ? { name: { contains: String(q) } } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
});

/**
 * POST /exercises
 * Body: { name: string, category: string, type?: string, target?: string }
 */
router.post('/', async (req, res) => {
  const { name, category, type, target } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category required' });
  }
  const e = await prisma.exercise.create({ data: { name, category, type, target } });
  res.status(201).json(e);
});

/**
 * PATCH /exercises/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const e = await prisma.exercise.update({ where: { id: req.params.id }, data: req.body });
    res.json(e);
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

/**
 * DELETE /exercises/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

export default router;


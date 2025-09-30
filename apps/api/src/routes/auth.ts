import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

/** GET /auth/users — list users */
router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

/** GET /auth/users/:id — get one */
router.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

/** GET /auth/me — simple “me” (first user) demo */
router.get('/me', async (_req, res) => {
  const me = await prisma.user.findFirst();
  res.json(me ?? { error: 'no users yet' });
});

/** POST /auth/login — login by name (create if missing, role=ATHLETE) */
router.post('/login', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  let user = await prisma.user.findFirst({ where: { name } });
  if (!user) user = await prisma.user.create({ data: { name, role: 'ATHLETE' } });
  res.json({ user });
});

/** POST /auth/users — create user */
router.post('/users', async (req, res) => {
  const { name, role = 'ATHLETE' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const user = await prisma.user.create({ data: { name, role } });
  res.status(201).json(user);
});

/** PATCH /auth/users/:id — update user fields (e.g., name, role) */
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

/** POST /auth/toggle-role — flip between ATHLETE/COACH */
router.post('/toggle-role', async (req, res) => {
  const id = String(req.body?.id || '');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'user not found' });
  const next = user.role === 'COACH' ? 'ATHLETE' : 'COACH';
  const updated = await prisma.user.update({ where: { id }, data: { role: next } });
  res.json(updated);
});

/** DELETE /auth/users/:id — delete user */
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

// Assign a plan to a user
router.post('/users/:id/assign-plan', async (req, res) => {
  const userId = req.params.id;
  const planId = String(req.body?.planId || '').trim();
  if (!planId) return res.status(400).json({ error: 'planId required' });

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ]);
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (!plan) return res.status(404).json({ error: 'plan not found' });

  const updated = await prisma.user.update({ where: { id: userId }, data: { planId } });
  res.json(updated);
});

// Unassign plan (set null)
router.post('/users/:id/unassign-plan', async (req, res) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const updated = await prisma.user.update({ where: { id: userId }, data: { planId: null } });
  res.json(updated);
});


export default router;


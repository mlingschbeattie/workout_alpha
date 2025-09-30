// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getOrCreateUser(name: string, role: 'COACH'|'ATHLETE'|'ADMIN') {
  const existing = await prisma.user.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.user.create({ data: { name, role } });
}

async function getOrCreateExercise(name: string, category: string, type?: string, target?: string) {
  const existing = await prisma.exercise.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.exercise.create({ data: { name, category, type, target } });
}

async function main() {
  // Users
  const coach = await getOrCreateUser('Coach Carter', 'COACH');
  const athlete = await getOrCreateUser('Athlete Adams', 'ATHLETE');

  // Exercises
  const bench = await getOrCreateExercise('Bench Press', 'strength', 'strength', '4x6');
  const plyo  = await getOrCreateExercise('Explosive Push-Ups', 'power', 'power', '3x5');

  // Plan (days stored as JSON) - use deterministic id so re-running won’t duplicate
  const planId = 'default-plan';
  const existingPlan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!existingPlan) {
    await prisma.plan.create({
      data: {
        id: planId,
        name: 'Default Plan',
        weeks: 4,
        days: [
          { id: 'day1', title: 'Day 1 — Strength', exercises: [{ exerciseId: bench.id, name: 'Bench Press', target: '4x6' }] },
          { id: 'day2', title: 'Day 2 — Power', exercises: [{ exerciseId: plyo.id,  name: 'Explosive Push-Ups', target: '3x5' }] },
        ] as any,
      },
    });
  }

  // Logs – only insert if none exist yet
  const logCount = await prisma.log.count();
  if (logCount === 0) {
    await prisma.log.createMany({
      data: [
        {
          userId: athlete.id, exerciseId: bench.id, exerciseName: 'Bench Press',
          date: new Date(), week: 1, setNumber: 1, reps: 6, weight: 185, rpe: 7.5, volume: 6 * 185
        },
        {
          userId: athlete.id, exerciseId: plyo.id, exerciseName: 'Explosive Push-Ups',
          date: new Date(), week: 1, setNumber: 1, reps: 5, weight: 0, volume: 0
        }
      ]
    });
  }

  console.log('Seeded successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


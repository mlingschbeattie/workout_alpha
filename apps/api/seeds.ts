import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function ensure<T>(fn: () => Promise<T>) { try { return await fn(); } catch { return undefined as any; } }

async function main() {
  // Exercises (createMany ignores duplicates by id if you run twice and catch)
  await ensure(() => prisma.exercise.createMany({
    data: [
      { id:'ex:medball-chest-pass', name:'Med Ball Chest Pass', category:'power', type:'power', target:'3x5' },
      { id:'ex:explosive-pushup', name:'Explosive Push-Ups', category:'power', type:'power', target:'5x3' },
      { id:'ex:banded-punchout', name:'Banded Punch-Outs', category:'power', type:'power', target:'3x6/side' },
      { id:'ex:landmine-push-press', name:'Landmine Push Press', category:'power', type:'power', target:'4x4' },
      { id:'ex:plyo-medball-chest-toss', name:'Plyo Med Ball Chest Toss (against wall)', category:'power', type:'power', target:'4x5' },
      { id:'ex:bench-press', name:'Bench Press', category:'strength', type:'strength', target:'4x6' },
      { id:'ex:closegrip-bench', name:'Close-Grip Bench', category:'strength', type:'strength', target:'3x5' },
      { id:'ex:incline-db-bench', name:'Incline DB Bench', category:'strength', type:'strength', target:'3x8' },
      { id:'ex:pushpress', name:'Push Press', category:'strength', type:'strength', target:'5x3' },
      { id:'ex:floor-press', name:'Floor Press', category:'strength', type:'strength', target:'4x5' },
      { id:'ex:dips-weighted', name:'Dips (Weighted if able)', category:'strength', type:'strength', target:'3x6-10' },
      { id:'ex:chest-supported-row', name:'Chest-Supported Row', category:'strength', type:'strength', target:'4x8' },
      { id:'ex:onearm-row', name:'One-Arm DB Row', category:'strength', type:'strength', target:'3x8/side' },
      { id:'ex:facepulls', name:'Face Pulls', category:'accessory', type:'accessory', target:'3x12-15' },
      { id:'ex:band-pullapart', name:'Band Pull-Aparts', category:'accessory', type:'accessory', target:'3x20' },
      { id:'ex:rear-delt-fly', name:'Rear Delt Fly (Cable/DB)', category:'accessory', type:'accessory', target:'3x12' },
      { id:'ex:paloff-press', name:'Pallof Press', category:'core', type:'core', target:'3x10/side' },
      { id:'ex:cable-chop', name:'Cable Chop (High-to-Low)', category:'core', type:'core', target:'3x8/side' },
      { id:'ex:deadbug', name:'Dead Bug (banded)', category:'core', type:'core', target:'3x6/side' },
      { id:'ex:front-plank-reach', name:'Front Plank + Reach', category:'core', type:'core', target:'3x20s' },
      { id:'ex:suitcase-hold', name:'Suitcase Hold (heavy)', category:'core', type:'core', target:'3x20-30s/side' },
      { id:'ex:tricep-pushdown', name:'Tricep Pushdown', category:'accessory', type:'accessory', target:'3x12' },
      { id:'ex:overhead-tricep-ext', name:'Overhead Tricep Extension (Cable/DB)', category:'accessory', type:'accessory', target:'3x10' },
    ],
    skipDuplicates: true,
  }));

  // Plans
  await ensure(() => prisma.plan.create({
    data: {
      id: 'plan:dt-separation-4w-template',
      name: 'DT Separation — 4 Weeks (Same Routine)',
      weeks: 4,
      days: [
        { id:'day1', title:'Day 1 — Power Press', exercises:[
          { exerciseId:'ex:landmine-push-press', target:'4x4' },
          { exerciseId:'ex:explosive-pushup', target:'5x3' },
          { exerciseId:'ex:bench-press', target:'4x6' },
          { exerciseId:'ex:facepulls', target:'3x15' },
          { exerciseId:'ex:paloff-press', target:'3x10/side' },
        ]},
        { id:'day2', title:'Day 2 — Row + Lockout', exercises:[
          { exerciseId:'ex:chest-supported-row', target:'4x8' },
          { exerciseId:'ex:closegrip-bench', target:'3x5' },
          { exerciseId:'ex:tricep-pushdown', target:'3x12' },
          { exerciseId:'ex:deadbug', target:'3x6/side' },
        ]},
        { id:'day3', title:'Day 3 — Med Ball Pistons', exercises:[
          { exerciseId:'ex:medball-chest-pass', target:'3x5' },
          { exerciseId:'ex:plyo-medball-chest-toss', target:'4x5' },
          { exerciseId:'ex:floor-press', target:'4x5' },
          { exerciseId:'ex:suitcase-hold', target:'3x20-30s/side' },
        ]},
      ] as any,
    }
  }));

  await ensure(() => prisma.plan.create({
    data: {
      id: 'plan:dt-separation-4w-progress',
      name: 'DT Separation — 4 Weeks (Progression)',
      weeks: 4,
      days: [
        { id:'w1d1', title:'Week 1 — Day 1', exercises:[
          { exerciseId:'ex:landmine-push-press', target:'4x3' },
          { exerciseId:'ex:explosive-pushup', target:'5x3' },
          { exerciseId:'ex:bench-press', target:'4x6' },
          { exerciseId:'ex:paloff-press', target:'3x10/side' },
        ]},
        { id:'w1d2', title:'Week 1 — Day 2', exercises:[
          { exerciseId:'ex:chest-supported-row', target:'4x8' },
          { exerciseId:'ex:closegrip-bench', target:'3x5' },
          { exerciseId:'ex:facepulls', target:'3x15' },
          { exerciseId:'ex:deadbug', target:'3x6/side' },
        ]},
        { id:'w1d3', title:'Week 1 — Day 3', exercises:[
          { exerciseId:'ex:medball-chest-pass', target:'3x5' },
          { exerciseId:'ex:floor-press', target:'4x5' },
          { exerciseId:'ex:suitcase-hold', target:'3x20-30s/side' },
        ]},
        { id:'w2d1', title:'Week 2 — Day 1', exercises:[
          { exerciseId:'ex:landmine-push-press', target:'5x3' },
          { exerciseId:'ex:explosive-pushup', target:'6x3' },
          { exerciseId:'ex:bench-press', target:'4x5' },
          { exerciseId:'ex:paloff-press', target:'3x12/side' },
        ]},
        { id:'w2d2', title:'Week 2 — Day 2', exercises:[
          { exerciseId:'ex:onearm-row', target:'4x8/side' },
          { exerciseId:'ex:closegrip-bench', target:'4x4' },
          { exerciseId:'ex:rear-delt-fly', target:'3x12' },
          { exerciseId:'ex:deadbug', target:'3x8/side' },
        ]},
        { id:'w2d3', title:'Week 2 — Day 3', exercises:[
          { exerciseId:'ex:medball-chest-pass', target:'4x4' },
          { exerciseId:'ex:floor-press', target:'5x4' },
          { exerciseId:'ex:suitcase-hold', target:'3x30s/side' },
        ]},
        { id:'w3d1', title:'Week 3 — Day 1', exercises:[
          { exerciseId:'ex:pushpress', target:'5x3' },
          { exerciseId:'ex:explosive-pushup', target:'6x3 (elevated if needed)' },
          { exerciseId:'ex:bench-press', target:'5x4' },
          { exerciseId:'ex:paloff-press', target:'3x12/side' },
        ]},
        { id:'w3d2', title:'Week 3 — Day 2', exercises:[
          { exerciseId:'ex:chest-supported-row', target:'5x6' },
          { exerciseId:'ex:incline-db-bench', target:'4x8' },
          { exerciseId:'ex:facepulls', target:'3x15' },
          { exerciseId:'ex:cable-chop', target:'3x8/side' },
        ]},
        { id:'w3d3', title:'Week 3 — Day 3', exercises:[
          { exerciseId:'ex:plyo-medball-chest-toss', target:'4x5' },
          { exerciseId:'ex:floor-press', target:'5x4' },
          { exerciseId:'ex:suitcase-hold', target:'3x35s/side' },
        ]},
        { id:'w4d1', title:'Week 4 — Day 1 (Deload Power)', exercises:[
          { exerciseId:'ex:landmine-push-press', target:'3x3 (light/fast)' },
          { exerciseId:'ex:explosive-pushup', target:'4x3' },
          { exerciseId:'ex:bench-press', target:'3x4 (submax)' },
          { exerciseId:'ex:paloff-press', target:'2x10/side' },
        ]},
        { id:'w4d2', title:'Week 4 — Day 2 (Deload Strength)', exercises:[
          { exerciseId:'ex:onearm-row', target:'3x8/side (submax)' },
          { exerciseId:'ex:closegrip-bench', target:'3x3 (submax)' },
          { exerciseId:'ex:rear-delt-fly', target:'2x12' },
          { exerciseId:'ex:deadbug', target:'2x6/side' },
        ]},
        { id:'w4d3', title:'Week 4 — Day 3 (Priming)', exercises:[
          { exerciseId:'ex:medball-chest-pass', target:'3x3' },
          { exerciseId:'ex:plyo-medball-chest-toss', target:'3x3' },
          { exerciseId:'ex:suitcase-hold', target:'2x20s/side' },
        ]},
      ] as any,
    }
  }));

  console.log('Seeded exercises and plans.');
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());


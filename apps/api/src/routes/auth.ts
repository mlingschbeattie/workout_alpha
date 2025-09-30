import { Router } from 'express';
const router = Router();
router.get('/', (_,res)=>res.json({msg:'auth ok'}));
export default router;

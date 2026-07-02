import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    console.error('[ActivityLogs] List error:', err);
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await prisma.activityLog.create({
      data: { ...req.body, userId: req.user?.userId },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error('[ActivityLogs] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar log' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const profiles = await prisma.profile.findMany();
    res.json(profiles);
  } catch (err) {
    console.error('[Profiles] List error:', err);
    res.status(500).json({ error: 'Erro ao listar perfis' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const profile = await prisma.profile.findFirst({ where: { userId: req.params.userId } });
    if (!profile) { res.status(404).json({ error: 'Perfil não encontrado' }); return; }
    res.json(profile);
  } catch (err) {
    console.error('[Profiles] Get error:', err);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const existing = await prisma.profile.findFirst({ where: { userId: req.params.userId } });
    if (existing) {
      const profile = await prisma.profile.update({ where: { id: existing.id }, data: req.body });
      res.json(profile);
    } else {
      const profile = await prisma.profile.create({
        data: { ...req.body, userId: req.params.userId },
      });
      res.status(201).json(profile);
    }
  } catch (err) {
    console.error('[Profiles] Upsert error:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const integrations = await prisma.integration.findMany();
    res.json(integrations);
  } catch (err) {
    console.error('[Integrations] List error:', err);
    res.status(500).json({ error: 'Erro ao listar integrações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const integration = await prisma.integration.create({ data: { ...req.body, userId: req.user?.userId } });
    res.status(201).json(integration);
  } catch (err) {
    console.error('[Integrations] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar integração' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const integration = await prisma.integration.update({ where: { id: req.params.id }, data: req.body });
    res.json(integration);
  } catch (err) {
    console.error('[Integrations] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar integração' });
  }
});

export default router;

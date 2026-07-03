import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(templates);
  } catch (err) {
    console.error('[WhatsAppTemplates] List error:', err);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const template = await prisma.whatsAppTemplate.create({ data: req.body });
    res.status(201).json(template);
  } catch (err) {
    console.error('[WhatsAppTemplates] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const template = await prisma.whatsAppTemplate.update({ where: { id: req.params.id }, data: req.body });
    res.json(template);
  } catch (err) {
    console.error('[WhatsAppTemplates] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.whatsAppTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[WhatsAppTemplates] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir template' });
  }
});

export default router;

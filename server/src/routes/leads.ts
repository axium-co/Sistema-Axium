import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    console.error('[Leads] List error:', err);
    res.status(500).json({ error: 'Erro ao listar leads' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) { res.status(404).json({ error: 'Lead não encontrado' }); return; }
    res.json(lead);
  } catch (err) {
    console.error('[Leads] Get error:', err);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, createdById: req.user?.userId, modifiedById: req.user?.userId };
    const lead = await prisma.lead.create({ data });
    res.status(201).json(lead);
  } catch (err) {
    console.error('[Leads] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Lead não encontrado' }); return; }
    const data = { ...req.body, modifiedById: req.user?.userId };
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data });
    res.json(lead);
  } catch (err) {
    console.error('[Leads] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Leads] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir lead' });
  }
});

export default router;

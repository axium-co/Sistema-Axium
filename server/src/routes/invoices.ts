import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(invoices);
  } catch (err) {
    console.error('[Invoices] List error:', err);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user?.userId };
    const invoice = await prisma.invoice.create({ data });
    res.status(201).json(invoice);
  } catch (err) {
    console.error('[Invoices] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar fatura' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    res.json(invoice);
  } catch (err) {
    console.error('[Invoices] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar fatura' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Invoices] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir fatura' });
  }
});

export default router;

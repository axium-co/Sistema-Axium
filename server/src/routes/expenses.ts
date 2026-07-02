import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(expenses);
  } catch (err) {
    console.error('[Expenses] List error:', err);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user?.userId };
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (err) {
    console.error('[Expenses] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: req.body });
    res.json(expense);
  } catch (err) {
    console.error('[Expenses] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Expenses] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
});

export default router;

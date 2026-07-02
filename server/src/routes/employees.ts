import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (err) {
    console.error('[Employees] List error:', err);
    res.status(500).json({ error: 'Erro ao listar funcionários' });
  }
});

router.post('/', async (req, res) => {
  try {
    const employee = await prisma.employee.create({ data: { ...req.body, userId: req.user?.userId } });
    res.status(201).json(employee);
  } catch (err) {
    console.error('[Employees] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Employees] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  }
});

export default router;

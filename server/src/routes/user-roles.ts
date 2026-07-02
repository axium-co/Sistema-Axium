import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const roles = await prisma.userRoleAssignment.findMany();
    res.json(roles);
  } catch (err) {
    console.error('[UserRoles] List error:', err);
    res.status(500).json({ error: 'Erro ao listar funções' });
  }
});

router.post('/', async (req, res) => {
  try {
    const role = await prisma.userRoleAssignment.create({ data: req.body });
    res.status(201).json(role);
  } catch (err) {
    console.error('[UserRoles] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar função' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const role = await prisma.userRoleAssignment.update({ where: { id: req.params.id }, data: req.body });
    res.json(role);
  } catch (err) {
    console.error('[UserRoles] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar função' });
  }
});

export default router;

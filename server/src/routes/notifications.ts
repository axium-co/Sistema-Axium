import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: req.user?.userId }, { userId: null }] },
      orderBy: { time: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error('[Notifications] List error:', err);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { is_read, ...rest } = req.body;
    const notification = await prisma.notification.create({
      data: {
        ...rest,
        isRead: is_read,
        userId: req.user?.userId,
      },
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error('[Notifications] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar notificação' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (err) {
    console.error('[Notifications] Mark read error:', err);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { OR: [{ userId: req.user?.userId }, { userId: null }] },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Mark all read error:', err);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir notificação' });
  }
});

export default router;

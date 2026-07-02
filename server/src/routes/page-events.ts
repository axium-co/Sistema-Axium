import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { event_type, label, metadata } = req.body;
    const event = await prisma.pageEvent.create({
      data: {
        eventType: event_type || 'page_view',
        page: label || null,
        metadata: metadata || undefined,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('[PageEvents] Create error:', err);
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 60;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const events = await prisma.pageEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(events.map(e => ({
      id: e.id,
      event_type: e.eventType,
      label: e.page,
      metadata: e.metadata,
      created_at: e.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error('[PageEvents] List error:', err);
    res.status(500).json({ error: 'Erro ao listar eventos' });
  }
});

export default router;

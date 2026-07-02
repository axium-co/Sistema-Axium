import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const events = await prisma.event.findMany({ orderBy: { dateTime: 'asc' } });
    res.json(events);
  } catch (err) {
    console.error('[Events] List error:', err);
    res.status(500).json({ error: 'Erro ao listar eventos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      activity_type, date_time, meeting_link, created_by,
      activityType, dateTime, meetingLink, createdBy,
      ...rest
    } = req.body;
    const data = {
      ...rest,
      activityType: activityType || activity_type,
      dateTime: new Date(dateTime || date_time),
      meetingLink: meetingLink || meeting_link,
      createdBy: createdBy || created_by,
      userId: req.user?.userId,
    };
    const event = await prisma.event.create({ data });
    res.status(201).json(event);
  } catch (err) {
    console.error('[Events] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      activity_type, date_time, meeting_link, created_by,
      activityType, dateTime, meetingLink, createdBy,
      ...rest
    } = req.body;
    const data = {
      ...rest,
      activityType: activityType || activity_type,
      dateTime: dateTime || date_time ? new Date(dateTime || date_time) : undefined,
      meetingLink: meetingLink || meeting_link,
      createdBy: createdBy || created_by,
    };
    const event = await prisma.event.update({ where: { id: req.params.id }, data });
    res.json(event);
  } catch (err) {
    console.error('[Events] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Events] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir evento' });
  }
});

export default router;

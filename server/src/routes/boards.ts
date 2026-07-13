import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const boards = await prisma.board.findMany({
      include: { columns: { orderBy: { sortOrder: 'asc' } }, rows: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(boards);
  } catch (err) {
    console.error('[Boards] List error:', err);
    res.status(500).json({ error: 'Erro ao listar quadros' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { columns, ...boardData } = req.body;
    const board = await prisma.board.create({
      data: {
        ...boardData,
        userId: req.user?.userId,
        columns: columns ? {
          create: columns.map((col: any, idx: number) => ({
            id: col.id,
            title: col.title,
            type: col.type,
            width: col.width,
            options: col.options,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: { columns: true },
    });
    res.status(201).json(board);
  } catch (err) {
    console.error('[Boards] Create error:', err);
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { columns, rows, ...boardData } = req.body;

    const board = await prisma.$transaction(async (tx) => {
      if (columns) {
        await tx.boardColumn.deleteMany({ where: { boardId: req.params.id } });
      }

      return tx.board.update({
        where: { id: req.params.id },
        data: {
          ...boardData,
          columns: columns ? {
            create: columns.map((col: any, idx: number) => ({
              id: col.id,
              title: col.title,
              type: col.type,
              width: col.width,
              options: col.options,
              sortOrder: idx,
            })),
          } : undefined,
          rows: rows ? {
            deleteMany: {},
            create: rows.map((row: any) => ({
              id: row.id,
              values: row.values || {},
              lastModifiedBy: row.lastModifiedBy,
            })),
          } : undefined,
        },
        include: { columns: { orderBy: { sortOrder: 'asc' } }, rows: true },
      });
    });

    res.json(board);
  } catch (err) {
    console.error('[Boards] Update error:', err);
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.board.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Boards] Delete error:', err);
    res.status(500).json({ error: 'Erro ao excluir quadro' });
  }
});

export default router;

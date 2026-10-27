import { Router } from 'express';
import { ScoresController } from '../controllers/scores.controller.js';
import { requireUser, requireRoles } from '../community/auth.js';

const router = Router();

router.get('/', ScoresController.getAll);
router.get('/:id', ScoresController.getById);
router.post('/', requireUser, requireRoles('admin','coordinator'), ScoresController.create);
router.put('/:id', requireUser, requireRoles('admin','coordinator'), ScoresController.update);
router.delete('/:id', requireUser, requireRoles('admin','coordinator'), ScoresController.remove);

export default router;

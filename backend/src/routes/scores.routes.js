import { Router } from 'express';
import { ScoresController } from '../controllers/scores.controller.js';

const router = Router();

router.get('/', ScoresController.getAll);
router.get('/:id', ScoresController.getById);
router.post('/', ScoresController.create);
router.put('/:id', ScoresController.update);
router.delete('/:id', ScoresController.remove);

export default router;

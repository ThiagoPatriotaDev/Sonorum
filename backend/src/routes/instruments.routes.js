import { Router } from 'express';
import { InstrumentsController } from '../controllers/instruments.controller.js';

const router = Router();

router.get('/', InstrumentsController.getAll);
router.get('/:id', InstrumentsController.getById);

export default router;

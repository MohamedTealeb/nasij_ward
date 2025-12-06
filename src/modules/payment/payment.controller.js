import express from 'express';
import * as paymentService from './payment.service.js';
import { authMiddleware } from '../../middleware/authentication.middleware.js';

const router = express.Router();

router.all('/webhook/moyasar', paymentService.handleMoyasarWebhook);
router.all('/callback/moyasar', paymentService.handleMoyasarWebhook);
router.post('/create',authMiddleware, paymentService.createPayment);
router.post('/:id/refund', authMiddleware, paymentService.refundPayment);
router.patch('/:id/cancel', authMiddleware , paymentService.cancelPayment);

export default router;
import express from 'express';
import { createTestPayment, getPaymentDetails, verifyPayment } from './payment.service.js';

const router = express.Router();

router.post('/test', createTestPayment);
router.get('/:paymentId', getPaymentDetails);
router.get('/verify/:paymentId', verifyPayment);

export default router;
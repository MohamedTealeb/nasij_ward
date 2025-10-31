import express from 'express';
import * as paymentService from './payment.service.js';

const router = express.Router();

router.post('/create', paymentService.createPayment);

export default router;
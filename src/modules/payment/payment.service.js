import axios from 'axios';
import Moyasar from 'moyasar';
import { nanoid } from 'nanoid';

// Function to save payment in backend
const savePaymentOnBackend = async (payment) => {
    try {
        console.log('Payment completed:', payment);
        // Here you can save payment to database
        // Example: await PaymentModel.create(payment);
        return payment;
    } catch (error) {
        console.error('Error saving payment:', error);
        throw error;
    }
};

export const createTestPayment = async (req, res) => {
    try {
        const { amount, description } = req.body;
        
        if (!amount || !description) {
            return res.status(400).json({ 
                error: 'Amount and description are required' 
            });
        }

        const paymentId = nanoid();
        
        const paymentData = {
            id: paymentId,
            amount: amount * 100,
            currency: 'SAR',
            description: description,
            publishable_api_key: process.env.MOYASAR_PUBLISHABLE_KEY || 'pk_test_AQpxBV31a29qhkhUYFYUFjhwllaDVrxSq5ydVNui',
            callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?payment_id=${paymentId}`,
            supported_networks: ['visa', 'mastercard', 'mada'],
            methods: ['creditcard'],
            on_completed: async function (payment) {
                await savePaymentOnBackend(payment);
            },
        };

     
        res.json({
            success: true,
            message: 'Payment initialized successfully',
            paymentId: paymentId,
            paymentData: {
                id: paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                description: paymentData.description,
                publishable_api_key: paymentData.publishable_api_key,
                callback_url: paymentData.callback_url,
                supported_networks: paymentData.supported_networks,
                methods: paymentData.methods
            }
        });
        
    } catch (err) {
        console.error('Payment error:', err.response?.data || err.message);
        res.status(500).json({ 
            error: err.response?.data || 'Payment failed',
            message: 'Failed to initialize payment'
        });
    }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!paymentId) {
            return res.status(400).json({ 
                error: 'Payment ID is required' 
            });
        }

        // Here you would typically get payment from database
        // For now, we'll return a mock response
        res.json({
            success: true,
            payment: {
                id: paymentId,
                status: 'pending',
                amount: 10000,
                currency: 'SAR',
                description: 'Test payment',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });
        
    } catch (err) {
        console.error('Payment details error:', err.response?.data || err.message);
        res.status(500).json({ 
            error: err.response?.data || 'Failed to get payment details',
            message: 'Failed to retrieve payment information'
        });
    }
};

// Verify payment status
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!paymentId) {
            return res.status(400).json({ 
                error: 'Payment ID is required' 
            });
        }

        // Here you would typically verify with Moyasar API
        // For now, we'll return a mock response
        res.json({
            success: true,
            paymentId: paymentId,
            status: 'completed',
            message: 'Payment verified successfully'
        });
        
    } catch (err) {
        console.error('Payment verification error:', err.response?.data || err.message);
        res.status(500).json({ 
            error: err.response?.data || 'Payment verification failed',
            message: 'Failed to verify payment'
        });
    }
};


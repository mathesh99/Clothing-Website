import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../config/database';
import { config } from '../config';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export const paymentService = {
  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.paymentStatus === 'PAID') throw new BadRequestError('Order is already paid');

    // Idempotency — return existing if already created
    const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
    if (existingPayment && existingPayment.status === 'PENDING') {
      return {
        razorpayOrderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: config.razorpay.keyId,
      };
    }

    const amountInPaise = Math.round(Number(order.total) * 100);
    const idempotencyKey = uuid();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
    });

    await prisma.payment.create({
      data: {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: 'INR',
        status: 'PENDING',
        idempotencyKey,
      },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: order.total,
      currency: 'INR',
      keyId: config.razorpay.keyId,
    };
  },

  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestError('Payment verification failed — invalid signature');
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundError('Payment record not found');
    if (payment.status === 'PAID') {
      return { orderId: payment.orderId, alreadyVerified: true };
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      }),
    ]);

    return { orderId: payment.orderId, alreadyVerified: false };
  },

  async handleWebhook(body: string, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Invalid Razorpay webhook signature');
      return;
    }

    const event = JSON.parse(body);
    logger.info('Razorpay webhook:', event.event);

    if (event.event === 'payment.captured') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const razorpayPaymentId = event.payload.payment.entity.id;

      const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
      if (payment && payment.status !== 'PAID') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { razorpayPaymentId, status: 'PAID' },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
          }),
        ]);
      }
    }

    if (event.event === 'payment.failed') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      }
    }
  },
};

import express from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import PDFDocument from 'pdfkit'; // Import PDFDocument
import { authenticate, createAuditLog } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Payment } from '../models/Payment.js';
import { Enrollment } from '../models/Enrollment.js';

const router = express.Router();
// Initialize Stripe using the environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper function to get the payment record and course details
async function getPaymentDetails(sessionId, userId) {
  const paymentRecord = await Payment.findBySessionId(sessionId);

  if (!paymentRecord || paymentRecord.user_id !== userId || paymentRecord.status !== 'succeeded') {
    throw new Error('Access denied or payment not successful');
  }

  const course = await Course.findById(paymentRecord.course_id);
  if (!course) {
    throw new Error('Course not found');
  }

  return { paymentRecord, course };
}

// NEW: Function to generate a custom PDF receipt
async function generateReceiptPdf(payment, course, user) {
  // Dynamically import 'stream' for ESM compatibility
  const { PassThrough } = (await import('stream')).default;
  
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = doc.pipe(new PassThrough());

  // Header
  doc
    .fontSize(25)
    .text('Vortex LMS Payment Receipt', { align: 'center' })
    .moveDown();

  // Separator
  doc.lineWidth(1).strokeColor('#000000').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

  // Transaction Details
  doc
    .fontSize(12)
    .fillColor('#333333')
    .text(`Receipt ID: ${payment.id}`, { continued: true })
    .text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, { align: 'right' })
    .moveDown(0.5);

 

  // Customer Details
  doc
    .fontSize(16)
    .fillColor('#000000')
    .text('Customer Details', { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor('#333333')
    .text(`Name: ${user.name}`)
    .text(`Email: ${user.email}`)
    .moveDown(1);

  // Course Details
  doc
    .fontSize(16)
    .fillColor('#000000')
    .text('Course Purchased', { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor('#333333')
    .text(`Course Title: ${course.title}`)
    .text(`Category: ${course.category}`)
    .text(`Instructor: ${course.instructor.name}`)
    .moveDown(1);

  // Payment Summary Table (Simplified)
  const tableTop = doc.y;
  const itemX = 50;
  const priceX = 450;

  doc.fontSize(14).fillColor('#000000').text('Item', itemX).text('Amount', priceX, tableTop, { align: 'right' });
  doc.moveDown(0.2);
  doc.lineWidth(1).strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

  // Item Row
  doc.fontSize(12).fillColor('#333333').text(course.title, itemX).text(`$${payment.amount.toFixed(2)}`, priceX, doc.y, { align: 'right' });
  doc.moveDown(0.5);

  // Total
  doc.lineWidth(1).strokeColor('#000000').moveTo(400, doc.y).lineTo(550, doc.y).stroke().moveDown(0.2);
  doc.fontSize(16).fillColor('#000000').text('Total Paid:', itemX).text(`$${payment.amount.toFixed(2)} USD`, priceX, doc.y, { align: 'right' });
  doc.moveDown(1); // Reduced moveDown to 1

  // Footer - Draw relative to current position (doc.y)
  doc
    .fontSize(10)
    .fillColor('#666666')
    .text('Thank you for choosing Vortex LMS!', { align: 'center' });
  doc.moveDown(1); // Add final space before end

  doc.end();
  return stream;
}

// Helper function to get the receipt URL from Stripe (kept for compatibility)
async function getStripeReceiptUrl(sessionId, userId) {
  const paymentRecord = await Payment.findBySessionId(sessionId);

  if (!paymentRecord || paymentRecord.user_id !== userId || paymentRecord.status !== 'succeeded') {
    throw new Error('Access denied or payment not successful');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session || session.payment_status !== 'paid' || !session.payment_intent) {
    throw new Error('Stripe session not found or payment not completed');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
  const chargeId = paymentIntent.latest_charge;

  if (!chargeId) {
    throw new Error('Charge ID not found for this payment');
  }

  const charge = await stripe.charges.retrieve(chargeId);

  if (!charge.receipt_url) {
    throw new Error('Receipt URL not available');
  }
  
  return { receiptUrl: charge.receipt_url, courseId: paymentRecord.course_id };
}

// 1. Create Stripe Checkout Session
// Apply express.json() middleware specifically to this route
router.post('/create-checkout-session', express.json(), authenticate, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.is_published) {
      return res.status(404).json({ error: 'Course not found or not published' });
    }

    if (course.price <= 0) {
      return res.status(400).json({ error: 'Course is free, no payment required' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findByStudentAndCourse(userId, courseId);
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const priceInCents = Math.round(course.price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description.substring(0, 100) + '...',
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/student/courses/${course.slug || course.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/student/courses/${course.slug || course.id}?payment=cancelled`,
      metadata: {
        userId: userId,
        courseId: courseId,
      },
    });

    // Create a pending payment record
    await Payment.create({
      userId: userId,
      courseId: courseId,
      amount: course.price,
      stripeSessionId: session.id,
      status: 'pending'
    });

    await createAuditLog(req, 'INITIATE_PAYMENT', 'PAYMENT', { courseId, sessionId: session.id });

    res.json({ success: true, url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Route to fetch receipt URL (kept for compatibility, but download route is preferred)
router.get('/receipt/:sessionId', authenticate, async (req, res) => {
  try {
    const { receiptUrl } = await getStripeReceiptUrl(req.params.sessionId, req.user.id);
    res.json({ success: true, receiptUrl });
  } catch (error) {
    console.error('Fetch receipt error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch receipt URL' });
  }
});

// UPDATED: Route to download custom generated receipt
router.get('/download-receipt/:sessionId', authenticate, async (req, res) => {
  try {
    const { paymentRecord, course } = await getPaymentDetails(req.params.sessionId, req.user.id);
    
    // Use the authenticated user object for customer details
    const user = req.user;

    // Sanitize filename
    const sanitizedTitle = course.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${sanitizedTitle}_Receipt_${req.params.sessionId}.pdf`;

    // 1. Set headers for PDF download
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 2. Generate and pipe the PDF content
    const pdfStream = await generateReceiptPdf(paymentRecord, course, user);
    pdfStream.pipe(res);

    await createAuditLog(req, 'DOWNLOAD_RECEIPT', 'PAYMENT', { courseId: course.id, sessionId: req.params.sessionId });

  } catch (error) {
    console.error('Download receipt error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate receipt' });
    }
  }
});

// 2. Stripe Webhook Handler
// NOTE: This route MUST use express.raw() and be mounted BEFORE express.json() in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body is now the raw buffer/string needed for verification
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const { userId, courseId } = session.metadata;
    const sessionId = session.id;

    try {
      const paymentRecord = await Payment.findBySessionId(sessionId);

      if (!paymentRecord) {
        console.error('Payment record not found for session:', sessionId);
        return res.status(404).json({ received: true, message: 'Payment record not found' });
      }

      if (paymentRecord.status === 'succeeded') {
        console.log('Payment already processed:', sessionId);
        return res.json({ received: true });
      }

      // 1. Create Enrollment
      const enrollment = await Enrollment.create({
        studentId: userId,
        courseId: courseId
      });

      // 2. Update Payment Status
      await Payment.updateStatus(sessionId, 'succeeded', enrollment.id);

      // 3. Update Course Enrollment Count
      const course = await Course.findById(courseId);
      if (course) {
        await Course.update(courseId, { enrollmentCount: course.enrollment_count + 1 });
      }

      console.log(`Payment succeeded and enrollment created for user ${userId} in course ${courseId}`);

    } catch (error) {
      console.error('Error processing checkout.session.completed:', error);
      // In a real app, you might want to retry or alert an an admin here
      return res.status(500).json({ received: true, message: 'Failed to process enrollment' });
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    const sessionId = session.id;
    await Payment.updateStatus(sessionId, 'failed');
    console.log(`Payment failed for session: ${sessionId}`);
  }

  res.json({ received: true });
});

export default router;
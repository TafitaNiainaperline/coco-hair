const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const AraryPay = require('@ariary/pay');
const AraryNotification = require('@ariary/notification');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

// Initialize Ariary
AraryPay.config({
  secret: process.env.ARIARY_SECRET_KEY,
});

AraryNotification.config({
  secret: process.env.ARIARY_SECRET_KEY,
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Order routes
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customer, total } = req.body;

    const order = {
      items,
      customer,
      total,
      status: 'en attente',
      createdAt: new Date(),
    };

    const docRef = await db.collection('orders').add(order);
    res.json({ id: docRef.id, ...order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const doc = await db.collection('orders').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.collection('orders').doc(req.params.id).update({ status });
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMS route (Ariary Notification)
app.post('/api/sms', async (req, res) => {
  try {
    const { phone, message } = req.body;
    await AraryNotification.send({
      phone,
      message,
    });
    res.json({ success: true, message: 'SMS sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment route (Ariary Pay)
app.post('/api/payment', async (req, res) => {
  try {
    const { amount, orderId, phone } = req.body;
    const payment = await AraryPay.initiate({
      amount,
      orderId,
      phone,
      metadata: { orderId }
    });
    res.json({ success: true, paymentId: payment.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

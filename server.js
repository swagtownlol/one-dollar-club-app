import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUCCESS_URL = process.env.NODE_ENV === 'production' 
  ? 'https://onedollarclub.org?success=true'
  : 'http://localhost:3000?success=true';
const CANCEL_URL = process.env.NODE_ENV === 'production'
  ? 'https://onedollarclub.org?canceled=true'
  : 'http://localhost:3000?canceled=true';

const app = express();
const PORT = process.env.PORT || 5001; // Updated port to 5001

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    console.log('Creating checkout session for amount:', amount);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `$${amount} Club Membership`,
              description: 'One-time payment to join the club'
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    console.log('Checkout session created:', session.id);
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// In-memory storage for payment count
let paymentCount = 0;

// Route to handle payment count
app.post('/api/payment', (req, res) => {
  paymentCount += 1;
  res.json({ count: paymentCount });
});

// Route to simulate email sending
app.post('/send-email', (req, res) => {
  const { email } = req.body;
  console.log(`Email sent to: ${email}`);
  res.json({ message: 'Email sent successfully!' });
});

// Endpoint to create a Stripe Checkout session
app.get('/payment-count', (req, res) => {
  res.json({ count: paymentCount });
});

app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: amount === 1 ? '$1 Club Membership' : `$${amount} Club Tier`,
              description: amount === 1 ? 'Join the $1 Club and see how many others have joined!' : 'Higher tier membership'
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating checkout session');
  }
});

// Endpoint to get payment count
app.get('/payment-count', (req, res) => {
  res.json({ count: paymentCount });
});

// Simulate email sending and increment payment count
app.post('/payment-success', (req, res) => {
  const { email } = req.body;

  // Increment payment count
  paymentCount++;

  // Simulate email sending (replace with actual email service later)
  console.log(`Email sent to ${email}: "Congrats, you're in the $1 club now!"`);

  res.send('Payment success and email sent');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
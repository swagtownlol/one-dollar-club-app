const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// In-memory storage for payment count (replace with a database in production)
let paymentCount = 0;

// Route to handle payment count
app.get('/api/payment-count', (req, res) => {
  res.json({ count: paymentCount });
});

// Route to simulate email sending
app.post('/api/send-email', (req, res) => {
  const { email } = req.body;
  // In production, integrate with a real email service like SendGrid
  console.log(`Email sent to: ${email}`);
  res.json({ message: 'Welcome to the $1 Club! Check your email for confirmation.' });
});

// Endpoint to create a Stripe Checkout session
app.post('/api/create-checkout-session', async (req, res) => {
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
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?canceled=true`,
    });

    // Increment payment count when checkout session is created
    if (amount === 1) {
      paymentCount += 1;
    }

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
app.post('/api/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Handle successful payment
      console.log('Payment successful:', session);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

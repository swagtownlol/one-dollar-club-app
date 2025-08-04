const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')('your-secret-key-here');
const SUCCESS_URL = process.env.NODE_ENV === 'production' 
  ? 'https://onedollarclub.org?success=true'
  : 'http://localhost:3000?success=true';
const CANCEL_URL = process.env.NODE_ENV === 'production'
  ? 'https://onedollarclub.org?canceled=true'
  : 'http://localhost:3000?canceled=true';
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001; // Updated port to 5001

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler to serve the React app for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// In-memory storage for payment count
let paymentCount = 0;

// Route to handle payment count
app.post('/payment', (req, res) => {
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
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5001/success',
      cancel_url: 'http://localhost:5001/cancel',
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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory counter (Note: This will reset on each deployment)
let paymentCount = 0;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'http://localhost:3000'}?success=true`,
      cancel_url: `${process.env.URL || 'http://localhost:3000'}?canceled=true`,
    });

    if (amount === 1) {
      paymentCount += 1;
    }

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

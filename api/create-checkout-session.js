const stripe = require(\"stripe\")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== \"POST\") {
    return res.status(405).json({ error: \"Method not allowed\" });
  }

  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: \"Amount is required\" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [\"card\"],
      line_items: [
        {
          price_data: {
            currency: \"usd\",
            product_data: {
              name: `\$${amount} Club Membership`,
              description: \"One-time payment to join the club\"
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: \"payment\",
      success_url: process.env.NODE_ENV === \"production\"
        ? \"https://onedollarclub.org?success=true\"
        : \"http://localhost:3000?success=true\",
      cancel_url: process.env.NODE_ENV === \"production\"
        ? \"https://onedollarclub.org?canceled=true\"
        : \"http://localhost:3000?canceled=true\"
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error(\"Error creating checkout session:\", error);
    return res.status(500).json({ error: error.message });
  }
};

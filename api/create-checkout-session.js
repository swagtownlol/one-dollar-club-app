import Stripe from \"stripe\";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DOMAIN = process.env.NODE_ENV === \"production\" 
  ? \"https://onedollarclub.org\" 
  : \"http://localhost:3000\";

export default async function handler(req, res) {
  if (req.method !== \"POST\") {
    return res.status(405).json({ error: \"Method not allowed\" });
  }

  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: \"Amount is required\" });
    }

    console.log(\"Creating checkout session for amount:\", amount);
    
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
      success_url: `${DOMAIN}?success=true`,
      cancel_url: `${DOMAIN}?canceled=true`
    });

    console.log(\"Checkout session created:\", session.id);
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error(\"Error creating checkout session:\", error);
    res.status(500).json({ error: error.message });
  }
}

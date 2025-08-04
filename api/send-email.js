module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  // In production, integrate with a real email service
  console.log(`Email sent to: ${email}`);
  res.json({ message: 'Welcome to the $1 Club! Check your email for confirmation.' });
}

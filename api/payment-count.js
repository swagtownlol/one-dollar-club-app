// In-memory counter (Note: This will reset on each deployment)
let paymentCount = 0;

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({ count: paymentCount });
}

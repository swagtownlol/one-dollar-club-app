import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = import.meta.env.VITE_API_URL;

const PAYMENT_TIERS = [
  { amount: 1, label: '$1' },
  { amount: 4.2, label: '$4.20' },
  { amount: 10, label: '$10' },
  { amount: 100, label: '$100' },
  { amount: 420.69, label: '$420.69' },
  { amount: 1000, label: '$1,000' },
  { amount: 10000, label: '$10,000' }
];

function HomePage() {
  const navigate = useNavigate();
  const [paymentCount, setPaymentCount] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check for payment success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      fetchPaymentCount();
      setShowEmailForm(true);
    }
  }, []);

  const handlePayment = async (amount = 1) => {
    try {
      console.log('Starting payment process for amount:', amount);
      const stripe = await stripePromise;
      if (!stripe) {
        console.error('Stripe failed to load');
        return;
      }

      console.log('Creating checkout session...');
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        return;
      }

      const session = await response.json();
      console.log('Checkout session created:', session);

      if (!session.id) {
        console.error('No session ID received from server');
        return;
      }

      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe checkout...');
      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        console.error('Stripe redirect error:', result.error.message);
      }
    } catch (error) {
      console.error('Payment process error:', error);
    }
  };

  const fetchPaymentCount = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-count`);
    const data = await response.json();
    setPaymentCount(data.count);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
      setShowEmailForm(false);
    } catch (error) {
      setMessage('Error sending email. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '30px' }}>Welcome to the $1 Club</h1>
      
      {!showEmailForm && (
        <>
          <button 
            onClick={() => handlePayment(1)}
            style={{
              fontSize: '1.2em',
              padding: '15px 30px',
              margin: '20px 0',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Pay $1 to find out how many people paid $1
          </button>

          {paymentCount !== null && (
            <p style={{ fontSize: '1.5em', margin: '20px 0' }}>
              Total people who paid $1: {paymentCount}
            </p>
          )}
        </>
      )}

      {showEmailForm && (
        <div style={{ margin: '20px 0' }}>
          <h2>You're almost in the club!</h2>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                padding: '10px',
                fontSize: '1em',
                marginRight: '10px',
                width: '250px'
              }}
            />
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                fontSize: '1em',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Join the Club
            </button>
          </form>
        </div>
      )}

      {message && <p style={{ margin: '20px 0', color: '#4CAF50' }}>{message}</p>}

      <div style={{ marginTop: '40px' }}>
        <h3>Other Payment Tiers</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          {PAYMENT_TIERS.slice(1).map(({ amount, label }) => (
            <button
              key={amount}
              onClick={() => navigate(`/tier/${amount}`)}
              style={{
                padding: '10px 20px',
                margin: '5px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'transform 0.1s ease-in-out'
              }}
              onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.target.style.transform = 'scale(1)'}
            >
              {label} Club
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
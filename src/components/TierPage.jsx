import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = import.meta.env.VITE_API_URL;

const tierInfo = {
  '4.20': {
    title: 'The Cool Tier',
    description: 'Join the elite group of people who know what is cool!'
  },
  '10': {
    title: 'The Double Digits Club',
    description: 'Step into the double-digit league.'
  },
  '100': {
    title: 'The Benjamin Club',
    description: 'For those who think bigger.'
  },
  '420.69': {
    title: 'The Legendary Tier',
    description: 'You know exactly why you are here.'
  },
  '1000': {
    title: 'The Four Digit Club',
    description: 'Welcome to the four-digit society.'
  },
  '10000': {
    title: 'The Whale Club',
    description: 'For the true believers.'
  }
};

function TierPage() {
  const { amount } = useParams();
  const navigate = useNavigate();
  const info = tierInfo[amount] || {
    title: `$${amount} Club`,
    description: 'Join this exclusive tier!'
  };

  const handlePayment = async () => {
    const stripe = await stripePromise;

    try {
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const session = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <button 
        onClick={() => navigate('/')} 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          backgroundColor: '#666',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>{info.title}</h1>
      <p style={{ fontSize: '1.5em', marginBottom: '40px', color: '#666' }}>
        {info.description}
      </p>

      <button
        onClick={handlePayment}
        style={{
          fontSize: '2em',
          padding: '20px 40px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out'
        }}
        onMouseOver={e => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.2)';
        }}
        onMouseOut={e => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        }}
      >
        Pay ${amount}
      </button>
    </div>
  );
}

export default TierPage;

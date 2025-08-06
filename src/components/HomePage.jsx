import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API_BASE_URL = '/api';  // Vercel serverless functions are always at /api

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
  const [tierCounts, setTierCounts] = useState({});
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tier counts on component mount
    fetchTierCounts();
    
    // Check for payment success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowEmailForm(true);
      // Refresh counts after successful payment
      fetchTierCounts();
    }
  }, []);

  const fetchTierCounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/payment-counts`);
      const counts = await response.json();
      setTierCounts(counts);
    } catch (error) {
      console.error('Error fetching tier counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h3>Join the Club - Choose Your Tier</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          {PAYMENT_TIERS.map(({ amount, label }) => (
            <div 
              key={amount}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                width: '200px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h4 style={{ marginTop: 0, color: '#333' }}>{label} Tier</h4>
              <p style={{ color: '#666', minHeight: '40px' }}>
                {isLoading ? 'Loading...' : `${tierCounts[amount] || 0} members`}
              </p>
              <button
                onClick={() => handlePayment(amount)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                Join with {label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div 
          style={{ 
            margin: '20px 0',
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '4px'
          }}
        >
          {message}
        </div>
      )}
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
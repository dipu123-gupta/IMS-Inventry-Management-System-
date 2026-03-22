import React, { useState } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayButton = ({ amount, orderId, label, onSuccess, organization, user }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Load Razorpay script dynamically
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Check your connection.');
        setLoading(false);
        return;
      }

      // 2. Create Razorpay Order on server
      const { data: orderData } = await API.post(`/razorpay/create-order/${orderId}`);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: organization?.name || 'IMS Portal',
        description: `Payment for Order #${orderId}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const { data: verifyData } = await API.post('/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
            });

            if (verifyData.success) {
              toast.success('Payment Successful!');
              if (onSuccess) onSuccess();
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment Failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error) {
      toast.error('Could not initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      className={`btn btn-primary btn-sm rounded-md shadow-sm font-bold ${loading ? 'loading' : ''}`}
      disabled={loading}
    >
      {label || 'Pay Now'}
    </button>
  );
};

export default RazorpayButton;

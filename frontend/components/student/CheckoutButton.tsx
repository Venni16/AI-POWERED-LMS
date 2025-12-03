'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { paymentAPI } from '../../lib/api';
import { Loader2, Lock } from 'lucide-react';
import { useToast } from '../../lib/useToast';

// Make sure to call loadStripe outside of a component’s render to avoid recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutButtonProps {
  courseId: string;
  price: number;
  isEnrolled: boolean;
}

export default function CheckoutButton({ courseId, price, isEnrolled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const handleCheckout = async () => {
    if (isEnrolled) return;

    setLoading(true);
    try {
      // 1. Create Checkout Session on the backend
      const response = await paymentAPI.createCheckoutSession(courseId);
      const { url } = response.data;

      if (url) {
        // 2. Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        showError('Failed to get payment URL.');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      showError(error.response?.data?.error || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <button
        disabled
        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center justify-center space-x-2 bg-gray-300 text-gray-600 cursor-not-allowed"
      >
        Enrolled
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center justify-center space-x-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting...</span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" />
          <span>Pay ${price.toFixed(2)}</span>
        </>
      )}
    </button>
  );
}
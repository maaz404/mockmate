import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setStatus('error');
        setMessage('No session ID found. Please contact support if you were charged.');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/payments/verify-session?session_id=${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          setStatus('success');
          setMessage('Your payment was successful!');
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify payment');
      }
    };

    verifySession();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold">
                Welcome to MockMate Premium! 🎉
              </p>
              <p className="text-green-700 text-sm mt-1">
                You now have unlimited access to all premium features.
              </p>
            </div>
            <p className="text-gray-500 text-sm">
              Redirecting to your dashboard in 3 seconds...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                If you were charged but see this error, please contact support with your session ID: <code className="font-mono text-xs">{sessionId}</code>
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Pricing
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

'use client';

import { useState, useEffect } from 'react';
import { studentAPI, paymentAPI } from '../../lib/api';
import { DollarSign, Calendar, BookOpen, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../lib/useToast';

interface PaymentRecord {
  id: string;
  courseId: string;
  amount: number;
  currency: string;
  status: string;
  stripeSessionId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string;
    price: number;
  };
}

export default function PurchasedCourses() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingSession, setDownloadingSession] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await studentAPI.getPaymentHistory();
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      showError('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownloadReceipt = async (sessionId: string) => {
    setDownloadingSession(sessionId);
    try {
      // 1. Call the new backend route to fetch the receipt content as a blob
      const response = await paymentAPI.downloadReceipt(sessionId);
      
      // 2. Extract filename from headers (if available) or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'receipt.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // 3. Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Receipt download started!');
      
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      
      let errorMessage = error.response?.data?.error || 'Failed to download receipt. Please contact support.';

      if (errorMessage.includes('corrupted or not available as a PDF')) {
        errorMessage = "Receipt download failed. Please check your email for the official Stripe receipt, or contact support.";
      }
      
      showError(errorMessage);
    } finally {
      setDownloadingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <span className="text-gray-600 ml-3">Loading purchased courses...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-5 sm:p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">My Purchased Courses</h3>

        {payments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-xl font-medium">No paid courses found.</p>
            <p className="text-sm mt-2">
              All your successful course purchases will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors flex flex-col md:flex-row items-start md:items-center justify-between"
              >
                <div className="flex items-start space-x-4 flex-1 min-w-0 mb-4 md:mb-0">
                  <div className="flex-shrink-0 w-16 h-16">
                    {payment.course.thumbnailUrl ? (
                      <img
                        src={payment.course.thumbnailUrl}
                        alt={payment.course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">{payment.course.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Paid: <span className="font-bold text-black ml-1">${payment.amount.toFixed(2)}</span>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Date: {formatDate(payment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleDownloadReceipt(payment.stripeSessionId)}
                    disabled={downloadingSession === payment.stripeSessionId}
                    className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingSession === payment.stripeSessionId ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingSession === payment.stripeSessionId ? 'Loading...' : 'Receipt'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
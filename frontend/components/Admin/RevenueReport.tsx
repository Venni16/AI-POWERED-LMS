'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { DollarSign, BookOpen, Users, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useToast } from '../../lib/useToast';

interface CourseReport {
  title: string;
  purchases: number;
  revenue: number;
}

interface RevenueData {
  totalRevenue: number;
  courseReports: CourseReport[];
}

export default function RevenueReport() {
  const [reportData, setReportData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchRevenueReport();
  }, []);

  const fetchRevenueReport = async () => {
    try {
      const response = await adminAPI.getRevenueReport();
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleDownloadPDF = async () => {
    if (!reportData || reportData.courseReports.length === 0) {
      showError('No data available to download.');
      return;
    }

    setDownloading(true);

    try {
      // 1. Call the new backend route to fetch the PDF content as a blob
      const response = await adminAPI.downloadRevenueReportPdf();
      
      // 2. Extract filename from headers (if available) or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Vortex_Revenue_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // 3. Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Revenue report PDF download started!');
      
    } catch (error: any) {
      console.error('PDF download error:', error);
      showError(error.response?.data?.error || 'Failed to generate or download PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="bg-white shadow rounded-xl p-6 text-center text-gray-500">
        Failed to load revenue data.
      </div>
    );
  }

  const chartData = reportData.courseReports.map(report => ({
    name: report.title,
    Revenue: report.revenue,
    Purchases: report.purchases
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-200 rounded-xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-black" />
            Overall Revenue Summary
          </h3>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || reportData.courseReports.length === 0}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF Report
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">
              {formatCurrency(reportData.totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600">Total Paid Courses</p>
            <p className="text-3xl font-extrabold text-black mt-1">
              {reportData.courseReports.length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <p className="text-3xl font-extrabold text-black mt-1">
              {reportData.courseReports.reduce((sum, r) => sum + r.purchases, 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Chart (Line Graph) */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Course</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              style={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#374151"
                angle={-30}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: 12, fill: '#4b5563' }}
                tickFormatter={(str) =>
                  str.length > 15 ? `${str.substring(0, 14)}...` : str
                }
              />
              <YAxis
                stroke="#374151"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: '#4b5563' }}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                }}
                cursor={{ stroke: '#10B981', strokeWidth: 2 }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}
              />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5, stroke: '#10B981', strokeWidth: 1, fill: 'white' }}
                activeDot={{ r: 7 }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Course Report Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="px-6 py-5 sm:p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Course Revenue</h3>
          
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.courseReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.purchases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(report.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.courseReports.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-lg font-medium">No successful payments recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { AuditLog } from '../../types';
import { Filter, Clock, Loader2 } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAuditLogs(filters);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionDisplayName = (action: string) => {
    const displayNames: { [key: string]: string } = {
      LOGIN: 'Login',
      REGISTER: 'Register',
      GOOGLE_LOGIN: 'Google Login',
      ACCOUNT_LOCKED: 'Account Locked',
      CREATE_INSTRUCTOR: 'Create Instructor',
      UPDATE_USER_STATUS: 'Update User Status',
      CHANGE_INSTRUCTOR_PASSWORD: 'Change Password',
      CREATE_COURSE: 'Create Course',
      UPDATE_COURSE: 'Update Course',
      DELETE_COURSE: 'Delete Course',
      UPLOAD_VIDEO: 'Upload Video',
      UPLOAD_MATERIAL: 'Upload Material',
      DELETE_VIDEO: 'Delete Video',
      UPDATE_SUMMARY: 'Update Summary',
      DELETE_MATERIAL: 'Delete Material',
      ENROLL_COURSE: 'Enroll Course',
      SUBMIT_MCQ: 'Submit Quiz'
    };
    return displayNames[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      ACCOUNT_LOCKED: 'bg-red-100 text-red-800',
      DELETE_COURSE: 'bg-red-100 text-red-800',
      DELETE_VIDEO: 'bg-red-100 text-red-800',
      DELETE_MATERIAL: 'bg-red-100 text-red-800',
      LOGIN: 'bg-green-100 text-green-800',
      REGISTER: 'bg-blue-100 text-blue-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-900">System Audit Logs</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="pl-9 pr-4 block w-full border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="REGISTER">Register</option>
                <option value="CREATE_INSTRUCTOR">Create Instructor</option>
                <option value="UPDATE_USER_STATUS">Update User Status</option>
                <option value="CREATE_COURSE">Create Course</option>
                <option value="DELETE_COURSE">Delete Course</option>
                <option value="UPLOAD_VIDEO">Upload Video</option>
                <option value="ENROLL_COURSE">Enroll Course</option>
                <option value="SUBMIT_MCQ">Submit Quiz</option>
              </select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select
                value={filters.resource}
                onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
                className="pl-9 pr-4 block w-full border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
              >
                <option value="">All Resources</option>
                <option value="USER">User</option>
                <option value="COURSE">Course</option>
                <option value="VIDEO">Video</option>
                <option value="MATERIAL">Material</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto"></div>
            <p className="text-gray-600 mt-3">Loading audit logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={log.id || log._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{log.user?.name || 'System'}</div>
                          <div className="text-xs text-gray-500 capitalize">{log.user?.role || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionDisplayName(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🗃️</div>
            <p className="text-lg font-medium">No audit logs found matching filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
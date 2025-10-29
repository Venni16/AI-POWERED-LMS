'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { AuditLog } from '../../types';

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
      ENROLL_COURSE: 'Enroll Course'
    };
    return displayNames[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      LOGIN: 'bg-green-100 text-green-800',
      REGISTER: 'bg-blue-100 text-blue-800',
      GOOGLE_LOGIN: 'bg-blue-100 text-blue-800',
      ACCOUNT_LOCKED: 'bg-red-100 text-red-800',
      CREATE_INSTRUCTOR: 'bg-purple-100 text-purple-800',
      UPDATE_USER_STATUS: 'bg-yellow-100 text-yellow-800',
      CHANGE_INSTRUCTOR_PASSWORD: 'bg-orange-100 text-orange-800',
      CREATE_COURSE: 'bg-purple-100 text-purple-800',
      UPDATE_COURSE: 'bg-yellow-100 text-yellow-800',
      DELETE_COURSE: 'bg-red-100 text-red-800',
      UPLOAD_VIDEO: 'bg-indigo-100 text-indigo-800',
      UPLOAD_MATERIAL: 'bg-indigo-100 text-indigo-800',
      DELETE_VIDEO: 'bg-red-100 text-red-800',
      UPDATE_SUMMARY: 'bg-yellow-100 text-yellow-800',
      DELETE_MATERIAL: 'bg-red-100 text-red-800',
      ENROLL_COURSE: 'bg-green-100 text-green-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="REGISTER">Register</option>
              <option value="GOOGLE_LOGIN">Google Login</option>
              <option value="ACCOUNT_LOCKED">Account Locked</option>
              <option value="CREATE_INSTRUCTOR">Create Instructor</option>
              <option value="UPDATE_USER_STATUS">Update User Status</option>
              <option value="CHANGE_INSTRUCTOR_PASSWORD">Change Password</option>
              <option value="CREATE_COURSE">Create Course</option>
              <option value="UPDATE_COURSE">Update Course</option>
              <option value="DELETE_COURSE">Delete Course</option>
              <option value="UPLOAD_VIDEO">Upload Video</option>
              <option value="UPLOAD_MATERIAL">Upload Material</option>
              <option value="DELETE_VIDEO">Delete Video</option>
              <option value="UPDATE_SUMMARY">Update Summary</option>
              <option value="DELETE_MATERIAL">Delete Material</option>
              <option value="ENROLL_COURSE">Enroll Course</option>
            </select>
            <select
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Resources</option>
              <option value="USER">User</option>
              <option value="COURSE">Course</option>
              <option value="VIDEO">Video</option>
              <option value="MATERIAL">Material</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
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
                <tr key={log.id || log._id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{log.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 capitalize">{log.user?.role || 'unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionDisplayName(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        )}
      </div>
    </div>
  );
}

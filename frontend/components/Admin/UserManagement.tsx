'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { Plus, User, Check, X, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/useToast';

// Define User interface locally to avoid import issues
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  profile?: {
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
  isActive?: boolean;
  createdAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminAPI.createInstructor(formData);
      setShowCreateForm(false);
      setFormData({ name: '', email: '', password: '', specialization: '' });
      fetchUsers();
      showSuccess('Instructor account created successfully!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to create instructor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminAPI.updateUserStatus(userId, !isActive);
      fetchUsers();
      showSuccess(`User status updated successfully! User is now ${!isActive ? 'Active' : 'Inactive'}.`);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const deleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminAPI.deleteUser(userToDelete.id);
      fetchUsers();
      showSuccess(`User "${userToDelete.name}" deleted successfully!`);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelDeleteUser}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete user <strong>"{userToDelete.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDeleteUser}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Instructor Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
          >
            <h4 className="text-xl font-semibold text-gray-900 mb-6">Create Instructor Account</h4>
            <form onSubmit={handleCreateInstructor} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                    placeholder="Instructor Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                    placeholder="instructor@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (Optional)</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                    placeholder="e.g., Web Development"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-6 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">All Users</h3>
            <button
              onClick={() => setShowCreateForm(prev => !prev)}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              {showCreateForm ? 'Hide Form' : 'Create Instructor'}
            </button>
          </div>

          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profile?.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profile.avatar}
                              alt={`${user.name} avatar`}
                              onError={(e) => {
                                // Fallback to initial if image fails to load
                                const img = e.currentTarget;
                                const fallback = img.nextElementSibling as HTMLElement;
                                if (img && fallback) {
                                  img.style.display = 'none';
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 ${
                              user.profile?.avatar ? 'hidden' : ''
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive!)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center ${
                                user.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {user.isActive ? <X className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.name)}
                              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
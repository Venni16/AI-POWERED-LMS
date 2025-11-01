'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { Key, Loader2 } from 'lucide-react';
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

export default function PasswordChanger() {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await adminAPI.getUsers();
      const instructorUsers = response.data.users.filter((user: User) => user.role === 'instructor');
      setInstructors(instructorUsers);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      showError('Failed to load instructor list.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (instructorId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(instructorId);
      await adminAPI.changeInstructorPassword(instructorId, formData.password);
      showSuccess('Password updated successfully!');
      setFormData({ password: '', confirmPassword: '' });
      setShowForm(null);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setChangingPassword(null);
    }
  };

  const startPasswordChange = (instructorId: string) => {
    setShowForm(instructorId);
    setFormData({ password: '', confirmPassword: '' });
  };

  const cancelPasswordChange = () => {
    setShowForm(null);
    setFormData({ password: '', confirmPassword: '' });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Instructor Password Management</h3>
          <p className="text-sm text-gray-600 hidden sm:block">Change passwords for instructor accounts</p>
        </div>

        {instructors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔑</div>
            <p className="text-lg font-medium">No instructor accounts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((instructor) => (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      {instructor.profile?.avatar ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={instructor.profile.avatar}
                          alt={`${instructor.name} avatar`}
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
                        className={`h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-800 ${
                          instructor.profile?.avatar ? 'hidden' : ''
                        }`}
                      >
                        {instructor.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{instructor.name}</h4>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                      {instructor.profile?.specialization && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                          {instructor.profile.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    <AnimatePresence mode="wait">
                      {showForm === instructor.id ? (
                        <motion.form
                          key="form"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.3 }}
                          onSubmit={(e) => handleChangePassword(instructor.id, e)}
                          className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2"
                        >
                          <input
                            type="password"
                            placeholder="New password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-black focus:border-black transition-shadow"
                            required
                            minLength={6}
                          />
                          <input
                            type="password"
                            placeholder="Confirm"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-black focus:border-black transition-shadow"
                            required
                            minLength={6}
                          />
                          <button
                            type="submit"
                            disabled={changingPassword === instructor.id}
                            className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                          >
                            {changingPassword === instructor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelPasswordChange}
                            className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </motion.form>
                      ) : (
                        <motion.button
                          key="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => startPasswordChange(instructor.id)}
                          className="w-full lg:w-auto bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center shadow-md"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Change Password
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
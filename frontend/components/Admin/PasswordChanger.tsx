'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';

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
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (instructorId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(instructorId);
      await adminAPI.changeInstructorPassword(instructorId, formData.password);
      alert('Password updated successfully!');
      setFormData({ password: '', confirmPassword: '' });
      setChangingPassword(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update password');
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Instructor Password Management</h3>
          <p className="text-sm text-gray-600">Change passwords for instructor accounts</p>
        </div>

        {instructors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No instructor accounts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-blue-300 flex items-center justify-center">
                        <span className="text-blue-800 font-medium text-lg">
                          {instructor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{instructor.name}</h4>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                      {instructor.profile?.specialization && (
                        <p className="text-sm text-gray-600">{instructor.profile.specialization}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {showForm === instructor.id ? (
                      <form onSubmit={(e) => handleChangePassword(instructor.id, e)} className="flex items-center space-x-2">
                        <input
                          type="password"
                          placeholder="New password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <input
                          type="password"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="submit"
                          disabled={changingPassword === instructor.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {changingPassword === instructor.id ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => startPasswordChange(instructor.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

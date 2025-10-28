'use client';

import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showProfileCard, setShowProfileCard] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'student': return '/student';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-bold text-xl text-gray-800">LMS</span>
            </a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <a
                  href={getDashboardLink()}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <div className="flex items-center space-x-2 relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="hidden md:block cursor-pointer"
                    onClick={() => setShowProfileCard(!showProfileCard)}
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </div>
                  {showProfileCard && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 z-50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-lg font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user.role}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {user.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Role:</span> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                        {user.profile?.bio && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Bio:</span> {user.profile.bio}
                          </div>
                        )}
                        {user.profile?.specialization && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Specialization:</span> {user.profile.specialization}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
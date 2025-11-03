'use client';

import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import webtitleimg1 from '../../public/webtitleimg1.jpg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src={webtitleimg1.src} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-xl text-gray-800">Vortex</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2 relative">
                  <button
                    className="cursor-pointer flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => setShowProfileCard(!showProfileCard)}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-800 hidden lg:block">
                      {user.name}
                    </div>
                  </button>

                  <AnimatePresence>
                    {showProfileCard && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        // Adjusted positioning for better responsiveness
                        className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-64 z-50 origin-top-right"
                      >
                        <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-700 text-lg font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {user.role}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Link
                            href="/profile"
                            onClick={() => setShowProfileCard(false)}
                            className="w-full flex items-center space-x-2 text-left text-sm text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>View Profile</span>
                          </Link>
                          <button
                            onClick={logout}
                            className="w-full flex items-center space-x-2 text-left text-sm text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-black p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4">
                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="block text-gray-700 hover:text-black px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block text-gray-700 hover:text-black px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-700 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user.role}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full mt-2 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors text-center"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-gray-700 hover:text-black px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block bg-black text-white px-4 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

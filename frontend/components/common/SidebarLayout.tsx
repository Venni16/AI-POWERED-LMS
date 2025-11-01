'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../src/lib/utils';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

interface SidebarLayoutProps {
  title: string;
  description: string;
  navItems: NavItem[];
  defaultTab: string;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ title, description, navItems, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const activeItem = navItems.find(item => item.id === activeTab);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center lg:hidden mb-4">
        <h2 className="text-xl font-bold text-sidebar-foreground">{title}</h2>
        <button onClick={() => setIsSidebarOpen(false)} className="text-sidebar-foreground p-2 rounded-lg hover:bg-sidebar-accent">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 custom-scrollbar overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Profile/Logout at bottom */}
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Link
          href="/profile"
          className="flex items-center p-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors mb-2"
        >
          <User className="w-5 h-5 mr-3" />
          <span>View Profile</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center p-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border p-4 pt-4">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col pt-16 lg:hidden"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {/* Header for Mobile/Tablet */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Header for Desktop */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">{title}</h1>
          <p className="mt-2 text-lg text-gray-600">{description}</p>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeItem ? activeItem.component : <div className="text-center py-12 text-gray-500">Select a tab</div>}
        </motion.div>
      </main>
    </div>
  );
};

export default SidebarLayout;
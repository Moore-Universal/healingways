'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Menu, LogOut } from 'lucide-react';
import { logoutUser, getStoredUser } from '@/app/lib/firebase/services';

interface HeaderProps {
  title: string;
  onOpenSidebar?: () => void;
}

export default function Header({ title, onOpenSidebar }: HeaderProps) {
  const user = getStoredUser();
  const initial = user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A';

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200/80 pb-4 mb-6">
      {/* Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-bold text-blue-900">{title}</h1>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors hidden sm:inline"
        >
          ← Back to Website
        </Link>
        <button 
          title="Notifications"
          className="p-2 text-gray-500 hover:text-gray-700 relative rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <Link
            href="/dashboard/profile"
            title="View Profile"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0 transition-colors"
          >
            {initial}
          </Link>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
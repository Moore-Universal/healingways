'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  PlusSquare,
  Calendar,
  Bed,
  MessageSquare,
  Folder,
  FileCheck,
  CreditCard,
  FileText,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { logoutUser } from '@/app/lib/firebase/services';

const navigation = [
  { name: 'My Healthcare Journey', href: '/dashboard', icon: Home },
  { name: 'Recommendations', href: '/dashboard/recommendations', icon: PlusSquare },
  { name: 'Treatment Plan', href: '/dashboard/treatment-plan', icon: Calendar },
  { name: 'Accommodation', href: '/dashboard/accommodation', icon: Bed },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'My Cases', href: '/dashboard/cases', icon: Folder },
  { name: 'Visa Support', href: '/dashboard/visa-support', icon: FileCheck },
  { name: 'Billing & Payments', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Dark Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static top-0 bottom-0 left-0 z-50
          w-64 bg-slate-50 border-r border-slate-200/80 min-h-screen flex flex-col p-4 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Logo & Mobile Close Button */}
        <div className="px-3 py-2 mb-4 flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="HealingWays"
              width={150}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-emerald-600'
                  }`}
                />
                <span className="leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-200/80 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="leading-tight">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User } from 'lucide-react';
import { getStoredUser, UserProfile } from '@/app/lib/firebase/services';

const navLinks = [
  { name: 'Services', href: '/services' },
  { name: 'Partner Hospitals', href: '/partner-hospitals' },
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQs', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Initialize the user from local storage
    const fetchUser = () => {
      const stored = getStoredUser();
      setUser(stored);
    };
    
    fetchUser();
    
    // Also listen for storage changes in case of multi-tab login/logout
    window.addEventListener('storage', fetchUser);
    window.addEventListener('hw_auth_changed', fetchUser);
    return () => {
      window.removeEventListener('storage', fetchUser);
      window.removeEventListener('hw_auth_changed', fetchUser);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3">
            {/* Replace /images/logo.png with your actual logo asset */}
            <div className="relative w-36 h-10">
              <Image
                src="/healing-ways-logo.png"
                alt="HealingWays Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop & Tablet Action Buttons */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {user ? (
              <Link
                href={user.role === 'admin' || user.role === 'coordinator' ? '/admin' : '/dashboard'}
                id="nav-user-dashboard-btn"
                className="text-sm font-bold text-blue-900 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 whitespace-nowrap"
              >
                {user.fullName || 'Dashboard'}
              </Link>
            ) : (
              <Link
                href="/login"
                id="nav-patient-login-btn"
                title="Patient Login"
                aria-label="Patient Login"
                className="flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors border border-slate-200 shadow-xs"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
            {!user && (
              <Link
                href="/consultation"
                id="nav-start-consultation-btn"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-full shadow-sm transition-colors whitespace-nowrap"
              >
                Start Consultation
              </Link>
            )}
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            {user ? (
              <Link
                href={user.role === 'admin' || user.role === 'coordinator' ? '/admin' : '/dashboard'}
                id="mobile-nav-user-dashboard-btn"
                className="px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg whitespace-nowrap"
              >
                {user.fullName?.split(' ')[0] || 'Dashboard'}
              </Link>
            ) : (
              <Link
                href="/login"
                id="mobile-nav-patient-login-btn"
                title="Patient Login"
                aria-label="Patient Login"
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-700 hover:text-blue-900 bg-slate-50 hover:bg-slate-100 border border-slate-200"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
            {!user && (
              <Link
                href="/consultation"
                id="mobile-nav-start-consultation-btn"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-sm whitespace-nowrap"
              >
                Start Consultation
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 hover:text-blue-900"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2.5">
            {user ? (
              <Link
                href={user.role === 'admin' || user.role === 'coordinator' ? '/admin' : '/dashboard'}
                id="mobile-drawer-user-dashboard-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 text-sm font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Go to Dashboard ({user.fullName})
              </Link>
            ) : (
              <Link
                href="/login"
                id="mobile-drawer-patient-login-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Patient Login</span>
              </Link>
            )}
            {!user && (
              <Link
                href="/consultation"
                id="mobile-drawer-start-consultation-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                Start Consultation
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
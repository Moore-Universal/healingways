'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { AdminHeader } from './_components/admin-header';
import { AdminSidebar } from './_components/admin-sidebar';
import { getStoredUser, loginUser, UserProfile } from '@/app/lib/firebase/services';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);

  // Admin login credentials state
  const [adminEmail, setAdminEmail] = useState('admin@mail.com');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = getStoredUser();
      if (user && (user.role === 'admin' || user.email.toLowerCase() === 'admin@mail.com')) {
        setAdminUser(user);
      } else {
        setAdminUser(null);
      }
      setCheckingAuth(false);
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
    window.addEventListener('hw_auth_changed', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('hw_auth_changed', checkAuth);
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await loginUser(adminEmail.trim(), adminPassword);
      if (res.success && res.user && (res.user.role === 'admin' || res.user.email.toLowerCase() === 'admin@mail.com')) {
        setAdminUser(res.user);
      } else {
        setLoginError(res.error || 'Invalid administrator credentials. Expected admin@mail.com / admin.');
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setLoginError(errorObj?.message || 'Failed to authenticate administrator.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // If not authenticated as admin, display dedicated Administrator Access portal
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                HealingWayz Administrator Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Restricted portal for clinical intake reviews and journey management
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs space-y-1 text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Credentials</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Email: <strong className="text-white">admin@mail.com</strong> | Password: <strong className="text-white">admin</strong>
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@mail.com"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Administrator Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Administrator Portal</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Drawer & Desktop Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  CheckSquare, 
  MessageSquare, 
  Building2, 
  Bed, 
  CreditCard,
  LogOut,
  X
} from 'lucide-react';
import { logoutUser } from '@/app/lib/firebase/services';
import { useRouter } from 'next/navigation';

const sidebarNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Patient Cases', icon: Users, href: '/admin/patient-cases' },
  { label: 'Billing & Payments', icon: CreditCard, href: '/admin/billing' },
  { label: 'Document Review', icon: FileCheck, href: '/admin/document-review' },
  { label: 'Tasks', icon: CheckSquare, href: '/admin/tasks' },
  { label: 'Messages', icon: MessageSquare, href: '/admin/messages' },
  { label: 'Hospitals Catalogue', icon: Building2, href: '/admin/partner-network' },
  { label: 'Accommodation', icon: Bed, href: '/admin/accommodation-admin' },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await logoutUser();
    router.push('/admin'); // Redirect to admin login
    router.refresh(); // Refresh to ensure state is cleared
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#1D4ED8] text-white flex flex-col justify-between shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Close Button Header */}
          <div className="p-6 pb-2 flex items-start justify-between">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/80 flex items-center justify-center font-bold text-base sm:text-lg text-white mb-3 lg:mb-6">
                HW
              </div>
              <span className="text-[10px] font-bold tracking-wider text-blue-200 uppercase block">
                STAFF PORTAL
              </span>
            </div>
            
            {/* Dedicated Close Button for Mobile Drawer */}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close sidebar"
                className="lg:hidden p-1.5 text-blue-200 hover:text-white hover:bg-blue-600/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-3 space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/80 text-white font-semibold'
                      : 'text-blue-100 hover:bg-blue-600/30 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-600/50">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-100 hover:text-white w-full px-2 py-2 transition-colors rounded-lg hover:bg-blue-600/30"
          >
            <LogOut className="w-4 h-4 text-blue-200 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
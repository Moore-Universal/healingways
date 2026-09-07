'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Loader2,
  HeartPulse,
  Calendar,
  Lock,
  Activity
} from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  getTreatmentUpdatesForCase,
  getStoredUser,
  TreatmentUpdate,
  PatientCase 
} from '@/app/lib/firebase/services';
import HealthcareStepper from '../_components/HealthcareStepper';

export default function TreatmentRecoveryPage() {
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [updates, setUpdates] = useState<TreatmentUpdate[]>([]);
  const [accessReason, setAccessReason] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const stored = getStoredUser();
        const user = auth.currentUser;
        const uid = user?.uid || stored?.uid || null;
        const email = user?.email || stored?.email || null;
        const c = await getUserActiveCase(uid, email);
        if (!isMounted) return;

        if (c) {
          setActiveCase(c);
          const upds = await getTreatmentUpdatesForCase(c.id);
          if (upds.length > 0) {
            setUpdates(upds);
          } else if (c.treatment_updates && c.treatment_updates.length > 0) {
            setUpdates(c.treatment_updates);
          } else {
            setUpdates([]);
          }
          
          const { checkStepAccess } = await import('@/app/lib/firebase/services');
          const access = checkStepAccess(7, c);
          if (!access.allowed) {
            setAccessReason(access.reason || 'This step is locked.');
          }
        } else {
          setActiveCase(null);
          setUpdates([]);
          const { checkStepAccess } = await import('@/app/lib/firebase/services');
          const access = checkStepAccess(7, null);
          if (!access.allowed) {
            setAccessReason(access.reason || 'This step is locked.');
          }
        }
      } catch (err) {
        console.error('Error loading treatment recovery updates:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
        <span className="text-sm font-medium text-slate-600">Loading your treatment &amp; recovery portal...</span>
      </div>
    );
  }

  // Gating rule: Step 6 (Travel Preparation) must be confirmed first
  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 sm:pb-5 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 leading-tight">
            Treatment &amp; Recovery Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Case {activeCase?.case_number || 'HW-2026-531971'} · Active clinical log &amp; rehabilitation updates
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Journey
        </Link>
      </div>

      {/* Stepper */}
      <HealthcareStepper activeCase={activeCase} />

      {/* Gating Check */}
      {accessReason ? (
        <div className="max-w-xl mx-auto my-12 bg-slate-50/90 border border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            Step Locked
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {accessReason}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Status Ribbon */}
          <div className="p-4 sm:p-5 bg-white border border-emerald-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Clinical Status</span>
                <h3 className="text-base font-bold text-slate-800">In Active Recovery &amp; Supervised Rehabilitation</h3>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-full self-start sm:self-auto">
              Stage 7: Treatment &amp; Recovery
            </span>
          </div>

          {/* Clinical Updates Feed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Daily Clinical Notes &amp; Doctor Updates
            </h3>

            {updates.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No treatment updates posted yet. Your coordinator will publish post-procedure logs here.
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 font-bold flex items-center justify-center text-xs">
                          {upd.authorName ? upd.authorName.charAt(0) : 'D'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-blue-900">{upd.title}</h4>
                          <p className="text-[11px] text-slate-500">{upd.authorName} · {upd.authorRole}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {upd.date}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {upd.notes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

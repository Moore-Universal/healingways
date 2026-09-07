'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../Header';
import { Plus, Loader2, ArrowRight, FolderKanban } from 'lucide-react';
import { getUserCases, PatientCase, getStoredUser } from '@/app/lib/firebase/services';

export default function MyCasesPage() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCases() {
      setLoading(true);
      try {
        const stored = getStoredUser();
        const uid = stored?.uid || null;
        const email = stored?.email || null;
        const fetched = await getUserCases(uid, email);
        if (isMounted) {
          setCases(fetched);
        }
      } catch (err) {
        console.error('Error fetching user cases:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-6 sm:p-10 max-w-7xl">
      <Header title="My Cases" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">My Cases</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Every healthcare journey you&apos;ve started with HealingWays.
          </p>
        </div>
        <Link
          href="/consultation"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          New Consultation
        </Link>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading your cases from database...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Cases Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              You haven&apos;t started any medical consultation cases yet. Begin your healthcare journey today.
            </p>
          </div>
          <Link
            href="/consultation"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Start Your First Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all"
            >
              <div>
                <h3 className="text-base font-bold text-blue-900">
                  {item.need || item.healthcare_area || 'Medical Consultation'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {item.case_number || item.id} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                  {item.workflow_stage || item.status || 'Active'}
                </span>
                <Link
                  href={`/dashboard?caseId=${item.id}`}
                  className="p-2 text-slate-400 hover:text-blue-900 transition-colors"
                  aria-label="View case dashboard"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
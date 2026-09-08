'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Calendar, Loader2, ArrowRight, Filter } from 'lucide-react';
import { 
  getAllCasesForAdmin,
  subscribeToAllCasesForAdmin,
  PatientCase 
} from '@/app/lib/firebase/services';

type StatusFilter = 'All' | 'New' | 'Under Review' | 'In Progress' | 'Scheduled' | 'Completed';

export default function PatientCasesPage() {
  const [allCases, setAllCases] = useState<PatientCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToAllCasesForAdmin((list) => {
      if (!isMounted) return;
      setAllCases(list || []);
      setFilteredCases(list || []);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Client-side instant filtering
  useEffect(() => {
    let result = allCases;

    if (selectedFilter !== 'All') {
      result = result.filter((c) => c.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.patient_name.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q) ||
          c.need.toLowerCase().includes(q) ||
          (c.coordinator_name && c.coordinator_name.toLowerCase().includes(q))
      );
    }

    setFilteredCases(result);
  }, [allCases, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 font-sans max-w-7xl mx-auto w-full p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Patient Cases Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage intake details, clinical review milestones, and multi-stage patient coordination.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, case ID, or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'New', 'Under Review', 'In Progress', 'Scheduled', 'Completed'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectedFilter === st
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
          <span className="text-xs sm:text-sm text-slate-500">Loading cases...</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Filter className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No cases match your filters</p>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Patient &amp; Case</th>
                  <th className="py-3.5 px-4">Condition &amp; Need</th>
                  <th className="py-3.5 px-4">Workflow Stage</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Coordinator</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-bold text-blue-900">{c.patient_name}</div>
                      <div className="text-[11px] text-slate-400">{c.case_number}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{c.need}</div>
                      <div className="text-[11px] text-slate-400">{c.healthcare_area || 'Orthopedic / General'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {c.workflow_stage || c.stage || 'Case Review'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          c.status === 'New'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {c.coordinator_name || 'Sarah James'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/cases/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

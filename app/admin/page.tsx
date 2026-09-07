'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Navigation, 
  Shield, 
  X, 
  Loader2, 
  Check, 
  UserCheck 
} from 'lucide-react';
import { 
  getAllCasesForAdmin, 
  updatePatientCase, 
  PatientCase 
} from '@/app/lib/firebase/services';

interface UrgentItem {
  id: string;
  name: string;
  specialty: string;
  coordinator: string;
  isUnassigned?: boolean;
}

interface ActivityDisplayItem {
  id: string;
  name: string;
  badge: string;
  badgeStyle: string;
  department: string;
  stage: string;
  timeAgo: string;
}

interface TeamMemberWorkload {
  name: string;
  count: number;
  isUnassigned?: boolean;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allCases, setAllCases] = useState<PatientCase[]>([]);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<Record<string, string>>({});
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize cases directly from database
  const loadDashboardCases = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await getAllCasesForAdmin();
      setAllCases(fetched || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data from database:', err);
      setAllCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardCases();
  }, [loadDashboardCases]);

  // Compute metrics dynamically from database cases
  const newConsultationsCount = allCases.filter(
    (c) => c.status === 'New' || c.workflow_stage === 'Consultation Submitted'
  ).length;

  const activeCasesCount = allCases.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review' || c.status === 'Scheduled'
  ).length;

  const awaitingInfoCount = allCases.filter(
    (c) => c.status === 'Under Review' || c.document_status === 'Pending Review'
  ).length;

  const documentsPendingReviewCount = allCases.reduce(
    (sum, c) => sum + (c.documents?.length || (c.documents_submitted ? 1 : 0)),
    0
  );

  const openTasksCount = allCases.reduce(
    (sum, c) => sum + (c.tasks?.filter((t) => t.status === 'open').length || 0),
    0
  );

  // Urgent cases derived strictly from database records
  const urgentCases: UrgentItem[] = allCases
    .filter((c) => c.priority === 'Urgent' || c.priority === 'High' || !c.coordinator_name)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.patient_name || 'Patient',
      specialty: c.need || c.healthcare_area || 'General',
      coordinator: c.coordinator_name || 'Unassigned',
      isUnassigned: !c.coordinator_name,
    }));

  // Helper for human-readable relative time
  const formatTimeAgo = (iso?: string) => {
    if (!iso) return 'Recently';
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Recent activity derived strictly from database cases
  const recentActivities: ActivityDisplayItem[] = allCases.slice(0, 7).map((c) => ({
    id: c.id,
    name: c.patient_name || 'Patient',
    badge: c.status || 'New',
    badgeStyle:
      c.status === 'New'
        ? 'bg-slate-100 text-slate-700'
        : c.status === 'Under Review'
        ? 'bg-[#fef3c7] text-[#b45309]'
        : 'bg-[#e6f7ef] text-[#0d824d]',
    department: c.need || c.healthcare_area || 'General Medicine',
    stage: c.workflow_stage || c.stage || 'Consultation Submitted',
    timeAgo: formatTimeAgo(c.updated_at || c.created_at),
  }));

  // Team Workload calculation from real database cases
  const unassignedCasesList = allCases.filter((c) => !c.coordinator_name);
  const unassignedCount = unassignedCasesList.length;

  const coordinatorCounts: Record<string, number> = {};
  allCases.forEach((c) => {
    if (c.coordinator_name) {
      coordinatorCounts[c.coordinator_name] = (coordinatorCounts[c.coordinator_name] || 0) + 1;
    }
  });

  const teamWorkload: TeamMemberWorkload[] = [
    { name: 'Sarah James', count: coordinatorCounts['Sarah James'] || 0 },
    { name: 'Unassigned', count: unassignedCount, isUnassigned: true },
    { name: 'Daniel Okoro', count: coordinatorCounts['Daniel Okoro'] || 0 },
  ];

  // Open assign modal and prep drafts
  const handleOpenAssign = () => {
    if (unassignedCasesList.length === 0) return;
    const drafts: Record<string, string> = {};
    unassignedCasesList.forEach((c) => {
      drafts[c.id] = 'Sarah James';
    });
    setAssignmentDraft(drafts);
    setShowAssignModal(true);
  };

  const handleConfirmAssignments = async () => {
    setSavingAssignments(true);
    try {
      const updatedCases = [...allCases];

      for (const [cid, coordName] of Object.entries(assignmentDraft)) {
        await updatePatientCase(cid, {
          coordinator_name: coordName,
          coordinator_id: coordName.toLowerCase().replace(/\s+/g, '-'),
        });

        const idx = updatedCases.findIndex((c) => c.id === cid);
        if (idx !== -1) {
          updatedCases[idx] = {
            ...updatedCases[idx],
            coordinator_name: coordName,
            coordinator_id: coordName.toLowerCase().replace(/\s+/g, '-'),
          };
        }
      }

      setAllCases(updatedCases);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hw_all_cases', JSON.stringify(updatedCases));
      }

      setShowAssignModal(false);
      setSuccessToast('Cases successfully assigned to coordinators.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      console.error('Error assigning cases:', e);
    } finally {
      setSavingAssignments(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 font-sans max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Greeting Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] tracking-tight">
          Good to see you, Sarah.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Here&apos;s what&apos;s happening across your caseload today.
        </p>
      </div>

      {/* Mint Announcement Banner */}
      <div className="bg-[#eaf7ee] border border-[#cdecd6] rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 shadow-2xs">
        <Navigation className="w-5 h-5 text-emerald-600 shrink-0 rotate-45" />
        <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
          <span className="font-semibold text-emerald-950">New service live: Flight Booking &amp; Scheduling</span>
          {' '}&mdash; patients get up to 5% off all flights. Let your patients know when discussing travel plans.
        </p>
      </div>

      {/* 5 KPI / Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. New Consultations */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">New Consultations</span>
          <span className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mt-3">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : newConsultationsCount}
          </span>
        </div>

        {/* 2. Active Cases */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Active Cases</span>
          <span className="text-3xl sm:text-4xl font-bold text-emerald-600 mt-3">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : activeCasesCount}
          </span>
        </div>

        {/* 3. Awaiting Patient Info */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Awaiting Patient Info</span>
          <span className="text-3xl sm:text-4xl font-bold text-amber-500 mt-3">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : awaitingInfoCount}
          </span>
        </div>

        {/* 4. Documents Pending Review */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Documents Pending Review</span>
          <span className="text-3xl sm:text-4xl font-bold text-[#3b82f6] mt-3">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : documentsPendingReviewCount}
          </span>
        </div>

        {/* 5. Open Tasks */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">Open Tasks</span>
          <span className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mt-3">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : openTasksCount}
          </span>
        </div>
      </div>

      {/* Urgent Attention Alert Box */}
      <div className="bg-[#fef2f2] border border-rose-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-rose-600">
          <Shield className="w-5 h-5 stroke-[2] text-rose-500" />
          <h3 className="text-sm font-bold text-rose-600">
            {urgentCases.length === 0 ? 'No urgent cases flagged' : `${urgentCases.length} urgent cases need attention`}
          </h3>
        </div>

        {urgentCases.length === 0 ? (
          <p className="text-xs text-rose-700/80 font-medium">
            All active patient cases in the database are currently triaged and on track.
          </p>
        ) : (
          <div className="space-y-2.5 pt-0.5">
            {urgentCases.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="text-slate-700 truncate pr-2">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {' '}&mdash;{' '}
                  <span>{c.specialty}</span>
                  {' '}&middot;{' '}
                  {c.isUnassigned ? (
                    <span className="text-rose-600 font-semibold">Unassigned</span>
                  ) : (
                    <span className="text-slate-600">{c.coordinator}</span>
                  )}
                </div>
                <Link
                  href={`/admin/cases/${c.id}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-xs sm:text-sm hover:underline shrink-0 cursor-pointer"
                >
                  Open &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Activity & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Left Column: Recent Activity (65% width) */}
        <div className="lg:col-span-8 space-y-2.5">
          <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase">
            RECENT ACTIVITY
          </h2>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm font-semibold text-slate-700">No active cases in database</p>
                <p className="text-xs text-slate-400 mt-1">
                  When new patient consultations are submitted, they will appear here in real time.
                </p>
              </div>
            ) : (
              recentActivities.map((act) => (
                <Link
                  key={act.id}
                  href={`/admin/cases/${act.id}`}
                  className="p-4 sm:px-6 sm:py-4 hover:bg-slate-50/70 transition-colors flex flex-col gap-1.5 block group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {act.name}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${act.badgeStyle}`}>
                      {act.badge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {act.department} &middot; {act.stage}
                    </span>
                    <span className="shrink-0">{act.timeAgo}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Team Workload (35% width) */}
        <div className="lg:col-span-4 space-y-2.5">
          <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase">
            TEAM WORKLOAD
          </h2>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="space-y-4">
              {teamWorkload.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      member.isUnassigned ? 'text-rose-600' : 'text-slate-800'
                    }`}
                  >
                    {member.name}
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {member.count} cases
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={unassignedCount === 0}
                onClick={handleOpenAssign}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-600 text-emerald-700 font-semibold text-xs sm:text-sm hover:bg-emerald-50 transition-colors text-center cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {unassignedCount} unassigned {unassignedCount === 1 ? 'case' : 'cases'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Coordinator Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Unassigned Cases</h3>
                <p className="text-xs text-slate-500 mt-0.5">Delegate cases to active care coordinators</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {unassignedCasesList.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{c.patient_name}</span>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {c.need || 'General'}
                    </span>
                  </div>
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Select Coordinator:
                    </label>
                    <select
                      value={assignmentDraft[c.id] || 'Sarah James'}
                      onChange={(e) =>
                        setAssignmentDraft({ ...assignmentDraft, [c.id]: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="Sarah James">Sarah James (Care Coordinator)</option>
                      <option value="Daniel Okoro">Daniel Okoro (Care Coordinator)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAssignments}
                onClick={handleConfirmAssignments}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {savingAssignments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Confirm Assignments</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

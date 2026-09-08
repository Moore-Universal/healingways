'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Calendar,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  subscribeToUserActiveCase,
  patientConfirmMedicalItinerary,
  patientDeclineMedicalItinerary,
  getStoredUser,
  checkStepAccess,
  PatientCase 
} from '@/app/lib/firebase/services';
import HealthcareStepper from '../_components/HealthcareStepper';
import PatientStageDocuments from '../_components/PatientStageDocuments';

export default function MedicalItineraryPage() {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [accessReason, setAccessReason] = useState<string | null>(null);
  
  const [declining, setDeclining] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reloadData = async () => {
    try {
      const stored = getStoredUser();
      const user = auth.currentUser;
      const uid = user?.uid || stored?.uid || null;
      const email = user?.email || stored?.email || null;
      const c = await getUserActiveCase(uid, email);
      setActiveCase(c);
      
      const { checkStepAccess } = await import('@/app/lib/firebase/services');
      const access = checkStepAccess(4, c);
      if (!access.allowed) {
        setAccessReason(access.reason || 'This step is locked.');
      } else {
        setAccessReason(null);
      }
    } catch (err) {
      console.error('Error loading medical itinerary:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const stored = getStoredUser();
    const user = auth.currentUser;
    const uid = user?.uid || stored?.uid || null;
    const email = user?.email || stored?.email || null;

    const unsubscribe = subscribeToUserActiveCase(uid, email, (c) => {
      if (!isMounted) return;
      setActiveCase(c);
      const access = checkStepAccess(4, c);
      if (!access.allowed) {
        setAccessReason(access.reason || 'This step is locked.');
      } else {
        setAccessReason(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleConfirmItinerary = async () => {
    if (!activeCase) return;
    setConfirming(true);
    setErrorMsg(null);
    try {
      await patientConfirmMedicalItinerary(activeCase.id);
      await reloadData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Error confirming itinerary.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeclineItinerary = async () => {
    if (!activeCase || !declineReason.trim()) return;
    setDeclining(true);
    setErrorMsg(null);

    try {
      await patientDeclineMedicalItinerary(activeCase.id, declineReason.trim());
      setDeclineReason('');
      setShowDeclineForm(false);
      await reloadData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to submit revision request.');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
        <span className="text-sm font-medium text-slate-600">Loading your medical itinerary...</span>
      </div>
    );
  }

  // Gating rules:
  // 1. Stage 2 (Case Review) accepted
  // 2. Stage 3 (Hospital) selected
  const isItineraryConfirmed = !!activeCase?.itinerary_confirmed_by_patient;
  const isDeclined = !!activeCase?.itinerary_declined;
  const itineraryText = activeCase?.itinerary_notes || `Day 1: Arrival & Hospital Transfer, Comprehensive Pre-operative Diagnostic Screening (Blood panel, ECG, digital imaging).
Day 2: Specialist Consultation with Surgical Chief, Pre-anesthesia Evaluation & Final Surgical Planning.
Day 3: Scheduled Surgical Procedure in Dedicated Robotic Theater (Est. 2.5 hrs). Post-op Recovery in High Dependency Unit.
Day 4-6: Inpatient Hospital Room Recovery, Assisted Physical Mobilization & Continuous Vital Monitoring.
Day 7: Discharge to Partner Recovery Suite with Daily Nurse Check-ins & Physical Therapy.
Day 10: Follow-up Clinical Consultation & Suture Inspection.
Day 12: Fit-to-Fly Certification & Airport Departure Transfer.`;

  return (
    <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 leading-tight">
            Medical Itinerary &amp; Care Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Case {activeCase?.case_number || 'HW-2026-531971'} · Coordinated with {activeCase?.selected_hospital?.name || 'Selected Hospital'}
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
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-blue-900">Custom Clinical Timeline</h3>
                  <p className="text-xs text-slate-500">Prepared by Care Coordinator Sarah James</p>
                </div>
              </div>

              {isItineraryConfirmed ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4" /> Itinerary Confirmed by You
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 self-start sm:self-auto">
                  <Clock className="w-4 h-4" /> Awaiting Your Confirmation
                </span>
              )}
            </div>

            {/* Schedule Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Medical Schedule
              </h4>
              <div className="p-5 bg-slate-50 rounded-xl text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line border border-slate-100 font-mono">
                {itineraryText}
              </div>

              {/* Supplementary Documents for Medical Itinerary */}
              <PatientStageDocuments
                caseRecord={activeCase}
                stage="Medical Itinerary"
                title="Itinerary & Pre-Op Documents"
                description="Detailed schedule PDFs, hospital admission passes, and pre-op clinical instructions provided by your care coordinator."
              />
            </div>

            {/* Confirmation Area */}
            <div className="pt-4 border-t border-slate-100">
              {isItineraryConfirmed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Itinerary Accepted</p>
                    <p className="text-xs text-emerald-700">
                      Accommodation &amp; Visa support stage is now unlocked.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/accommodation"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Proceed to Accommodation &amp; Visa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : isDeclined ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">Revision Requested</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You have declined this itinerary and requested a revision. Our logistics team will update your schedule and notify you shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700">
                    Please review the timeline. Confirming this itinerary allows our logistics team to confirm hotel suites and generate medical visa invitation letters.
                  </p>
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={handleConfirmItinerary}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Confirming Schedule...
                      </>
                    ) : (
                      <>
                        <span>Accept &amp; Confirm Medical Itinerary</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setShowDeclineForm(!showDeclineForm)}
                      className="text-xs text-slate-700 hover:text-red-600 transition-colors font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      I need changes to this schedule
                    </button>
                  </div>

                  {showDeclineForm && (
                    <div className="p-5 bg-red-50/80 border border-red-200 rounded-2xl space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-red-950">
                        What changes do you need?
                      </label>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="e.g. Can we delay the surgery by one day? I need more time to rest after the flight..."
                        rows={3}
                        className="w-full px-3.5 py-3 text-sm font-medium bg-white border border-red-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400 resize-none shadow-2xs"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDeclineForm(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={declining || !declineReason.trim()}
                          onClick={handleDeclineItinerary}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Request Schedule Change
                        </button>
                      </div>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

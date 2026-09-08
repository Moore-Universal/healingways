'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Plane,
  Lock,
  Luggage,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  subscribeToUserActiveCase,
  patientConfirmTravel,
  patientDeclineTravel,
  getStoredUser,
  checkStepAccess,
  PatientCase 
} from '@/app/lib/firebase/services';
import HealthcareStepper from '../_components/HealthcareStepper';
import PatientStageDocuments from '../_components/PatientStageDocuments';

export default function TravelPreparationPage() {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [accessReason, setAccessReason] = useState<string | null>(null);

  const [declining, setDeclining] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    passport: true,
    medicalRecords: true,
    medications: true,
    insurance: true,
  });

  const loadCaseData = async () => {
    try {
      const stored = getStoredUser();
      const user = auth.currentUser;
      const uid = user?.uid || stored?.uid || null;
      const email = user?.email || stored?.email || null;
      const c = await getUserActiveCase(uid, email);
      setActiveCase(c);
      
      const { checkStepAccess } = await import('@/app/lib/firebase/services');
      const access = checkStepAccess(6, c);
      if (!access.allowed) {
        setAccessReason(access.reason || 'This step is locked.');
      } else {
        setAccessReason(null);
      }
    } catch (err) {
      console.error('Error loading travel preparation:', err);
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
      const access = checkStepAccess(6, c);
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

  const handleConfirm = async () => {
    if (!activeCase) return;
    setConfirming(true);
    setErrorMsg(null);
    try {
      await patientConfirmTravel(activeCase.id);
      await loadCaseData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Error confirming travel plan.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDecline = async () => {
    if (!activeCase || !declineReason.trim()) return;
    setDeclining(true);
    setErrorMsg(null);

    try {
      await patientDeclineTravel(activeCase.id, declineReason.trim());
      setDeclineReason('');
      setShowDeclineForm(false);
      await loadCaseData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to submit request.');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
        <span className="text-sm font-medium text-slate-600">Loading your travel preparation...</span>
      </div>
    );
  }

  // Gating rule: Step 5 (Accommodation & Visa) must be confirmed first
  const isTravelConfirmed = !!activeCase?.confirmed_by_patient;
  const isDeclined = !!activeCase?.travel_declined;

  const flightText = activeCase?.flight_details || '';

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 sm:pb-5 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 leading-tight">
            Travel Preparation &amp; Flight Logistics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Case {activeCase?.case_number || activeCase?.id || 'Active Case'} · Safe journey clearance and arrival assistance
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Flight Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-blue-900">Flight &amp; Ground Logistics Plan</h3>
                  <p className="text-xs text-slate-500">Curated for low physical strain and continuous comfort</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-slate-100 font-mono">
                {flightText ? (
                  flightText
                ) : (
                  <span className="text-slate-400 italic font-sans">No flight or travel details provided yet by your care team.</span>
                )}
              </div>

              {/* Supplementary Documents for Travel Preparation */}
              <PatientStageDocuments
                caseRecord={activeCase}
                stage="Travel Preparation"
                title="Flight Tickets & Logistics Documents"
                description="E-tickets, boarding guides, airport pickup vouchers, and fit-to-fly forms provided by your coordinator."
              />

              {isTravelConfirmed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Travel Readiness Confirmed</p>
                      <p className="text-[11px] text-emerald-700">
                        Final clinical stage unlocked: Treatment &amp; Recovery monitoring.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/treatment-recovery"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>View Treatment &amp; Recovery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : isDeclined ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">Travel Adjustments Requested</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You have requested changes to your travel plan. Our flight coordination team will update your details shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-xs text-slate-600">
                      Confirm your departure plan so our airport ground host can meet you at arrival gate.
                    </p>
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={handleConfirm}
                      className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Confirming Readiness...
                        </>
                      ) : (
                        <>
                          <span>Confirm Travel &amp; Advance to Treatment</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => setShowDeclineForm(!showDeclineForm)}
                      className="text-xs text-slate-700 hover:text-red-600 transition-colors font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      I need to change my travel arrangements
                    </button>
                  </div>

                  {showDeclineForm && (
                    <div className="p-5 bg-red-50/80 border border-red-200 rounded-2xl space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-red-950">
                        What changes are needed?
                      </label>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="e.g. Can we move the flight to an evening departure? I have a scheduling conflict..."
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
                          onClick={handleDecline}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Request Changes
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

            {/* Pre-Travel Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Luggage className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-blue-900">Pre-Flight Checklist</h3>
              </div>

              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.passport}
                    onChange={(e) => setChecklist({ ...checklist, passport: e.target.checked })}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Valid Passport (6+ mos validity)</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.medicalRecords}
                    onChange={(e) => setChecklist({ ...checklist, medicalRecords: e.target.checked })}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Physical Copies of MRI / Scans</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.medications}
                    onChange={(e) => setChecklist({ ...checklist, medications: e.target.checked })}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Original Prescription Medications</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.insurance}
                    onChange={(e) => setChecklist({ ...checklist, insurance: e.target.checked })}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Travel Medical Insurance Policy</span>
                </label>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl text-xs font-semibold text-emerald-900 leading-relaxed flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>24/7 International Emergency Helpline: +1 (800) 555-CARE</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

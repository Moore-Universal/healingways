'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  XCircle
} from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  subscribeToUserActiveCase,
  patientAcceptCaseReview,
  patientDeclineCaseReview,
  getStoredUser,
  checkStepAccess,
  PatientCase 
} from '@/app/lib/firebase/services';
import HealthcareStepper from '../_components/HealthcareStepper';
import PatientStageDocuments from '../_components/PatientStageDocuments';

export default function PatientCaseReviewPage() {
  const [caseDetails, setCaseDetails] = useState<PatientCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState<string | null>(null);

  const reloadCase = async () => {
    try {
      const stored = getStoredUser();
      const user = auth.currentUser;
      const uid = user?.uid || stored?.uid || null;
      const email = user?.email || stored?.email || null;
      const c = await getUserActiveCase(uid, email);
      setCaseDetails(c);
      
      const { checkStepAccess } = await import('@/app/lib/firebase/services');
      const access = checkStepAccess(2, c);
      if (!access.allowed) {
        setAccessReason(access.reason || 'This step is locked.');
      } else {
        setAccessReason(null);
      }

      if (c?.review_accepted) {
        setConfirmedCheck(true);
      }
    } catch (err) {
      console.error('Error fetching case:', err);
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
      setCaseDetails(c);
      const access = checkStepAccess(2, c);
      if (!access.allowed) {
        setAccessReason(access.reason || 'This step is locked.');
      } else {
        setAccessReason(null);
      }
      if (c?.review_accepted) {
        setConfirmedCheck(true);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleAcceptReview = async () => {
    if (!caseDetails || !confirmedCheck) return;
    setAccepting(true);
    setErrorMsg(null);

    try {
      await patientAcceptCaseReview(caseDetails.id);
      await reloadCase();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to accept review. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineReview = async () => {
    if (!caseDetails || !declineReason.trim()) return;
    setDeclining(true);
    setErrorMsg(null);

    try {
      await patientDeclineCaseReview(caseDetails.id, declineReason.trim());
      setDeclineReason('');
      setShowDeclineForm(false);
      await reloadCase();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to submit revision request. Please try again.');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
        <span className="text-sm font-medium text-slate-600">Loading your clinical case review...</span>
      </div>
    );
  }

  const reviewAvailable = !!caseDetails?.review_text;
  const isAccepted = !!caseDetails?.review_accepted;
  const isDeclined = !!caseDetails?.review_declined;

  return (
    <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 leading-tight">
            Case Review &amp; Clinical Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {caseDetails?.case_number ? `Case #${caseDetails.case_number}` : 'Consultation'} · Evaluated by Senior Medical Board
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Journey
        </Link>
      </div>

      {/* Stepper Header */}
      <HealthcareStepper activeCase={caseDetails} />

      {accessReason ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl max-w-2xl mx-auto mt-8">
          <Lock className="w-10 h-10 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Step Locked</h2>
          <p className="text-sm text-slate-500 mb-6">{accessReason}</p>
          <Link href="/dashboard" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Doctor's Assessment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                  MD
                </div>
                <div>
                  <h3 className="text-base font-bold text-blue-900">
                    {caseDetails?.coordinator_name ? `${caseDetails.coordinator_name} (Care Coordinator)` : 'Clinical Evaluation Team'}
                  </h3>
                  <p className="text-xs text-slate-500">Official Clinical Case Review</p>
                </div>
              </div>
              {isAccepted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accepted &amp; Confirmed
                </span>
              ) : reviewAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                  <Clock className="w-3.5 h-3.5" /> Action Required
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  Under Evaluation
                </span>
              )}
            </div>

            {/* Assessment Text */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Medical Evaluation &amp; Treatment Assessment
              </h4>
              {reviewAvailable ? (
                <div className="space-y-3">
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-line border border-slate-100">
                    {caseDetails?.review_text}
                  </div>
                  {/* Supplementary Documents for Case Review */}
                  <PatientStageDocuments
                    caseRecord={caseDetails}
                    stage="Case Review"
                    title="Supplementary Clinical Documents"
                    description="Official evaluations, reports, and specialist opinions attached by your care coordinator to supplement this review."
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <h5 className="text-sm font-semibold text-slate-700">Doctors Are Reviewing Your Records</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your medical coordinator is coordinating with partner hospital specialists. Clinical review notes will appear here shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Box (if review is present) */}
            {reviewAvailable && (
              <div className="pt-4 border-t space-y-4">
                {isAccepted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-800">You confirmed this medical review</p>
                      <p className="text-[11px] text-emerald-700">
                        Hospital recommendations are now unlocked for your case.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/recommendations"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>View Hospitals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : isDeclined ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-900">Revision Requested</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        You have declined this review and requested a revision. Our medical team has been notified and will provide an updated assessment shortly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer text-sm font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={confirmedCheck}
                        onChange={(e) => setConfirmedCheck(e.target.checked)}
                        className="mt-0.5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <span>
                        I have read and understood the clinical review notes provided by the medical team, and I agree to proceed to hospital selection.
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!confirmedCheck || accepting}
                      onClick={handleAcceptReview}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Confirming Review...
                        </>
                      ) : (
                        <>
                          <span>Accept Doctor&apos;s Review &amp; Unlock Hospitals</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setShowDeclineForm(!showDeclineForm)}
                        className="text-xs text-slate-700 hover:text-red-600 transition-colors font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        I disagree / Request Revision
                      </button>
                    </div>

                    {showDeclineForm && (
                      <div className="p-5 bg-red-50/80 border border-red-200 rounded-2xl space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-red-950">
                          Reason for declining:
                        </label>
                        <textarea
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="Please let us know your concerns with this review..."
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
                            onClick={handleDeclineReview}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Submit Revision Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Case Summary & Gated Next Stage Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Case Parameters
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <p><strong className="text-slate-800">Need:</strong> {caseDetails?.need || 'Medical Care'}</p>
              <p><strong className="text-slate-800">Specialty:</strong> {caseDetails?.healthcare_area || 'Clinical Review'}</p>
              <p><strong className="text-slate-800">Diagnosis:</strong> {caseDetails?.diagnosis || 'See consultation records'}</p>
              <p><strong className="text-slate-800">Destination Preference:</strong> {caseDetails?.preferred_location || 'Flexible'}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              {isAccepted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-slate-400" />}
              <h4 className="text-sm font-bold">Next Stage: Hospital Recommendations</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAccepted
                ? 'Your coordinator has matched accredited hospitals based on your verified medical assessment.'
                : 'Hospital recommendations remain locked until you accept the doctor\'s medical review above.'}
            </p>
            {isAccepted && (
              <Link
                href="/dashboard/recommendations"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-1"
              >
                <span>Select Hospital</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

      </div>
        </>
      )}
    </div>
  );
}

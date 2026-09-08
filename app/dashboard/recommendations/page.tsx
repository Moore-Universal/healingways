'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  Loader2,
  CheckCircle2,
  MapPin,
  Lock,
  Star,
  ShieldCheck,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  subscribeToUserActiveCase,
  patientSelectHospital,
  patientDeclineHospitals,
  getStoredUser,
  checkStepAccess,
  DEFAULT_HOSPITALS,
  Hospital,
  PatientCase 
} from '@/app/lib/firebase/services';
import HealthcareStepper from '../_components/HealthcareStepper';
import PatientStageDocuments from '../_components/PatientStageDocuments';

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
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
      if (c) {
        setActiveCase(c);
        setSelectedHospitalId(c.selected_hospital_id || null);
        const recList = (c.recommended_hospitals && c.recommended_hospitals.length > 0)
          ? c.recommended_hospitals
          : DEFAULT_HOSPITALS;
        setHospitals(recList);
        
        const { checkStepAccess } = await import('@/app/lib/firebase/services');
        const access = checkStepAccess(3, c);
        if (!access.allowed) {
          setAccessReason(access.reason || 'This step is locked.');
        } else {
          setAccessReason(null);
        }
      } else {
        setHospitals(DEFAULT_HOSPITALS);
        const { checkStepAccess } = await import('@/app/lib/firebase/services');
        const access = checkStepAccess(3, null);
        if (!access.allowed) {
          setAccessReason(access.reason || 'This step is locked.');
        }
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
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
      if (c) {
        setActiveCase(c);
        setSelectedHospitalId(c.selected_hospital_id || null);
        const recList = (c.recommended_hospitals && c.recommended_hospitals.length > 0)
          ? c.recommended_hospitals
          : DEFAULT_HOSPITALS;
        setHospitals(recList);
        
        const access = checkStepAccess(3, c);
        if (!access.allowed) {
          setAccessReason(access.reason || 'This step is locked.');
        } else {
          setAccessReason(null);
        }
      } else {
        setHospitals(DEFAULT_HOSPITALS);
        const access = checkStepAccess(3, null);
        if (!access.allowed) {
          setAccessReason(access.reason || 'This step is locked.');
        } else {
          setAccessReason(null);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSelectHospital = async (hosp: Hospital) => {
    if (!activeCase) return;
    setSelecting(hosp.id);
    setErrorMsg(null);
    try {
      await patientSelectHospital(activeCase.id, hosp.id, hosp);
      setSelectedHospitalId(hosp.id);
      await reloadData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to select hospital.');
    } finally {
      setSelecting(null);
    }
  };

  const handleDeclineHospitals = async () => {
    if (!activeCase || !declineReason.trim()) return;
    setDeclining(true);
    setErrorMsg(null);

    try {
      await patientDeclineHospitals(activeCase.id, declineReason.trim());
      setDeclineReason('');
      setShowDeclineForm(false);
      await reloadData();
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
        <span className="text-sm font-medium text-slate-600">Loading your hospital recommendations...</span>
      </div>
    );
  }

  // Gating rule: Stage 2 (Case Review) must be accepted before Stage 3 is available
  const hasHospitalSelected = !!selectedHospitalId;
  const isDeclined = !!activeCase?.hospital_declined;

  return (
    <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 leading-tight">
            Hospital Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Case {activeCase?.case_number || 'HW-2026-531971'} · Curated accredited hospital options
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Journey
        </Link>
      </div>

      {/* Healthcare Stepper */}
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
          {hasHospitalSelected && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Hospital Choice Confirmed</p>
                  <p className="text-xs text-emerald-700">
                    Medical itinerary creation is now unlocked. You can view your scheduled treatment timeline.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/medical-itinerary"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>View Medical Itinerary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Hospital Cards Grid */}
          {isDeclined ? (
            <div className="p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 mt-4">
              <Clock className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Alternative Options Requested</p>
                <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                  You requested alternative hospital recommendations. Our medical coordinator is currently reviewing your case to provide new options that better suit your preferences.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hospitals.map((hosp) => {
                  const isSelected = selectedHospitalId === hosp.id;
                  return (
                    <div
                      key={hosp.id}
                      className={`bg-white rounded-2xl border p-6 transition-all space-y-5 flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 mb-1.5">
                              <ShieldCheck className="w-3 h-3" /> {hosp.accreditation || 'JCI Accredited'}
                            </span>
                            <h3 className="text-lg font-bold text-blue-900 leading-snug">{hosp.name}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {hosp.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {hosp.rating || 4.9}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {hosp.description}
                        </p>

                        {/* Specialties */}
                        {hosp.specialties && hosp.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {hosp.specialties.map((spec) => (
                              <span
                                key={spec}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Est. Procedure Range</span>
                          <p className="text-xs font-bold text-slate-800">{hosp.estimatedCost || '$6,500 - $8,200'}</p>
                        </div>

                        <button
                          type="button"
                          disabled={selecting === hosp.id || hasHospitalSelected}
                          onClick={() => handleSelectHospital(hosp)}
                          className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {selecting === hosp.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Selecting...
                            </>
                          ) : isSelected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Confirmed Choice
                            </>
                          ) : (
                            'Select Hospital'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Supplementary Documents for Hospital Recommendations */}
              <PatientStageDocuments
                caseRecord={activeCase}
                stage="Hospital Recommendation"
                title="Hospital Quotes & Credential Documents"
                description="Official hospital brochures, treatment cost breakdowns, and specialist credentials provided by your care team."
              />

              {!hasHospitalSelected && (
                <div className="mt-8 border-t border-slate-200 pt-6 max-w-2xl mx-auto">
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowDeclineForm(!showDeclineForm)}
                      className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium underline underline-offset-2"
                    >
                      None of these fit my needs / Request other options
                    </button>
                  </div>

                  {showDeclineForm && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-xl space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-red-900">
                        Please tell us what you&apos;re looking for instead:
                      </label>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="e.g. I prefer a hospital in Europe, or I&apos;m looking for a lower price range..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDeclineForm(false)}
                          className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={declining || !declineReason.trim()}
                          onClick={handleDeclineHospitals}
                          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {declining ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Request New Options
                        </button>
                      </div>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

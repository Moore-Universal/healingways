'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Plus, 
  ShieldCheck,
  Send,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { 
  PatientCase, 
  Hospital, 
  getHospitals,
  adminSetRecommendedHospitals 
} from '@/app/lib/firebase/services';
import StageDocumentAttachment from './StageDocumentAttachment';

interface AdminHospitalRecommendationsProps {
  caseRecord: PatientCase;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  onAdvanceStage: (nextStage: string) => Promise<void>;
}

export default function AdminHospitalRecommendations({
  caseRecord,
  onUpdateCase,
  showToast,
  onAdvanceStage,
}: AdminHospitalRecommendationsProps) {
  const [availableHospitals, setAvailableHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>(() =>
    (caseRecord.recommended_hospitals || []).map((h) => h.id)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    async function loadHospitals() {
      setLoading(true);
      try {
        const h = await getHospitals();
        setAvailableHospitals(h);
      } catch (err) {
        showToast('Error loading hospital catalogue.');
      } finally {
        setLoading(false);
      }
    }
    loadHospitals();
  }, []);

  const toggleHospital = (hId: string) => {
    if (selectedHospitalIds.includes(hId)) {
      if (selectedHospitalIds.length === 1) {
        showToast('At least one hospital recommendation is required.');
        return;
      }
      setSelectedHospitalIds((prev) => prev.filter((id) => id !== hId));
    } else {
      setSelectedHospitalIds((prev) => [...prev, hId]);
    }
  };

  const handleSendRecommendations = async () => {
    setSaving(true);
    try {
      const selectedHospitals = availableHospitals.filter((h) => selectedHospitalIds.includes(h.id));
      await adminSetRecommendedHospitals(caseRecord.id, selectedHospitals);
      onUpdateCase({
        recommended_hospitals: selectedHospitals,
        hospitals_sent_to_patient: true,
        hospital_accepted: false,
        hospital_declined: false,
        hospital_decline_reason: '',
      });
      showToast('Hospital recommendations published & sent to patient portal.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending hospital recommendations.';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdvance = async () => {
    setAdvancing(true);
    try {
      const selectedHospitals = availableHospitals.filter((h) => selectedHospitalIds.includes(h.id));
      const firstHosp = selectedHospitals[0];
      
      if (!firstHosp) {
        showToast('Please select at least one hospital.');
        return;
      }
      
      await onUpdateCase({
        recommended_hospitals: selectedHospitals,
        selected_hospital_id: firstHosp.id,
        selected_hospital: firstHosp,
        hospital_accepted: true,
        hospital_declined: false,
      });
      await onAdvanceStage('Medical Itinerary');
      showToast(`Hospital "${firstHosp.name}" confirmed. Advanced to Medical Itinerary.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error advancing to Medical Itinerary.';
      showToast(msg);
    } finally {
      setAdvancing(false);
    }
  };

  const isAccepted = caseRecord.hospital_accepted;
  const isDeclined = caseRecord.hospital_declined;
  const isSent = caseRecord.hospitals_sent_to_patient;
  const selectedHospital = caseRecord.selected_hospital || 
    availableHospitals.find((h) => h.id === caseRecord.selected_hospital_id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Hospital Recommendations</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Stage 3
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Curate accredited hospital options with verified surgical teams and cost estimates
            </p>
          </div>
        </div>

        {/* Dynamic Status Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAccepted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Patient Selected Hospital
            </span>
          ) : isDeclined ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Revision Requested
            </span>
          ) : isSent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Awaiting Patient Choice
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
              Draft / Unsent
            </span>
          )}
        </div>
      </div>

      {/* Patient Selection Banner if Accepted */}
      {isAccepted && selectedHospital && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Patient Confirmed Hospital Choice:
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {selectedHospital.estimatedCost}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {selectedHospital.name} · <span className="text-slate-600 font-medium">{selectedHospital.location}</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {selectedHospital.description}
          </p>
        </div>
      )}

      {/* Patient Decline Banner if Revision Requested */}
      {isDeclined && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Patient Requested Alternative Hospital Choices:
          </div>
          <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-amber-200">
            &quot;{caseRecord.hospital_decline_reason || 'I would like to explore options in another city or country.'}&quot;
          </p>
          <p className="text-xs text-amber-800 font-medium">
            Select alternative hospital partners below and click &quot;Send Recommendations to Patient&quot;.
          </p>
        </div>
      )}

      {/* Hospital Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Hospitals to Offer to Patient ({selectedHospitalIds.length} Selected)
          </label>
        </div>

        {/* Hospital Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableHospitals.map((hosp) => {
            const isChecked = selectedHospitalIds.includes(hosp.id);
            const isChosenByPatient = caseRecord.selected_hospital_id === hosp.id;

            return (
              <div
                key={hosp.id}
                onClick={() => toggleHospital(hosp.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isChecked
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {hosp.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{hosp.location}</span>
                        {hosp.rating && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {hosp.rating}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
                    {hosp.estimatedCost}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-2.5 pl-6">
                  {hosp.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-3 pl-6">
                  {hosp.accreditation && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      {hosp.accreditation}
                    </span>
                  )}
                  {hosp.specialties?.slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                  {isChosenByPatient && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      ✓ Patient Pick
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supplementary Documents for Hospital Recommendations */}
      <StageDocumentAttachment
        caseRecord={caseRecord}
        stage="Hospital Recommendation"
        title="Hospital Recommendation Documents"
        description="Attach official hospital cost quotes, treatment brochures, surgeon credentials, or accreditation certificates to supplement your recommendations."
        onUpdateCase={onUpdateCase}
        showToast={showToast}
      />

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          Selecting recommendations will deliver these hospital cards directly to the patient&apos;s recommendations tab.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || selectedHospitalIds.length === 0}
            onClick={handleSendRecommendations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Recommendations to Patient</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={advancing}
            onClick={handleQuickAdvance}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {advancing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Approve &amp; Advance to Itinerary</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

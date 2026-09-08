'use client';

import React, { useState } from 'react';
import { 
  Plane, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  ChevronRight, 
  Sparkles,
  Clock
} from 'lucide-react';
import { 
  PatientCase, 
  adminSetTravelDetails 
} from '@/app/lib/firebase/services';
import StageDocumentAttachment from './StageDocumentAttachment';

interface AdminTravelPreparationProps {
  caseRecord: PatientCase;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  onAdvanceStage: (nextStage: string) => Promise<void>;
}

const TEMPLATES = {
  commercial: `• Outbound Flight: Emirates EK 542 · London (LHR) → Chennai (MAA)
  - Departure: 14:15 · Arrival: 04:30 (+1 day)
  - Class: Premium Economy (Extra Legroom requested)
  - Assistance: Meet & Assist + Wheelchair requested at all transit points

• Airport Arrival Ground Logistics:
  - Private air-conditioned VIP medical transit sedan waiting at Arrival Gate 4
  - Dedicated bilingual ground host: Mr. Anand (+91 98401 23456)
  - Baggage claim & customs fast-track expedited by airport authority
  - Destination: Apollo Executive Medical Suite (25 mins transit)

• Dedicated Logistics Hotline:
  - Marcus Chen (Logistics Coordinator): +44 20 7946 0912
  - Chennai On-Site Helpdesk: +91 44 2829 0200`,

  ambulance: `• Non-Emergency Stretcher Transfer Flight:
  - Airline: Qatar Airways QR 812 · Frankfurt (FRA) → Bangkok (BKK)
  - Medical Escort: Flight Nurse accompaniment throughout flight
  - Oxygen Supply & IV infusion certified for cabin transit

• Ground Transfer to Bumrungrad Hospital:
  - Level-2 Advanced Life Support Ambulance at tarmac/jetbridge
  - Direct hospital admitting pavilion escort with physician handoff
  - Driver & Paramedic Team Lead: Somchai P. (+66 81 234 5678)

• 24/7 International Emergency Response:
  - Global Operations Center: +1 800 555 0199`,
};

export default function AdminTravelPreparation({
  caseRecord,
  onUpdateCase,
  showToast,
  onAdvanceStage,
}: AdminTravelPreparationProps) {
  const [flightText, setFlightText] = useState<string>(
    caseRecord.flight_details || TEMPLATES.commercial
  );
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const isConfirmed = caseRecord.confirmed_by_patient;
  const isDeclined = caseRecord.travel_declined;
  const isSent = caseRecord.travel_sent_to_patient;

  const handleSendAndAdvance = async () => {
    if (!flightText.trim()) {
      showToast('Please enter flight and travel details.');
      return;
    }
    setSaving(true);
    try {
      await adminSetTravelDetails(caseRecord.id, flightText.trim());
      onUpdateCase({
        flight_details: flightText.trim(),
        travel_sent_to_patient: true,
        confirmed_by_patient: false,
        travel_declined: false,
        travel_decline_reason: '',
      });
      await onAdvanceStage('Treatment & Recovery');
      showToast('Travel & flight plan published & stage advanced to Treatment & Recovery.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending travel details.';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Travel &amp; Flight Logistics</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Stage 6
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Coordinate flights, tarmac pickup, baggage assistance, and arrival gate meet-and-greet
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Patient Confirmed Travel
            </span>
          ) : isDeclined ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Adjustments Requested
            </span>
          ) : isSent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Awaiting Patient Confirmation
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
              Draft / Unsent
            </span>
          )}
        </div>
      </div>

      {/* Decline alert if patient requested modification */}
      {isDeclined && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Patient Travel Adjustment Request:
          </div>
          <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-amber-200">
            &quot;{caseRecord.travel_decline_reason || 'Please adjust flight departure time or ground pickup details.'}&quot;
          </p>
          <p className="text-xs text-amber-800 font-medium">
            Update the logistics manifest below and re-send to the patient.
          </p>
        </div>
      )}

      {/* Template buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Load Quick Logistics Templates</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFlightText(TEMPLATES.commercial)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            VIP Commercial Flight &amp; Ground Sedan
          </button>
          <button
            type="button"
            onClick={() => setFlightText(TEMPLATES.ambulance)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            Medical Escort &amp; Direct ALS Ambulance
          </button>
        </div>
      </div>

      {/* Editor textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Flight &amp; Ground Logistics Plan (Visible to Patient)
        </label>
        <textarea
          rows={10}
          value={flightText}
          onChange={(e) => setFlightText(e.target.value)}
          placeholder="Enter flight schedule, terminal meeting instructions, driver contact, emergency logistics numbers..."
          className="w-full p-4 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-y shadow-2xs leading-relaxed"
        />
      </div>

      {/* Supplementary Documents for Travel Preparation */}
      <StageDocumentAttachment
        caseRecord={caseRecord}
        stage="Travel Preparation"
        title="Travel & Flight Documents"
        description="Attach flight e-tickets, airport transfer vouchers, medical escort passes, or fit-to-fly clearance forms."
        onUpdateCase={onUpdateCase}
        showToast={showToast}
      />

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          Once confirmed, this activates the active hospital Treatment &amp; Recovery phase.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving || !flightText.trim()}
            onClick={handleSendAndAdvance}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending &amp; Advancing Stage...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Travel Plan &amp; Advance Stage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

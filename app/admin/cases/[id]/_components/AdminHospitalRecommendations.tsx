'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Send,
  FileText,
  Search,
  Check,
  Filter,
  XCircle,
  RefreshCw,
  ExternalLink
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
  const [recommendationNotes, setRecommendationNotes] = useState<string>(
    caseRecord.recommendation_notes || ''
  );
  const [selectedHospitals, setSelectedHospitals] = useState<Hospital[]>(
    caseRecord.recommended_hospitals || []
  );
  const [catalogueHospitals, setCatalogueHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Synchronize when caseRecord updates externally
  useEffect(() => {
    if (caseRecord.recommendation_notes !== undefined && caseRecord.recommendation_notes !== null) {
      setRecommendationNotes(caseRecord.recommendation_notes);
    }
    if (caseRecord.recommended_hospitals) {
      setSelectedHospitals(caseRecord.recommended_hospitals);
    }
  }, [caseRecord.recommendation_notes, caseRecord.recommended_hospitals]);

  // Load hospital catalogue from the directory/listings
  useEffect(() => {
    async function loadCatalogue() {
      setLoading(true);
      try {
        const list = await getHospitals();
        setCatalogueHospitals(list);
      } catch (err) {
        console.error('Error loading hospital catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  // Compute available specialties for quick filter
  const allSpecialties = React.useMemo(() => {
    const set = new Set<string>();
    catalogueHospitals.forEach((h) => {
      (h.specialties || []).forEach((s) => set.add(s));
    });
    return ['All', ...Array.from(set)];
  }, [catalogueHospitals]);

  // Filter catalogue by search query and specialty
  const filteredCatalogue = React.useMemo(() => {
    return catalogueHospitals.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.location && h.location.toLowerCase().includes(q)) ||
        (h.country && h.country.toLowerCase().includes(q)) ||
        (h.specialties && h.specialties.some((s) => s.toLowerCase().includes(q))) ||
        (h.description && h.description.toLowerCase().includes(q));

      const matchesSpecialty = 
        selectedSpecialty === 'All' ||
        (h.specialties && h.specialties.includes(selectedSpecialty));

      return matchesQuery && matchesSpecialty;
    });
  }, [catalogueHospitals, searchQuery, selectedSpecialty]);

  const toggleSelectHospital = (hospital: Hospital) => {
    const isSelected = selectedHospitals.some((h) => h.id === hospital.id);
    if (isSelected) {
      setSelectedHospitals((prev) => prev.filter((h) => h.id !== hospital.id));
    } else {
      setSelectedHospitals((prev) => [...prev, hospital]);
    }
  };

  const handleSendAndAdvance = async () => {
    if (selectedHospitals.length === 0 && !recommendationNotes.trim()) {
      showToast('Please select at least one hospital from the catalogue or enter recommendation notes.');
      return;
    }

    setAdvancing(true);
    try {
      await adminSetRecommendedHospitals(
        caseRecord.id,
        selectedHospitals,
        recommendationNotes.trim()
      );
      onUpdateCase({
        recommended_hospitals: selectedHospitals,
        recommendation_notes: recommendationNotes.trim()
      });
      await onAdvanceStage('Hospital Recommendation');
      showToast('Hospital recommendations & review sent to patient and stage advanced!');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to advance stage.');
    } finally {
      setAdvancing(false);
    }
  };

  const isSent = (caseRecord.recommended_hospitals && caseRecord.recommended_hospitals.length > 0) || !!caseRecord.recommendation_notes;
  const isSelectedByPatient = !!caseRecord.selected_hospital_id;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Stage 3 · Medical Partner Matching
              </span>
              {isSent && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published to Patient
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Select Recommendations from Hospital Catalogue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose accredited partner hospitals from the network listings to recommend for this case.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={advancing || saving || (selectedHospitals.length === 0 && !recommendationNotes.trim())}
              onClick={handleSendAndAdvance}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {advancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting &amp; Advancing Stage...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Review &amp; Advance Stage
                </>
              )}
            </button>
          </div>
        </div>

        {/* Patient Status Badges */}
        {isSelectedByPatient && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Patient confirmed choice: <strong className="text-emerald-950 underline">{caseRecord.selected_hospital?.name || caseRecord.selected_hospital_id}</strong>
            </span>
          </div>
        )}

        {caseRecord.hospital_declined && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Patient requested alternative recommendations</p>
              {caseRecord.hospital_decline_reason && (
                <p className="mt-1 text-amber-800 italic">
                  &ldquo;{caseRecord.hospital_decline_reason}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: Recommendation Notes & Guidance (Inputted text) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Coordinator Clinical Guidance &amp; Rationale
          </h4>
        </div>
        <p className="text-xs text-slate-500">
          Provide your tailored evaluation, rationale for the recommended facilities, or key treatment notes.
        </p>
        <textarea
          rows={4}
          value={recommendationNotes}
          onChange={(e) => setRecommendationNotes(e.target.value)}
          placeholder="Type clinical recommendation guidance and rationale here..."
          className="w-full p-3.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* SECTION 2: Selected Hospital Recommendations Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Selected Recommendations ({selectedHospitals.length})
            </h4>
          </div>
          {selectedHospitals.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedHospitals([])}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedHospitals.length === 0 ? (
          <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center space-y-1 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-600">
              No hospital listings selected yet
            </p>
            <p className="text-[11px] text-slate-400">
              Browse the catalogue below and tick the listings you want to recommend to this patient.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {selectedHospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{hosp.name}</h5>
                    {hosp.accreditation && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                        {hosp.accreditation}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{hosp.location || hosp.country || 'International'}</span>
                  </p>
                  {hosp.estimatedCost && (
                    <p className="text-[11px] font-bold text-slate-700">
                      Est. Cost: {hosp.estimatedCost}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleSelectHospital(hosp)}
                  className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0"
                  title="Remove from recommendations"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Hospital Catalogue / Listings Browser */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hospital Listings Catalogue
                </h4>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Partner Network Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recommendations are selected exclusively from the Partner Network catalogue. Click cards below to select.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalogue..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Refresh catalogue */}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const list = await getHospitals();
                    setCatalogueHospitals(list);
                    showToast('Hospital catalogue refreshed from Partner Network.');
                  } catch {
                    showToast('Failed to refresh catalogue.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 bg-white transition-colors cursor-pointer shrink-0"
                title="Refresh Hospital Catalogue from Partner Network"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Partner Network Page Link */}
              <a
                href="/admin/partner-network"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-blue-200/60"
                title="Open Partner Network Manager to add or edit hospitals"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Manage Catalogue</span>
              </a>
            </div>
          </div>

          {/* Specialty Filter Chips */}
          {allSpecialties.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {allSpecialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    selectedSpecialty === spec
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Catalogue Cards Grid */}
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Loading hospital catalogue...
          </div>
        ) : filteredCatalogue.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            No hospital listings match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalogue.map((hosp) => {
              const isSelected = selectedHospitals.some((h) => h.id === hosp.id);
              return (
                <div
                  key={hosp.id}
                  onClick={() => toggleSelectHospital(hosp)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {hosp.accreditation && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mb-1">
                            <ShieldCheck className="w-3 h-3" /> {hosp.accreditation}
                          </span>
                        )}
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">{hosp.name}</h5>
                        {hosp.location && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {hosp.location}
                          </p>
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {hosp.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {hosp.description}
                      </p>
                    )}

                    {hosp.specialties && hosp.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {hosp.specialties.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {hosp.estimatedCost ? `Est. ${hosp.estimatedCost}` : 'Pricing on request'}
                    </span>
                    <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                      {isSelected ? '✓ Selected' : '+ Select Listing'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: Supplementary Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <StageDocumentAttachment
          caseRecord={caseRecord}
          stage="Hospital Recommendation"
          title="Hospital Recommendation Supplementary Documents"
          description="Attach hospital price quotes, procedure brochures, or credential dossiers to accompany the recommended options."
          onUpdateCase={onUpdateCase}
          showToast={showToast}
        />
      </div>
    </div>
  );
}

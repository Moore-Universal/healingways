'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Award, 
  DollarSign, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Loader2,
  X
} from 'lucide-react';
import { 
  Hospital, 
  getHospitals, 
  addHospital, 
  deleteHospital 
} from '@/app/lib/firebase/services';

export default function PartnerNetworkPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [accreditation, setAccreditation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/images/hospital-one.avif');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error('Error loading hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      showToast('Hospital Name and Location are required.');
      return;
    }

    setSaving(true);
    try {
      const newHospitalData: Omit<Hospital, 'id'> = {
        name: name.trim(),
        location: location.trim(),
        country: country.trim() || 'International',
        specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
        description: description.trim() || 'Premier healthcare partner center.',
        rating: 4.9,
        accreditation: accreditation.trim() || 'JCI Accredited',
        estimatedCost: estimatedCost.trim() || '$5,000 - $9,000',
        imageUrl: imageUrl.trim() || '/images/hospital-one.avif',
      };

      const newId = await addHospital(newHospitalData);
      setHospitals((prev) => [{ id: newId, ...newHospitalData }, ...prev]);
      setShowAddModal(false);
      setName('');
      setLocation('');
      setCountry('');
      setSpecialties('');
      setEstimatedCost('');
      setAccreditation('');
      setDescription('');
      showToast(`Successfully added "${newHospitalData.name}" to the live hospital catalogue!`);
    } catch (err) {
      console.error('Error adding hospital:', err);
      showToast('Failed to add hospital. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, hospName: string) => {
    if (!confirm(`Are you sure you want to remove "${hospName}" from the catalogue?`)) return;
    try {
      await deleteHospital(id);
      setHospitals((prev) => prev.filter((h) => h.id !== id));
      showToast(`Removed "${hospName}" from catalogue.`);
    } catch (err) {
      console.error('Error deleting hospital:', err);
      showToast('Failed to delete hospital.');
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      (h.location && h.location.toLowerCase().includes(q)) ||
      (h.country && h.country.toLowerCase().includes(q)) ||
      (h.specialties && h.specialties.some((s) => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
              Hospital Partners &amp; Catalogue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {hospitals.length} Partners
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Manage the global hospital network. All entries here are available for case managers to recommend in patient treatment journeys.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Hospital to Catalogue</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospitals by name, city, country, or clinical specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Hospitals Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No results match "${searchQuery}".` : 'No hospital partners in catalogue yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all group"
            >
              <div>
                {/* Image Container */}
                <div className="relative w-full h-44 bg-slate-100 border-b border-slate-100">
                  <Image
                    src={hospital.imageUrl || '/images/hospital-one.avif'}
                    alt={hospital.name}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{hospital.rating || 4.9}</span>
                  </div>
                </div>

                {/* Details Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hospital.location}</span>
                    </div>
                  </div>

                  {hospital.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {hospital.description}
                    </p>
                  )}

                  {/* Specialties Badges */}
                  {hospital.specialties && hospital.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hospital.specialties.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {hospital.specialties.length > 4 && (
                        <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          +{hospital.specialties.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cost & Accreditation */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{hospital.estimatedCost || 'Custom Quote'}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {hospital.accreditation || 'Accredited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-50">
                <span className="text-[10px] font-mono text-slate-400">ID: {hospital.id}</span>
                <button
                  onClick={() => handleDelete(hospital.id, hospital.name)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove from catalogue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Partner Hospital</h3>
                  <p className="text-xs text-slate-500">Add a verified hospital to the active catalogue</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHospital} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Hospitals International"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai, Tamil Nadu"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Accreditation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JCI & NABH Accredited"
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estimated Cost Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $5,500 - $8,200"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Clinical Specialties (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Oncology, Organ Transplant, Robotic Surgery"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Clinical Overview &amp; Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about surgical suites, ICU capacity, international desk..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Image Preview Path / URL
                  </label>
                  <input
                    type="text"
                    placeholder="/images/hospital-one.avif"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Catalogue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

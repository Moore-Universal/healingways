'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Accommodation, getAccommodations, deleteAccommodation, addAccommodation } from '@/app/lib/firebase/services';

export default function AccommodationPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAccom: Omit<Accommodation, 'id'> = {
      image: formData.get('image') as string,
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
      description: formData.get('description') as string,
      proximity: formData.get('proximity') as string,
      features: (formData.get('features') as string).split(',').map(f => f.trim()),
      price: formData.get('price') as string,
      pricePeriod: formData.get('pricePeriod') as string,
    };
    try {
      const id = await addAccommodation(newAccom);
      setAccommodations(prev => [...prev, { ...newAccom, id }]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding accommodation:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAccommodations();
        setAccommodations(data);
      } catch (err) {
        console.error('Error loading accommodations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteAccommodation(id);
      setAccommodations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting accommodation:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 leading-tight">
            Accommodation & Housing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manage the housing catalog near partner hospitals.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors w-full sm:w-auto shrink-0 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Accommodation Listing
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="font-bold text-lg">Add New Listing</h3>
            <input name="title" placeholder="Title" required className="w-full p-2 border rounded" />
            <input name="location" placeholder="Location" required className="w-full p-2 border rounded" />
            <input name="image" placeholder="Image URL" required className="w-full p-2 border rounded" />
            <input name="tags" placeholder="Tags (comma-separated)" required className="w-full p-2 border rounded" />
            <input name="description" placeholder="Description" required className="w-full p-2 border rounded" />
            <input name="proximity" placeholder="Proximity" required className="w-full p-2 border rounded" />
            <input name="features" placeholder="Features (comma-separated)" required className="w-full p-2 border rounded" />
            <input name="price" placeholder="Price (e.g., $85)" required className="w-full p-2 border rounded" />
            <input name="pricePeriod" placeholder="Price Period (e.g., /night)" required className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Add Listing</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accommodations.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative h-44 sm:h-48 w-full bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{item.proximity}</span>
                  </div>
                  {item.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-5 pt-0 space-y-3">
                <div className="text-sm">
                  <span className="font-bold text-emerald-600 text-base sm:text-lg">{item.price}</span>
                  <span className="text-xs font-semibold text-slate-500 ml-0.5">{item.pricePeriod}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3 ml-auto sm:ml-0">
                    <button className="text-xs font-semibold text-blue-900 hover:text-blue-700 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { getUserCases, updatePatientCase, PatientCase } from '@/app/lib/firebase/services';
import { Loader2 } from 'lucide-react';

export default function BillingPage() {
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCase() {
      setLoading(true);
      try {
        const cases = await getUserCases();
        if (cases && cases.length > 0) {
          // Use the first case as the active one
          setActiveCase(cases[0]);
        }
      } catch (err) {
        console.error('Error loading billing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, []);

  const handlePay = async () => {
    if (!activeCase) return;
    try {
      await updatePatientCase(activeCase.id, {
        billing_paid: 300,
        billing_outstanding: 0,
      });
      setActiveCase({ ...activeCase, billing_paid: 300, billing_outstanding: 0 });
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Payment failed.');
    }
  };

  if (loading) return <div className="p-6"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const isPaid = activeCase?.billing_paid === 300;

  return (
    <div className="p-6 sm:p-10 max-w-7xl space-y-6">
      <Header title="Billing & Payments" />
      
      <div>
        <h2 className="text-2xl font-bold text-blue-900">Billing & Payments</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pay for services individually as they become part of your journey — before you arrive for treatment.
        </p>
      </div>

      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs sm:text-sm text-slate-600">
        <strong className="text-blue-900 font-semibold">Medical consultations are always free of charge.</strong> The items below are billed separately as they become relevant to your case.
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-blue-900">HW Service Charge</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
            {isPaid ? 'Paid' : 'Outstanding'}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          This covers all support services we provide for patients throughout their medical journey. T&C apply.
        </p>
        <p className="text-base font-bold text-blue-900">$300 USD</p>
        {!isPaid && (
          <button 
            onClick={handlePay}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Pay Now (Simulated)
          </button>
        )}
      </div>
    </div>
  );
}

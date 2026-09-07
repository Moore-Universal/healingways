'use client';

import React, { useState, useEffect } from 'react';
import { PatientCase, getAllCasesForAdmin } from '@/app/lib/firebase/services';
import { Loader2, DollarSign } from 'lucide-react';

export default function AdminBillingPage() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      try {
        const allCases = await getAllCasesForAdmin();
        setCases(allCases);
      } catch (err) {
        console.error('Error loading billing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  const totalRevenue = cases.reduce((sum, c) => sum + (c.billing_paid || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Billing & Payments</h2>
      
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Total Revenue Collected</p>
          <p className="text-3xl font-bold text-emerald-900">${totalRevenue}</p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">Patient</th>
                <th className="p-4 font-bold">Case ID</th>
                <th className="p-4 font-bold">Amount Paid</th>
                <th className="p-4 font-bold">Outstanding</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">{c.patient_name}</td>
                  <td className="p-4">{c.case_number}</td>
                  <td className="p-4">${c.billing_paid || 0}</td>
                  <td className="p-4">${c.billing_outstanding || 300}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.billing_outstanding === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {c.billing_outstanding === 0 ? 'Paid' : 'Outstanding'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

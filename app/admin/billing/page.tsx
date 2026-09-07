'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ArrowDownRight, 
  Receipt, 
  FileText, 
  Loader2, 
  Download,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  PatientCase, 
  getAllCasesForAdmin, 
  updatePatientCase 
} from '@/app/lib/firebase/services';

export default function AdminBillingPage() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [selectedCaseForReceipt, setSelectedCaseForReceipt] = useState<PatientCase | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadCases = async () => {
    setLoading(true);
    try {
      const allCases = await getAllCasesForAdmin();
      setCases(allCases);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Summary Metrics calculations
  const totalPaidRevenue = cases.reduce((sum, c) => {
    const isPaid = c.service_fee_paid || c.billing_paid === 300 || c.billing_outstanding === 0;
    return sum + (isPaid ? 300 : (c.billing_paid || 0));
  }, 0);

  const totalPendingReceivables = cases.reduce((sum, c) => {
    const isPaid = c.service_fee_paid || c.billing_paid === 300 || c.billing_outstanding === 0;
    return sum + (isPaid ? 0 : 300);
  }, 0);

  const paidCount = cases.filter(
    (c) => c.service_fee_paid || c.billing_paid === 300 || c.billing_outstanding === 0
  ).length;

  const pendingCount = cases.length - paidCount;

  const handleTogglePayment = async (caseItem: PatientCase) => {
    const currentPaid = caseItem.service_fee_paid || caseItem.billing_paid === 300;
    const newPaid = !currentPaid;

    setUpdatingId(caseItem.id);
    try {
      await updatePatientCase(caseItem.id, {
        service_fee_paid: newPaid,
        billing_paid: newPaid ? 300 : 0,
        billing_outstanding: newPaid ? 0 : 300,
        service_fee_paid_at: newPaid ? new Date().toISOString() : null,
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseItem.id
            ? {
                ...c,
                service_fee_paid: newPaid,
                billing_paid: newPaid ? 300 : 0,
                billing_outstanding: newPaid ? 0 : 300,
                service_fee_paid_at: newPaid ? new Date().toISOString() : undefined,
              }
            : c
        )
      );

      showToast(newPaid ? `Marked Case ${caseItem.case_number} as Paid ($300 USD)` : `Marked Case ${caseItem.case_number} as Unpaid`);
    } catch (err) {
      console.error('Error toggling payment status:', err);
      showToast('Error updating payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    const isPaid = c.service_fee_paid || c.billing_paid === 300 || c.billing_outstanding === 0;
    if (statusFilter === 'Paid' && !isPaid) return false;
    if (statusFilter === 'Pending' && isPaid) return false;

    const query = searchQuery.toLowerCase();
    return (
      (c.patient_name && c.patient_name.toLowerCase().includes(query)) ||
      (c.case_number && c.case_number.toLowerCase().includes(query)) ||
      (c.patient_email && c.patient_email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
          Billing &amp; Financial Ledger
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Centralized accounting records for the $300 USD Care Coordination Service Charge across all patient journey cases.
        </p>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            ${totalPaidRevenue.toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{paidCount} Settled Transactions</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            ${totalPendingReceivables.toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{pendingCount} Awaiting Payment</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Fixed Service Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            $300 <span className="text-xs font-semibold text-slate-500">USD / Case</span>
          </div>
          <div className="text-[11px] font-semibold text-blue-600">
            Intake &amp; Visa Care Management
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Payment Processor</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Stripe <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Simulation</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Encrypted PCI Compliant
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions by patient name, case number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['All', 'Paid', 'Pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Ledger Table */}
      {loading ? (
        <div className="flex justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Transactions Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No invoices match "${searchQuery}".` : 'No patient financial cases registered yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4">Patient &amp; Case</th>
                  <th className="p-4">Fee Breakdown</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const isPaid = c.service_fee_paid || c.billing_paid === 300 || c.billing_outstanding === 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{c.patient_name || 'Patient'}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{c.case_number || c.id}</span>
                          <span>·</span>
                          <span>{c.patient_email || 'No email'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-800">
                          Care Coordination &amp; Management Fee
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Stage: {c.workflow_stage || 'Consultation Submitted'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">$300.00 USD</div>
                        <div className="text-[11px] text-slate-500">
                          {isPaid ? 'Paid: $300.00' : 'Outstanding: $300.00'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isPaid ? 'Stripe Checkout (Visa/MC)' : 'Pending Checkout'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending ($300)</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCaseForReceipt(c)}
                            className="px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="View Invoice Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Receipt</span>
                          </button>

                          <button
                            onClick={() => handleTogglePayment(c)}
                            disabled={updatingId === c.id}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                              isPaid
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {updatingId === c.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isPaid ? (
                              <span>Mark Unpaid</span>
                            ) : (
                              <span>Mark Paid</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {selectedCaseForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Official Service Invoice Receipt
                </div>
                <h3 className="font-bold text-lg mt-0.5">HealingWays Care Management</h3>
              </div>
              <button
                onClick={() => setSelectedCaseForReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Invoice Number</span>
                <span className="font-mono font-bold text-slate-800">
                  INV-{selectedCaseForReceipt.case_number || selectedCaseForReceipt.id.substring(0, 8)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Patient Name</span>
                <span className="font-bold text-slate-800">
                  {selectedCaseForReceipt.patient_name || 'Patient'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Patient Email</span>
                <span className="font-medium text-slate-800">
                  {selectedCaseForReceipt.patient_email || 'Not provided'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Item Description</span>
                <span className="font-semibold text-slate-800 text-right">
                  Care Coordination &amp; Medical Intake Service Fee
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Payment Status</span>
                <span
                  className={`font-bold ${
                    selectedCaseForReceipt.service_fee_paid || selectedCaseForReceipt.billing_paid === 300
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {selectedCaseForReceipt.service_fee_paid || selectedCaseForReceipt.billing_paid === 300
                    ? 'PAID ($300.00 USD)'
                    : 'AWAITING PAYMENT ($300.00 USD)'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center font-bold text-base text-slate-900 border border-slate-100">
                <span>Total Charged</span>
                <span className="text-blue-900">$300.00 USD</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setSelectedCaseForReceipt(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors text-center cursor-pointer shadow-2xs"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

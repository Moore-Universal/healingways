'use client';

import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { 
  getUserActiveCase, 
  getUserCases, 
  updatePatientCase, 
  PatientCase 
} from '@/app/lib/firebase/services';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Loader2, 
  Lock, 
  Sparkles, 
  DollarSign, 
  FileText,
  AlertCircle,
  X
} from 'lucide-react';

export default function PatientBillingPage() {
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Stripe Simulation Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('Jane Doe');
  const [postalCode, setPostalCode] = useState('10001');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    async function loadBillingCase() {
      setLoading(true);
      try {
        let found = await getUserActiveCase();
        if (!found) {
          const allCases = await getUserCases();
          if (allCases.length > 0) found = allCases[0];
        }
        if (found) {
          setActiveCase(found);
          if (found.patient_name) setCardName(found.patient_name);
        }
      } catch (err) {
        console.error('Error loading patient billing info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBillingCase();
  }, []);

  const isPaid = activeCase?.service_fee_paid || activeCase?.billing_paid === 300 || activeCase?.billing_outstanding === 0;

  const handleSimulateStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    setProcessingPayment(true);
    // Simulate realistic 1.5s gateway handshake
    await new Promise((resolve) => setTimeout(resolve, 1400));

    try {
      const now = new Date().toISOString();
      await updatePatientCase(activeCase.id, {
        service_fee_paid: true,
        billing_paid: 300,
        billing_outstanding: 0,
        service_fee_paid_at: now,
      });

      const updatedCase: PatientCase = {
        ...activeCase,
        service_fee_paid: true,
        billing_paid: 300,
        billing_outstanding: 0,
        service_fee_paid_at: now,
      };

      setActiveCase(updatedCase);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowStripeModal(false);
        showToast('Payment of $300.00 USD processed successfully via Stripe!');
      }, 1200);
    } catch (err) {
      console.error('Error processing simulated payment:', err);
      showToast('Payment gateway error. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl space-y-6 font-sans">
      <Header title="Billing & Payments" />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
          Billing &amp; Payments
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Pay for care coordination and medical management services for your treatment journey.
        </p>
      </div>

      {/* Information Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-900 font-bold block mb-0.5">
            Transparent Medical Travel Billing
          </strong>
          Initial medical case evaluations and hospital quotes are always free. The standard care management service charge of $300 USD is billed once per case to cover clinical coordination, visa invitations, airport transfers, and 24/7 dedicated hospital concierge.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-16 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : !activeCase ? (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-800">No Active Case Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Submit a consultation request to start your healthcare journey and view your invoice.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Service Fee Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Case #{activeCase.case_number || activeCase.id.substring(0, 8)}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  Care Coordination &amp; Management Service Charge
                </h3>
              </div>

              <div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paid &amp; Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment Due ($300 USD)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Inclusions List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                What&apos;s Covered in Your $300 Service Charge:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Clinical Case Review &amp; Second Opinions</span>
                </li>
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hospital Selection &amp; Quote Negotiations</span>
                </li>
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official Medical Visa Invitation Letters</span>
                </li>
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24/7 Bilingual Hospital Concierge Lead</span>
                </li>
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Airport Welcome &amp; Dedicated Medical Driver</span>
                </li>
                <li className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Recovery Housing Booking Assistance</span>
                </li>
              </ul>
            </div>

            {/* Price & Action Section */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Service Fee</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                  $300.00 <span className="text-xs font-semibold text-slate-500">USD</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPaid ? (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Official Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowStripeModal(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay $300 via Stripe Simulation</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Secure Payment Information Side Card */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Encrypted Stripe Checkout</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All transactions are processed through end-to-end encrypted simulated Stripe rails. Your card information is protected with 256-bit bank-grade encryption.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Fee</span>
                  <span className="font-semibold">$300.00 USD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Processing Surcharge</span>
                  <span className="font-semibold text-emerald-600">$0.00 (Waived)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span>$300.00 USD</span>
                </div>
              </div>

              {isPaid && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Service fee has been verified and marked as settled in your case ledger.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulated Stripe Checkout Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-[#635BFF] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-base">Stripe Secure Checkout</h3>
                  <p className="text-xs text-purple-100">HealingWays Care Coordination Service</p>
                </div>
              </div>
              <button
                onClick={() => setShowStripeModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSimulateStripePayment} className="p-6 space-y-4">
              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-950">Amount to Pay</span>
                <span className="font-bold text-base text-[#635BFF]">$300.00 USD</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Cardholder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                    placeholder="e.g. Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Expires (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#635BFF] focus:outline-none text-center"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#635BFF] focus:outline-none text-center"
                      placeholder="CVC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Billing ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                    placeholder="e.g. 10001"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={processingPayment || paymentSuccess}
                  className="w-full py-3 bg-[#635BFF] hover:bg-[#5249e0] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing Payment via Stripe...</span>
                    </>
                  ) : paymentSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Authorized!</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize $300.00 USD</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Simulated Sandbox Environment · No Actual Charges</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {showReceiptModal && activeCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Payment Receipt
                </div>
                <h3 className="font-bold text-lg mt-0.5">HealingWays Care Coordination</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Receipt Ref</span>
                <span className="font-mono font-bold text-slate-800">
                  HW-RCP-{activeCase.case_number || activeCase.id.substring(0, 6)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Patient Name</span>
                <span className="font-bold text-slate-800">
                  {activeCase.patient_name || 'Patient'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Service</span>
                <span className="font-semibold text-slate-800 text-right">
                  Care Coordination &amp; Travel Intake
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Payment Status</span>
                <span className="font-bold text-emerald-600">PAID ($300.00 USD)</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Payment Rails</span>
                <span className="font-medium text-slate-800">Stripe Card Processing</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center font-bold text-base text-slate-900 border border-slate-100">
                <span>Total Settled</span>
                <span className="text-emerald-700">$300.00 USD</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
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

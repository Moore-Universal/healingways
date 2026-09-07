'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../Header';
import {
  getUserActiveCase,
  getStoredUser,
  sendChatMessage,
  subscribeToCaseMessages,
  ChatMessage,
  PatientCase,
} from '@/app/lib/firebase/services';
import { auth } from '@/app/lib/firebase/client';
import { Send, Loader2 } from 'lucide-react';

export default function MessagesPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load active case and subscribe to messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    async function init() {
      try {
        const stored = getStoredUser();
        const user = auth.currentUser;
        const uid = user?.uid || stored?.uid || null;
        const email = user?.email || stored?.email || null;
        const c = await getUserActiveCase(uid, email);

        if (!isMounted) return;

        // Fallback case ID if none active yet
        const resolvedCase = c || {
          id: 'case-amara-chukwu',
          case_number: 'HW-2026-531971',
          patient_name: stored?.fullName || 'Patient',
          coordinator_name: 'Sarah James',
        } as unknown as PatientCase;

        setActiveCase(resolvedCase);

        const primaryId = resolvedCase.id;
        const altId = resolvedCase.case_number;

        unsubscribe = subscribeToCaseMessages(
          primaryId,
          (msgs) => {
            if (isMounted) {
              setMessages(msgs);
            }
          },
          altId
        );
      } catch (err) {
        console.error('Error initializing patient messages:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || sending) return;

    const textToSend = message.trim();
    setMessage('');
    setSending(true);

    try {
      const stored = getStoredUser();
      const patientName = activeCase?.patient_name || stored?.fullName || 'Patient';
      const caseId = activeCase?.id || 'case-amara-chukwu';
      const altCaseId = activeCase?.case_number || undefined;

      await sendChatMessage({
        caseId,
        altCaseId,
        sender: 'user',
        senderName: patientName,
        senderRole: 'patient',
        text: textToSend,
      });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const coordinatorName = activeCase?.coordinator_name || 'Sarah James';
  const caseLabel = activeCase?.case_number || (activeCase?.id ? `Case ${activeCase.id}` : 'General Inquiry');

  return (
    <div className="p-6 sm:p-10 max-w-7xl">
      <Header title="Messages" />
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Messages</h2>

      <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] shadow-sm">
        {/* Left Chat List */}
        <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200/80 p-3">
          <div className="p-3 bg-white rounded-xl border-l-4 border-emerald-600 shadow-sm flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              {coordinatorName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-blue-900 truncate">{coordinatorName}</h4>
              <p className="text-[11px] text-slate-500 truncate">{caseLabel}</p>
            </div>
          </div>
        </div>

        {/* Right Active Conversation Area */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Conversation Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 shrink-0">
              <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                {coordinatorName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-900">{coordinatorName}</h3>
                <p className="text-xs text-slate-500">Patient Care Coordinator · {caseLabel}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[380px]">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No messages yet. Send a message below to start chatting with your care coordinator.
                </div>
              ) : (
                messages.map((msg) => {
                  const isPatient = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-4 space-y-1.5 shadow-2xs rounded-2xl ${
                          isPatient
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-slate-50 border border-slate-200/80 rounded-tl-none text-slate-900'
                        }`}
                      >
                        <p className="text-sm font-medium leading-relaxed break-words">
                          {msg.text}
                        </p>
                        <span
                          className={`text-[11px] font-semibold block ${
                            isPatient ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {msg.timestamp || 'Just now'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-4 shrink-0">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to care coordinator..."
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
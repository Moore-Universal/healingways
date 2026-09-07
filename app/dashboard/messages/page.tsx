'use client';

import React, { useState } from 'react';
import Header from '../Header';

export default function MessagesPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="p-6 sm:p-10 max-w-7xl">
      <Header title="Messages" />
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Messages</h2>

      <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* Left Chat List */}
        <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200/80 p-3">
          <div className="p-3 bg-white rounded-xl border-l-4 border-emerald-600 shadow-sm flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              S
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-blue-900 truncate">Sarah James</h4>
              <p className="text-[11px] text-slate-500 truncate">Visa support</p>
            </div>
          </div>
        </div>

        {/* Right Active Conversation Area */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                S
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-900">Sarah James</h3>
                <p className="text-xs text-slate-500">Patient Care Coordinator</p>
              </div>
            </div>

            {/* Message Bubble */}
            <div className="max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                Thanks for reaching out — we&apos;ve received your consultation request and will begin reviewing your case shortly.
              </p>
              <span className="text-xs font-semibold text-slate-500 block">Just now</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-6">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to care coordinator..."
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-2xs cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
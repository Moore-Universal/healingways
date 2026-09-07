'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const quickFaqs = [
  {
    id: '1',
    question: 'What is HealingWays?',
    answer:
      'HealingWays is a healthcare navigation and coordination platform that helps patients and families make confident healthcare decisions \u2014 connecting them with trusted hospitals and specialists locally and internationally, with guidance at every step.',
  },
  {
    id: '2',
    question: 'What makes HealingWays different from a medical tourism company?',
    answer:
      'HealingWays does not sell destinations. Our role is to help you understand your options, connect with suitable healthcare providers, and coordinate the practical support your journey needs \u2014 guidance and coordination, not a travel package.',
  },
  {
    id: '3',
    question: 'Does HealingWays provide medical treatment?',
    answer:
      "No. We don't diagnose, treat, or perform procedures. We work alongside qualified healthcare professionals and institutions to help you access appropriate care.",
  },
];

export default function ContactQuickFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            BEFORE YOU REACH OUT
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
            A few quick answers
          </h2>
        </div>

        {/* Quick FAQ Accordion */}
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {quickFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="py-4">
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className="text-sm font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed pr-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-left">
          <Link
            href="/faq"
            className="text-xs sm:text-sm font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
          >
            View All FAQs &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
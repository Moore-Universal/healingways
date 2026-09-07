'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const homepageFaqs = [
  {
    question: 'What is HealingWays?',
    answer:
      'HealingWays is a healthcare navigation and coordination platform that helps patients and families make confident healthcare decisions \u2014 connecting them with trusted hospitals and specialists locally and internationally, with guidance at every step.',
  },
  {
    question: 'What makes HealingWays different from a medical tourism company?',
    answer:
      'HealingWays does not sell destinations. Our role is to help you understand your options, connect with suitable healthcare providers, and coordinate the practical support your journey needs \u2014 guidance and coordination, not a travel package.',
  },
  {
    question: 'Does HealingWays provide medical treatment?',
    answer:
      "No. We don't diagnose, treat, or perform procedures. We work alongside qualified healthcare professionals and institutions to help you access appropriate care.",
  },
  {
    question: 'How do I begin my healthcare journey with HealingWays?',
    answer:
      'It starts with a consultation. You share information about your healthcare needs, and our team reviews your situation to determine how we can best support you.',
  },
  {
    question: 'Do I need to know exactly what service I need first?',
    answer:
      "Not at all. Many patients come to us unsure of where to begin \u2014 that's exactly what we help clarify.",
  },
];

export default function SectionEight() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            COMMON QUESTIONS
          </span>
          <h2 className="text-3xl font-bold text-blue-900 mt-1">
            Answers before you begin
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {homepageFaqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full flex justify-between items-center text-left focus:outline-none group cursor-pointer"
              >
                <span className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-600 transition-transform duration-200 shrink-0 ${
                    openIdx === idx ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIdx === idx && (
                <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed pr-6">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

        <div>
          <Link
            href="/faq"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            View All FAQs &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

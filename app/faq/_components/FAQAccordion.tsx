'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'About HealingWays',
    question: 'What is HealingWays?',
    answer:
      'HealingWays is a healthcare navigation and coordination platform that helps patients and families make confident healthcare decisions \u2014 connecting them with trusted hospitals and specialists locally and internationally, with guidance at every step.',
  },
  {
    id: '2',
    category: 'About HealingWays',
    question: 'What makes HealingWays different from a medical tourism company?',
    answer:
      'HealingWays does not sell destinations. Our role is to help you understand your options, connect with suitable healthcare providers, and coordinate the practical support your journey needs \u2014 guidance and coordination, not a travel package.',
  },
  {
    id: '3',
    category: 'About HealingWays',
    question: 'Does HealingWays provide medical treatment?',
    answer:
      "No. We don't diagnose, treat, or perform procedures. We work alongside qualified healthcare professionals and institutions to help you access appropriate care.",
  },
  {
    id: '4',
    category: 'Getting Started',
    question: 'How do I begin my healthcare journey with HealingWays?',
    answer:
      'It starts with a consultation. You share information about your healthcare needs, and our team reviews your situation to determine how we can best support you.',
  },
  {
    id: '5',
    category: 'Getting Started',
    question: 'Do I need to know exactly what service I need first?',
    answer:
      "Not at all. Many patients come to us unsure of where to begin \u2014 that's exactly what we help clarify.",
  },
  {
    id: '6',
    category: 'Getting Started',
    question: 'Can someone contact HealingWays on behalf of a family member?',
    answer:
      'Yes. Family members or caregivers are welcome to reach out on behalf of a patient, especially children, elderly relatives, or loved ones who need assistance.',
  },
  {
    id: '7',
    category: 'Hospitals & Specialists',
    question: 'How does HealingWays help me find the right hospital or specialist?',
    answer:
      'Our team reviews your medical information, healthcare needs, and personal preferences before guiding you toward suitable hospitals or specialists within our network.',
  },
  {
    id: '8',
    category: 'Hospitals & Specialists',
    question: 'Can I choose any hospital from your website?',
    answer:
      "HealingWays isn't a hospital directory or marketplace \u2014 we evaluate each case individually and guide you toward suitable options rather than presenting an open list to browse.",
  },
  {
    id: '9',
    category: 'International Healthcare Support',
    question: 'Does HealingWays only support treatment abroad?',
    answer:
      'No. We support patients locally and internationally \u2014 the right option depends entirely on your specific medical needs and circumstances.',
  },
  {
    id: '10',
    category: 'Hospitals & Specialists',
    question: 'Does HealingWays guarantee treatment success?',
    answer:
      'No. Medical outcomes are determined by qualified healthcare professionals and depend on many factors. We focus on helping you access suitable care and supporting you throughout.',
  },
  {
    id: '11',
    category: 'Medical Reports & Documents',
    question: 'Can HealingWays help me understand my medical reports?',
    answer:
      'Yes \u2014 we assist with translation, organization, and coordination so you can communicate effectively with healthcare providers.',
  },
  {
    id: '12',
    category: 'Medical Reports & Documents',
    question: 'What documents should I provide?',
    answer:
      "Depending on your situation: medical reports, scan results, laboratory reports, doctor letters, and treatment history. Our team will guide you on exactly what's needed.",
  },
  {
    id: '13',
    category: 'Accommodation & Logistics',
    question: 'Does HealingWays own hotels or accommodation facilities?',
    answer:
      "No. We coordinate accommodation through independent providers based on availability and your needs \u2014 we don't own or operate any properties.",
  },
  {
    id: '14',
    category: 'Accommodation & Logistics',
    question: 'What happens if my preferred accommodation is unavailable?',
    answer:
      "We'll recommend a comparable alternative offering similar services, convenience, and suitability.",
  },
  {
    id: '15',
    category: 'Visa Support',
    question: 'Does HealingWays guarantee visa approval?',
    answer:
      'No \u2014 visa decisions rest solely with immigration authorities. We provide guidance and help you prepare thorough, accurate documentation.',
  },
  {
    id: '16',
    category: 'After Treatment Support',
    question: 'Does HealingWays support patients after treatment?',
    answer:
      'Yes. Our support can continue through follow-up coordination, communication assistance, and patient advocacy during recovery.',
  },
  {
    id: '17',
    category: 'Costs & Payments',
    question: 'How much does HealingWays charge?',
    answer:
      'Costs depend on the type of support required and the complexity of your case. After reviewing your situation, our team provides clear guidance on applicable fees.',
  },
  {
    id: '18',
    category: 'Privacy & Security',
    question: 'Is my medical information secure?',
    answer:
      'Yes. Medical information is handled securely and accessed only by authorized personnel directly involved in supporting your healthcare journey.',
  },
];

export const categories = [
  'All',
  'About HealingWays',
  'Getting Started',
  'Hospitals & Specialists',
  'International Healthcare Support',
  'Medical Reports & Documents',
  'Accommodation & Logistics',
  'Visa Support',
  'After Treatment Support',
  'Costs & Payments',
  'Privacy & Security',
] as const;

interface FAQAccordionProps {
  searchQuery: string;
}

export default function FAQAccordion({ searchQuery }: FAQAccordionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFAQs = faqData.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-12 bg-slate-50 min-h-[500px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Accordion Items List */}
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="py-4 transition-colors">
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-semibold text-blue-900 group-hover:text-blue-700 transition-colors pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 pr-6 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No questions found matching your search criteria.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

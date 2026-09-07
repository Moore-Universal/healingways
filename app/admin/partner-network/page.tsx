'use client';

import React from 'react';
import Image from 'next/image';

interface PartnerHospital {
  id: string;
  name: string;
  location: string;
  tags: string[];
  accreditation: string;
  imageSrc: string;
}

const partnerHospitals: PartnerHospital[] = [
  {
    id: '1',
    name: 'Lagoon Specialist Hospital',
    location: 'Lagos, Nigeria',
    tags: ['Cardiology', 'Oncology', 'Orthopedics'],
    accreditation: 'ISO 9001 Certified',
    imageSrc: '/images/hospital-one.avif',
  },
  {
    id: '2',
    name: 'Accra Heart Institute',
    location: 'Accra, Ghana',
    tags: ['Cardiology', 'Vascular Surgery'],
    accreditation: 'National Health Accreditation',
    imageSrc: '/images/hospital-three.avif',
  },
  {
    id: '3',
    name: 'Douala General Reference Hospital',
    location: 'Douala, Cameroon',
    tags: ['General Surgery', 'Maternal Health'],
    accreditation: 'Regional Reference Center',
    imageSrc: '/images/hospital-eight.avif',
  },
  {
    id: '4',
    name: 'Kinshasa Medical Center',
    location: 'Kinshasa, DR Congo',
    tags: ['General Medicine', 'Pediatrics'],
    accreditation: 'Ministry of Health Certified',
    imageSrc: '/images/hospital-two.avif',
  },
  {
    id: '5',
    name: 'Apex Multispecialty Hospital',
    location: 'Chennai, India',
    tags: ['Oncology', 'Neurology', 'Organ Transplant'],
    accreditation: 'JCI Accredited',
    imageSrc: '/images/hospital-four.avif',
  },
  {
    id: '6',
    name: 'Raffles Specialist Medical Center',
    location: 'Bangkok, Thailand',
    tags: ['Orthopedics', 'Fertility', 'Eye Care'],
    accreditation: 'JCI Accredited',
    imageSrc: '/images/hospital-five.avif',
  },
  {
    id: '7',
    name: 'Al Noor Specialist Medical Center',
    location: 'Dubai, United Arab Emirates',
    tags: ['Cardiology', 'Orthopedics', 'Rehabilitation'],
    accreditation: 'JCI Accredited',
    imageSrc: '/images/hospital-six.avif',
  },
  {
    id: '8',
    name: 'Crescent Care Medical City',
    location: 'Riyadh, Saudi Arabia',
    tags: ['Oncology', 'Cardiology'],
    accreditation: 'CBAHI Accredited',
    imageSrc: '/images/hospital-three.avif',
  },
];

export default function PartnerNetworkPage() {
  const handleRecommend = (hospitalName: string) => {
    // Action handler for recommendation trigger
    console.log(`Recommending: ${hospitalName}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-bold text-[#1E3A8A] mb-1">Partner Network</h2>
        <p className="text-slate-500 text-sm max-w-4xl leading-relaxed">
          Browse partner hospitals. To recommend one to a patient, open their case and use &quot;Add&quot; under Hospital Recommendations — or recommend directly from here.
        </p>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {partnerHospitals.map((hospital) => (
          <div
            key={hospital.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
          >
            <div>
              {/* Image Container with Fallback handling */}
              <div className="relative w-full h-48 bg-slate-100 border-b border-slate-100">
                <Image
                  src={hospital.imageSrc}
                  alt={hospital.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Details Content */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">
                    {hospital.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {hospital.location}
                  </p>
                </div>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hospital.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-50/80 text-[#2563EB] text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Certification Label */}
                <p className="text-xs text-slate-400 font-medium pt-1">
                  {hospital.accreditation}
                </p>
              </div>
            </div>

            {/* Bottom Button Action */}
            <div className="p-5 pt-0">
              <button
                onClick={() => handleRecommend(hospital.name)}
                className="w-full border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white font-medium text-xs py-2 rounded-lg transition-colors"
              >
                Recommend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
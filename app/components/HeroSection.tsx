import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#033ca8] via-[#0444c5] to-[#012a80] text-white py-16 md:py-24 lg:py-28">
      {/* Top-left green decorative circle */}
      <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-96 sm:h-96 bg-[#34a86b] rounded-full pointer-events-none z-0" />

      {/* Bottom-right lighter blue decorative ring element */}
      <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] bg-[#1a6eff] rounded-full pointer-events-none z-0 opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Tag Badge */}
            <div>
              <span className="inline-block px-4 py-1.5 bg-white text-[#2a8a58] text-xs font-medium rounded-sm shadow-sm">
                Healthcare Navigation, Simplified
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-medium leading-[1.2] text-white tracking-tight">
              We provide specialized guidance to help you and your family make better healthcare decisions.
            </h1>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/consultation"
                id="hero-start-consultation-btn"
                className="px-6 py-3 bg-gradient-to-r from-[#44a868] to-[#2e8b50] hover:brightness-105 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                Start Consultation
              </Link>
              <Link
                href="/login"
                id="hero-patient-login-btn"
                className="px-6 py-3 bg-white hover:bg-slate-50 text-blue-900 font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                Patient Login
              </Link>
              <Link
                href="/services"
                id="hero-explore-services-btn"
                className="px-6 py-3 bg-[#e8f1ff]/20 hover:bg-[#e8f1ff]/30 text-white font-medium text-sm rounded-xl border border-white/20 transition-all flex items-center justify-center"
              >
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right Image Graphic & Tooltips */}
          <div className="lg:col-span-6 relative flex justify-center items-center mt-8 lg:mt-0">
            {/* Circular background highlight for the portrait */}
            <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] bg-[#1e75ff] rounded-full z-0 translate-y-2 sm:translate-y-4" />

            <div className="relative z-10 w-full max-w-lg flex justify-center">
              <Image
                src="/images/hero-image.png"
                alt="Patient guided by healthcare service"
                width={520}
                height={620}
                className="object-contain relative z-10 opacity-90 brightness-95"
                priority
              />

              {/* Floating Node Tag 1 (Left side) */}
              <div className="absolute left-2 sm:left-6 bottom-32 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
                <span className="text-xs text-white/90 font-light whitespace-nowrap">
                  You don't have to figure it out alone
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0" />
              </div>

              {/* Floating Node Tag 2 (Top right) */}
              <div className="absolute right-4 sm:right-0 top-40 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
                <span className="text-xs text-white/90 font-light whitespace-nowrap">
                  Healingways makes connection
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0" />
              </div>

              {/* Floating Node Tag 3 (Bottom right) */}
              <div className="absolute right-8 sm:right-14 bottom-16 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
                <span className="text-xs text-white/90 font-light whitespace-nowrap">
                  Healthcare tourism can feel impossible
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
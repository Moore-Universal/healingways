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
            {/* Background highlight glow */}
            <div className="absolute w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] bg-[#1e75ff]/80 rounded-full z-0 filter blur-2xl opacity-60" />

            <div className="relative z-10 w-full max-w-lg flex justify-center items-center">
              <Image
                src="/images/hero-image.png"
                alt="Patient guided by Healingways healthcare service"
                width={450}
                height={530}
                className="w-full h-auto max-w-[400px] object-contain relative z-10 drop-shadow-xl"
                priority
              />

              {/* Floating Node Tag 1 (Left side) */}
              <div className="absolute -left-2 sm:-left-6 bottom-24 z-20 flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  You don't have to figure it out alone
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0 animate-pulse" />
              </div>

              {/* Floating Node Tag 2 (Top right) */}
              <div className="absolute -right-2 sm:-right-6 top-8 z-20 flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  Healingways makes connection
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0 animate-pulse" />
              </div>

              {/* Floating Node Tag 3 (Bottom right) */}
              <div className="absolute right-2 sm:right-0 -bottom-4 z-20 flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  Seamless medical tourism navigation
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3cd070] shrink-0 animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
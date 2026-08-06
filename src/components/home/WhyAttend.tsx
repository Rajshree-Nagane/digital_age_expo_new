'use client';

import React from 'react';
import { TrendingUp, Users, Cpu, ShieldCheck } from 'lucide-react';

export function WhyAttend() {
  const points = [
    {
      title: "Lead Acquisition",
      description: "Connect face-to-face with technology suppliers and secure software subscriptions at exclusive expo pricing.",
      icon: TrendingUp,
    },
    {
      title: "Secure Networking",
      description: "Participate in dedicated speed-networking matches with executive directors and technology advisors.",
      icon: Users,
    },
    {
      title: "Expert Masterclasses",
      description: "Acquire verified certification and hands-on guidance on configuring neural pipelines and software contracts.",
      icon: Cpu,
    },
    {
      title: "Risk Compliance",
      description: "Attend legal panels discussing GDPR architectures, AI safety rules, and continuous corporate governance.",
      icon: ShieldCheck,
    }
  ];

  return (
    <section className="relative overflow-hidden bg-slate-900 px-6 py-20 text-white">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold font-mono text-fuchsia-400 uppercase tracking-widest block">
            MAXIMIZE YOUR ROADMAP
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Why Attend Digital Age Expo?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Four strategic milestones you will capture over our live virtual exhibition.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div 
                key={index} 
                className="group relative rounded-2xl bg-slate-950/60 p-6 border border-slate-800 hover:border-fuchsia-500/30 transition-all duration-300 hover:-translate-y-1"
                id={`why-attend-item-${index}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 group-hover:bg-fuchsia-500/20 transition-all duration-300">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wide">
                  {point.title}
                </h4>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

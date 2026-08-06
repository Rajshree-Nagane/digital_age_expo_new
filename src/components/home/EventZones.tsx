'use client';

import React from 'react';
import { Cpu, ShieldCheck, Coins, TrendingUp } from 'lucide-react';

export function EventZones() {
  const zones = [
    {
      id: 'z-ai',
      name: "Artificial Intelligence Zone",
      description: "Explore the bleeding-edge of machine learning, neural accelerators, generative transformers, and cognitive automation.",
      icon: Cpu,
    },
    {
      id: 'z-cyber',
      name: "Cyber Security & Trust",
      description: "Hardening enterprise postures with post-quantum cryptography, zero-trust architectures, and seamless audit logs.",
      icon: ShieldCheck,
    },
    {
      id: 'z-fin',
      name: "FinTech & Digital Assets",
      description: "Pioneering the future of instant corporate clearing, decentralised accounting ledgers, and secure financial assets.",
      icon: Coins,
    },
    {
      id: 'z-cloud',
      name: "Cloud & Scaling Operations",
      description: "Harnessing serverless infrastructure, global content orchestration, and real-time edge processing for modern web apps.",
      icon: TrendingUp,
    }
  ];

  return (
    <section className="bg-slate-900 px-6 py-20 text-white border-y border-slate-800">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold font-mono text-fuchsia-400 uppercase tracking-widest block">
            THE ARCHITECTURE OF INNOVATION
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Specialised Trade Zones
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Structured virtual environments to keep exhibition halls organized and perfectly navigated.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {zones.map((zone) => {
            const Icon = zone.icon;
            return (
              <div 
                key={zone.id} 
                className="group relative rounded-2xl bg-slate-950 p-6 flex flex-col justify-between h-64 border border-slate-800/80 hover:border-fuchsia-500/30 transition-all duration-300"
                id={`event-zone-${zone.id}`}
              >
                <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 w-fit rounded-xl text-fuchsia-400 group-hover:bg-fuchsia-500/20 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2 mt-6">
                  <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">
                    {zone.name}
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {zone.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

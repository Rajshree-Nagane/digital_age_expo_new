'use client';

import React, { useState } from 'react';

export function PhotoGallery() {
  const [galleryFilter, setGalleryFilter] = useState<'All' | '2025' | '2024'>('All');

  const galleryItems = [
    {
      id: 'gal-1',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600',
      caption: 'Main Keynote Session',
      year: '2025',
    },
    {
      id: 'gal-2',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600',
      caption: 'Live Q&A Technical Panels',
      year: '2025',
    },
    {
      id: 'gal-3',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600',
      caption: 'Virtual Lobby Networking',
      year: '2024',
    },
    {
      id: 'gal-4',
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600',
      caption: 'Developer Workshop Hack',
      year: '2024',
    }
  ];

  const filteredGallery = galleryFilter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.year === galleryFilter);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-4">
        <span className="text-xs font-bold font-mono text-brand-pink uppercase tracking-widest block">
          THE LIVE ARCHIVE
        </span>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          Expo Gallery & Highlights
        </h2>
      </div>

      {/* Filters */}
      <div className="flex justify-center flex-wrap gap-3">
        {(['All', '2025', '2024'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setGalleryFilter(filter)}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
              galleryFilter === filter 
                ? 'btn-brand-gradient text-white shadow-lg' 
                : 'bg-zinc-900 text-zinc-400 border border-white/10 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {filter} Showcase
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
        {filteredGallery.map((item) => (
          <div 
            key={item.id} 
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 h-52 transition-all duration-350 hover:border-brand-pink/50 shadow-md hover:shadow-brand-pink/10 hover:scale-[1.02]"
            id={`gallery-item-${item.id}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={item.imageUrl} 
              alt={item.caption} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono text-brand-pink uppercase">
                  {item.year} Showcase
                </span>
                <p className="text-xs font-extrabold text-white uppercase tracking-wider">
                  {item.caption}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

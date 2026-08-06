'use client';

import React from 'react';

export function BlogsAndNews() {
  const defaultBlogs = [
    {
      id: "blog-1",
      title: "The Zero-Trust Operational Roadmap for Enterprise Scale",
      excerpt: "Unpacking zero-trust schemas, cryptographic policy layers, and deep API resource isolation strategies that are defining corporate standard roadmaps for 2026.",
      category: "CYBER SECURITY",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400",
      author: "DANIEL CROFT",
      publishedAt: "2026-07-20",
    },
    {
      id: "blog-2",
      title: "Pioneering the Post-Quantum Cryptographic Compliance Era",
      excerpt: "NIST's upcoming quantum-resistant algorithm deadlines demand proactive infrastructure updates. Learn how to audit, swap, and verify legacy key structures safely.",
      category: "COMPLIANCE",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400",
      author: "DR. ARIA CHEN",
      publishedAt: "2026-07-18",
    },
    {
      id: "blog-3",
      title: "Architecting Generative AI Agents for Secure Workflows",
      excerpt: "How leading technical firms are establishing local inference pipelines and secure sandboxed environments to leverage large models without leaking proprietary IP.",
      category: "ARTIFICIAL INTELLIGENCE",
      imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400",
      author: "MARCUS VANCE",
      publishedAt: "2026-07-15",
    }
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-4">
        <span className="text-xs font-bold font-mono text-brand-pink uppercase tracking-widest block">
          EXPO RESEARCH
        </span>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          Latest Technical Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {defaultBlogs.map((blog) => (
          <div 
            key={blog.id} 
            className="group rounded-2xl overflow-hidden flex flex-col justify-between h-[430px] p-5 glass-panel transition-all duration-350 hover:border-brand-pink/50 hover:shadow-lg hover:shadow-brand-pink/10 animate-fade-in"
            id={`blog-card-${blog.id}`}
          >
            <div className="h-44 rounded-xl overflow-hidden bg-surface-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={blog.imageUrl} 
                alt={blog.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <span className="absolute bottom-3 left-3 rounded-md bg-surface-1/90 border border-white/10 px-3 py-1 text-[9px] font-bold font-mono tracking-widest text-brand-pink uppercase">
                {blog.category}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-between mt-5">
              <div className="space-y-2">
                <h4 className="font-extrabold text-white text-sm line-clamp-2 leading-snug uppercase tracking-wide">
                  {blog.title}
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                  {blog.excerpt}
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] text-zinc-500 font-mono flex justify-between items-center uppercase tracking-wider mt-4">
                <span>BY: <span className="text-zinc-300 font-semibold">{blog.author}</span></span>
                <span>{new Date(blog.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

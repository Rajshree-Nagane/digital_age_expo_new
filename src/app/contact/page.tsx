import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import { ContactForm } from "@/components/contact/ContactForm";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Calendar } from "lucide-react";
import { staticAssetUrl } from "@/lib/assets";

export const metadata = {
  title: "Contact Us - Digital Age Expo 2026",
};

export default async function ContactPage() {
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Visual Cover Hero Section */}
      <div id="contact_hero" className="relative w-full min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center py-20 px-4 sm:px-6">
        {/* Background Image Wrapper */}
        <div className="absolute inset-0 z-0">
          <Image
            src={staticAssetUrl("https://digitalageexpo.com/files/listing_pages/817601-CONTACT_IMAGE.jpg")}
            alt="Contact Us Cover"
            fill
            priority
            className="object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-indigo-950/80 z-10" />
        </div>

        {/* Floating Semi-Transparent Black Card as requested */}
        <div className="relative z-20 max-w-4xl w-full mx-auto bg-black/75 backdrop-blur-md border border-white/15 p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-fuchsia-600/20 border border-fuchsia-500/30 rounded-full text-fuchsia-400 text-xs font-black uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" /> 26th - 28th August 2026
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            DIGITAL AGE EXPO 26TH - 28TH AUGUST 2026 | VIRTUAL EVENT
          </h2>
          <p className="text-slate-300 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            26 to 28 August 2026, Online Virtual Event
          </p>
        </div>
      </div>

      {/* Main Form & Event Metadata Details */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 -mt-10 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Structured Contact Form Container */}
          <div className="lg:col-span-8">
            <ContactForm />
          </div>

          {/* Right Side: Contact Details & Info Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="text-md font-black uppercase tracking-wide border-b border-white/5 pb-2 text-white">
                Contact Information
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you are looking to secure a stand, submit a seminar proposal, or need technical assistance regarding virtual booths, our support staff is available.
              </p>

              <div className="space-y-4 pt-2">
                {event?.email && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email Address</div>
                      <a href={`mailto:${event.email}`} className="text-white hover:text-pink-400 transition font-medium mt-0.5 block break-all">
                        {event.email}
                      </a>
                    </div>
                  </div>
                )}

                {event?.phone && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Call Support</div>
                      <a href={`tel:${event.phone}`} className="text-white hover:text-pink-400 transition font-medium mt-0.5 block">
                        {event.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Venue Location</div>
                    <p className="text-white font-medium mt-0.5">
                      Online Virtual Platform &amp; Broadcasting Studio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Working Hours</div>
                    <p className="text-white font-medium mt-0.5">
                      Mon - Fri: 09:00 AM - 05:00 PM BST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helper card */}
            <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-3xl p-6 text-xs space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-indigo-300">Fast Resolution</h4>
              <p className="text-slate-400 leading-relaxed">
                Most enquiries are resolved within 2 hours during normal broadcasting periods. We appreciate your participation in Digital Age Expo 2026.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

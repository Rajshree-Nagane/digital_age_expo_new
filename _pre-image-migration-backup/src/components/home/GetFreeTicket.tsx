import Link from "next/link";

interface Props {
  title?: string;
  description?: string;
}

export function GetFreeTicket({ title, description }: Props) {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-center text-white">
      {/* Background Video with Dark Overlay */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="https://digitalageexpo.com/images/maxresdefault.jpg"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      >
        <source src="https://digitalageexpo.com/images/get_ticket.mp4" type="video/mp4" />
      </video>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/80 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl text-white drop-shadow-md">
          {title || "Get Entry Ticket Now!"}
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-200 font-medium leading-relaxed drop-shadow-sm">
          {description ||
            "Experience the conference wherever you are. Register now for online access. Tune in live for the keynotes and watch sessions on demand. Also be sure to join our event."}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/free-ticket"
            className="btn-brand-gradient rounded-full px-8 py-3.5 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Get Free Ticket
          </Link>
          <Link
            href="/exhibitor-registration"
            className="btn-outline-animated rounded-full bg-white/10 px-8 py-3.5 font-bold text-white ring-1 ring-white/30 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            Book Your Stand
          </Link>
        </div>
      </div>
    </section>
  );
}


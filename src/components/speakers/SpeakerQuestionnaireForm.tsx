"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic, Trash2, Plus, Sparkles,
  CheckCircle, ArrowRight,
} from "lucide-react";

interface Session {
  id: string;
  room_type: string;
  preferred_date: string;
  agenda_id: string;
  preferred_time: string;
  talk_duration: string;
  title: string;
  topic_description: string;
}

interface VenueOption {
  id: number;
  title: string;
}

interface InitialValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  description: string;
}

interface Submission {
  id: number;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  topic_description: string | null;
  speaker_group: string | null;
  created_on: string | null;
}

interface Props {
  speakerId: number;
  initialValues: InitialValues;
  venues: VenueOption[];
  dateOptions: string[];
}

const ROOM_TYPE_OPTIONS = [
  { value: "AGTYPEBBW", label: "Brand Discovery Talk Show" },
  { value: "AGTYPESW", label: "Seminar / Webinar" },
  { value: "AGTYPELW", label: "Live Workshop & Masterclasses" },
  { value: "AGTYPETT", label: "Ted Talk" },
  { value: "AGTYPEKF", label: "Keynote Forum" },
  { value: "AGTYPEVS", label: "VIP Session" },
  { value: "AGTYPEBT", label: "Business Theatre" },
];

const TIME_SLOT_OPTIONS = [
  "10:00 - 10:45",
  "11:00 - 11:45",
  "12:00 - 12:45",
  "14:00 - 14:45",
  "15:00 - 15:45",
  "16:00 - 16:45",
];

function emptySession(idSuffix: string, defaultDate: string): Session {
  return {
    id: idSuffix,
    room_type: "",
    preferred_date: defaultDate,
    agenda_id: "",
    preferred_time: "",
    talk_duration: "",
    title: "",
    topic_description: "",
  };
}

export function SpeakerQuestionnaireForm({ speakerId, initialValues, venues, dateOptions }: Props) {
  const defaultDate = dateOptions[0] ?? "";

  const [firstName, setFirstName] = useState(initialValues.first_name);
  const [lastName, setLastName] = useState(initialValues.last_name);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [description, setDescription] = useState(initialValues.description);

  const [sessions, setSessions] = useState<Session[]>([emptySession("session_1", defaultDate)]);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const res = await fetch(`/api/speaker-questionaire?speaker_id=${speakerId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSession = () => {
    setSessions([...sessions, emptySession(`session_${Date.now()}`, defaultDate)]);
  };

  const handleRemoveSession = (id: string) => {
    if (sessions.length === 1) {
      alert("You must include at least one speaking session.");
      return;
    }
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const handleUpdateSession = (id: string, field: keyof Session, value: string) => {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName || !lastName || !email || !description) {
      setErrorMsg("Please complete all required fields in the Profile Description.");
      return;
    }

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.title || !s.preferred_date || !s.preferred_time) {
        setErrorMsg(`Please complete the required fields (Topic, Preferred Date, and Time Slot) for Session ${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/speaker-questionaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker_id: speakerId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          description,
          sessions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Something went wrong saving the questionnaire."
        );
      }

      setSubmittedId(data.id ?? 0);
      fetchSubmissions();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit questionnaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoomTypeName = (val: string | null) => {
    const found = ROOM_TYPE_OPTIONS.find((r) => r.value === val);
    return found?.label || val || "Not selected";
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen pb-24">
      {/* Dynamic Grid Header */}
      <div className="bg-indigo-950 relative overflow-hidden py-20 px-6 border-b border-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--color-brand-pink-rgb), 0.15),transparent)] pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-xs font-black uppercase tracking-widest">
            <Mic className="w-3 h-3" /> Speakers Questionnaire
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            Speakers <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-fuchsia-400">Questionnaire</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Please complete your speaking profile, biography, session outline, and preferred slots.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Side: Interactive Questionnaire Form */}
          <div className="lg:col-span-8">
            {submittedId !== null ? (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-4xl font-bold">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Questionnaire Submitted!</h3>
                  <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
                    Your details have been saved against your speaker profile. Our team will review your session
                    requests and confirm your final slot.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-left max-w-md mx-auto space-y-2 font-mono text-xs">
                  <div className="text-slate-400">Speaker ID: <span className="text-pink-400">{speakerId}</span></div>
                  <div className="text-slate-400">Name: <span className="text-white">{firstName} {lastName}</span></div>
                  <div className="text-slate-400">Email: <span className="text-white">{email}</span></div>
                  <div className="text-slate-400">Sessions Logged: <span className="text-white">{sessions.length}</span></div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setSubmittedId(null)}
                    className="btn-brand-gradient px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg"
                  >
                    Update My Submission
                  </button>
                  <Link
                    href="/event_experience"
                    className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-white border border-white/10 transition text-center"
                  >
                    Back to Event Experience
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
                {/* Section 1: Profile Description */}
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                      <span className="w-7 h-7 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center text-xs">1</span>
                      Profile Description
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Provide your general details and biography for the show guide.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">First Name *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                        placeholder="e.g. Jane"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                        placeholder="e.g. Smith"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                        placeholder="jane.smith@company.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">Phone / Mobile</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                        placeholder="+44 7123 456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">Profile Description / Biography *</label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                      placeholder="Write a brief professional summary about yourself, your career, and expertise..."
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Want to update your profile picture? Email it to our team after submitting and we&apos;ll add it to your speaker profile.
                  </p>
                </div>

                {/* Section 2: Speaker Role Details */}
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                        <span className="w-7 h-7 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center text-xs">2</span>
                        Speaker Role &amp; Session Details
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">You can submit details for one or multiple dynamic sessions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSession}
                      className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Session
                    </button>
                  </div>

                  <div className="space-y-8">
                    {sessions.map((session, index) => (
                      <div key={session.id} className="bg-slate-950/60 rounded-2xl border border-white/5 p-6 relative space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-pink-400" /> Session #{index + 1} Details
                          </span>
                          {sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSession(session.id)}
                              className="p-1.5 hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition"
                              title="Delete Session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-300">Speaking Type</label>
                            <select
                              value={session.room_type}
                              onChange={(e) => handleUpdateSession(session.id, "room_type", e.target.value)}
                              className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:outline-none text-sm"
                            >
                              <option value="">Select Room / Venue Category</option>
                              {ROOM_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-300">Preferred Date *</label>
                            <select
                              value={session.preferred_date}
                              onChange={(e) => handleUpdateSession(session.id, "preferred_date", e.target.value)}
                              className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:outline-none text-sm"
                            >
                              {dateOptions.length === 0 && <option value="">No event dates configured</option>}
                              {dateOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-300">Venue / Location</label>
                            <select
                              value={session.agenda_id}
                              onChange={(e) => handleUpdateSession(session.id, "agenda_id", e.target.value)}
                              className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:outline-none text-sm"
                            >
                              <option value="">Select venue agenda</option>
                              {venues.map((v) => (
                                <option key={v.id} value={String(v.id)}>{v.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-300">Preferred Time Slot *</label>
                            <select
                              required
                              value={session.preferred_time}
                              onChange={(e) => handleUpdateSession(session.id, "preferred_time", e.target.value)}
                              className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:outline-none text-sm"
                            >
                              <option value="">Please Select</option>
                              {TIME_SLOT_OPTIONS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase text-slate-300">Session Topic / Title *</label>
                          <input
                            type="text"
                            required
                            value={session.title}
                            onChange={(e) => handleUpdateSession(session.id, "title", e.target.value)}
                            className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                            placeholder="e.g. Navigating Corporate AI Implementations"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase text-slate-300">Topic Abstract / Summary</label>
                          <textarea
                            rows={3}
                            value={session.topic_description}
                            onChange={(e) => handleUpdateSession(session.id, "topic_description", e.target.value)}
                            className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none text-sm"
                            placeholder="Describe what attendees will learn, key takeaways, and tech requirements..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-brand-gradient w-full py-4 rounded-xl font-black uppercase tracking-wider text-white shadow-2xl transition transform hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    {submitting ? "Saving Speaker Questionnaire..." : "Submit Speakers Questionnaire"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Side: Submission Tracker */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-md font-black uppercase tracking-wide border-b border-white/5 pb-2 text-white">
                Your Submitted Sessions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sessions you&apos;ve requested for this event, saved to your speaker profile.
              </p>

              {loadingSubmissions ? (
                <div className="py-8 text-center text-slate-500 text-xs animate-pulse">Loading...</div>
              ) : submissions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 text-center text-xs text-slate-500">
                  No submissions recorded yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-950 border border-white/5 rounded-xl hover:border-pink-500/20 transition space-y-2 text-xs"
                    >
                      <div className="font-bold text-white leading-tight">
                        {sub.first_name} {sub.last_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-pink-400">{getRoomTypeName(sub.speaker_group)}</span>: &ldquo;{sub.title}&rdquo;
                      </div>
                      {sub.created_on && (
                        <div className="text-[9px] text-slate-500 font-mono pt-1 text-right border-t border-white/5">
                          {new Date(sub.created_on).toLocaleDateString()} at{" "}
                          {new Date(sub.created_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-3xl p-6 text-xs space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-indigo-300">Technical Note</h4>
              <p className="text-slate-400 leading-relaxed">
                Submitting this form saves your profile and session requests directly to your speaker record.
                An organiser will confirm your final agenda slot via Manage Speaker Slots.
              </p>
              <Link
                href="/event_experience"
                className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold transition"
              >
                Go to Virtual Stands <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

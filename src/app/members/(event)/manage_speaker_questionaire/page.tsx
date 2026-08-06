import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  getSpeakerQuestionnaires,
  getQuestionnaireStats,
} from "@/lib/services/eventSpeakerQuestionnaire";
import { SpeakerQuestionnaireManager } from "@/components/dashboard/SpeakerQuestionnaireManager";

export const metadata = { title: "Manage Speaker Questionnaire" };

export default async function ManageSpeakerQuestionnairePage() {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const eventId = domain?.event_id ?? 852;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
    userEmail: session.user.email || undefined,
  };

  const [questionnaires, stats] = await Promise.all([
    getSpeakerQuestionnaires(context),
    getQuestionnaireStats(context),
  ]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">
            Manage Speaker Questionnaire
          </h1>
          <p className="mt-1 text-sm font-semibold text-zinc-400">
            Review presentation topics, talk duration preferences, workshop proposals, and speaker questionnaire responses.
          </p>
        </div>
      </div>

      <SpeakerQuestionnaireManager
        eventId={eventId}
        initialQuestionnaires={questionnaires}
        initialStats={stats}
        userRole={context.role}
      />
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getMemberProfile } from "@/lib/services/member";
import { SecurityForm } from "@/components/member/SecurityForm";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "My Security Details",
};

export default async function SecurityDetailsPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session!.user.id);
  const profile = await getMemberProfile(userId);

  return (
    <div className="min-h-screenbg-gradient-to-r from-brand-purple via-brand-violet to-brand-pink p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-purple via-brand-violet to-brand-pink p-8 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-pink-400/10 blur-2xl" />

          <div className="relative flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                My Security Details
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/85">
                Keep your account secure by updating your personal information,
                contact details, and password regularly.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-8 shadow-xl">
          <div className="mb-8 border-b border-violet-100 pb-5">
            <h2 className="text-2xl font-bold text-brand-purple">
              Account Information
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Edit your profile details below. Changes will be reflected in your
              account immediately after saving.
            </p>
          </div>

          <SecurityForm
            defaultValues={{
              first_name: profile?.user_first_name ?? "",
              last_name: profile?.user_last_name ?? "",
              phone: profile?.user_phone ?? "",
              organization: profile?.user_organization ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import { RegisterForm } from "@/components/member/RegisterForm";

export const metadata = {
  title: "Member Registration",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black uppercase text-indigo-950">Create Your Account</h1>
      <p className="mt-2 text-indigo-950/70">
        Register to manage your schedule and connect with exhibitors, sponsors and speakers.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-indigo-950/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-fuchsia-600 hover:text-fuchsia-500">
          Sign in here
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations/login";

const FIELD_CLASS =
  "w-full rounded-md border border-indigo-950/20 bg-white px-4 py-2 text-indigo-950 placeholder:text-indigo-950/40 focus:border-fuchsia-500 focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    const result = await signIn("credentials", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Incorrect email/username or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/members/user_event_summary");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Email or Username*</label>
        <input {...register("identifier")} className={FIELD_CLASS} autoComplete="username" />
        {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Password*</label>
        <input {...register("password")} type="password" className={FIELD_CLASS} autoComplete="current-password" />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { signIn } from "next-auth/react";
import { registerSchema, type RegisterInput } from "@/lib/validations/register";

const FIELD_CLASS =
  "w-full rounded-md border border-indigo-950/20 bg-white px-4 py-2 text-indigo-950 placeholder:text-indigo-950/40 focus:border-fuchsia-500 focus:outline-none";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setFormError(null);
    try {
      await axios.post("/api/register", data);

      const result = await signIn("credentials", {
        identifier: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (isAxiosError(err) && typeof err.response?.data?.error === "string") {
        setFormError(err.response.data.error);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">First Name*</label>
        <input {...register("first_name")} className={FIELD_CLASS} />
        {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Last Name*</label>
        <input {...register("last_name")} className={FIELD_CLASS} />
        {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Username*</label>
        <input {...register("login")} className={FIELD_CLASS} autoComplete="username" />
        {errors.login && <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Email*</label>
        <input {...register("email")} type="email" className={FIELD_CLASS} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Mobile*</label>
        <input {...register("phone")} className={FIELD_CLASS} />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Organization</label>
        <input {...register("organization")} className={FIELD_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Password*</label>
        <input {...register("password")} type="password" className={FIELD_CLASS} autoComplete="new-password" />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Confirm Password*</label>
        <input {...register("confirm_password")} type="password" className={FIELD_CLASS} autoComplete="new-password" />
        {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-indigo-950">
          <input type="checkbox" {...register("terms_accepted")} className="h-4 w-4" />
          I agree to the terms and conditions*
        </label>
        {errors.terms_accepted && <p className="mt-1 text-sm text-red-600">{errors.terms_accepted.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
      </div>
    </form>
  );
}

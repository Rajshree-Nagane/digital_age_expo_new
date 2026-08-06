"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { securityDetailsSchema, type SecurityDetailsInput } from "@/lib/validations/security";

const FIELD_CLASS =
  "w-full rounded-md border border-indigo-950/20 bg-white px-4 py-2 text-indigo-950 placeholder:text-indigo-950/40 focus:border-fuchsia-500 focus:outline-none";

interface SecurityFormProps {
  defaultValues: {
    first_name: string;
    last_name: string;
    phone: string;
    organization: string;
  };
}

export function SecurityForm({ defaultValues }: SecurityFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SecurityDetailsInput>({
    resolver: zodResolver(securityDetailsSchema),
    defaultValues: { ...defaultValues, new_password: "", confirm_new_password: "" },
  });

  async function onSubmit(data: SecurityDetailsInput) {
    setStatus("idle");
    try {
      await axios.put("/api/member/security", data);
      setStatus("success");
      reset({ ...data, new_password: "", confirm_new_password: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(isAxiosError(err) && err.response?.data?.error ? err.response.data.error : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-xl gap-4">
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
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Mobile*</label>
        <input {...register("phone")} className={FIELD_CLASS} />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Organization</label>
        <input {...register("organization")} className={FIELD_CLASS} />
      </div>

      <hr className="my-2 border-indigo-950/10" />
      <p className="text-sm font-semibold text-indigo-950">Change Password (optional)</p>

      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">New Password</label>
        <input {...register("new_password")} type="password" className={FIELD_CLASS} autoComplete="new-password" />
        {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Confirm New Password</label>
        <input
          {...register("confirm_new_password")}
          type="password"
          className={FIELD_CLASS}
          autoComplete="new-password"
        />
        {errors.confirm_new_password && (
          <p className="mt-1 text-sm text-red-600">{errors.confirm_new_password.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        {status === "success" && <p className="mt-2 text-sm text-emerald-700">Your details have been updated.</p>}
        {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </div>
    </form>
  );
}

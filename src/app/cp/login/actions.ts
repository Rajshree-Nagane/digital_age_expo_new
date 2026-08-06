"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCpCredentials } from "@/lib/cp/auth/authRepository";
import { createSessionToken, CP_SESSION_COOKIE_NAME, CP_SESSION_MAX_AGE_SECONDS } from "@/lib/cp/auth/session";

export interface CpLoginState {
  error: string | null;
}

export async function loginAction(_prev: CpLoginState, formData: FormData): Promise<CpLoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your email/username and password." };
  }

  const user = await verifyCpCredentials(identifier, password);
  if (!user) {
    // Deliberately generic — same reasoning as the member login: don't let this form be used
    // to distinguish "wrong password" from "not an admin account" from "account disabled".
    return { error: "Invalid credentials, or this account doesn't have admin access." };
  }

  const token = await createSessionToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    groupId: user.primaryGroup.id,
    groupName: user.primaryGroup.name,
    perms: user.permissions,
  });

  const store = await cookies();
  store.set(CP_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/cp",
    maxAge: CP_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/cp");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(CP_SESSION_COOKIE_NAME);
  redirect("/cp/login");
}

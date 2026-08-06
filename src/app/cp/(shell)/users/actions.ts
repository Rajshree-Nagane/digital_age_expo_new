"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import {
  updateUserProfile,
  setUserStatus,
  setUserGroups,
  createUser,
  findRegistrationConflict,
} from "@/lib/cp/users/usersRepository";
import { prisma } from "@/lib/prisma";

function parseGroupIds(formData: FormData): number[] {
  return formData
    .getAll("groupIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

export async function updateUserAction(userId: number, formData: FormData): Promise<{ error?: string }> {
  await requireCpPermission(CP_PERMISSIONS.USERS_EDIT);

  await updateUserProfile(userId, {
    user_first_name: String(formData.get("user_first_name") ?? ""),
    user_last_name: String(formData.get("user_last_name") ?? ""),
    user_email: String(formData.get("user_email") ?? ""),
    user_phone: String(formData.get("user_phone") ?? ""),
    user_organization: String(formData.get("user_organization") ?? ""),
  });
  await setUserGroups(userId, parseGroupIds(formData));

  revalidatePath("/cp/users");
  revalidatePath(`/cp/users/${userId}`);
  return {};
}

export async function setUserStatusAction(userId: number, status: "active" | "suspended"): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.USERS_DELETE);
  await setUserStatus(userId, status);
  revalidatePath("/cp/users");
}

export interface CreateUserState {
  error: string | null;
}

export async function createUserAction(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireCpPermission(CP_PERMISSIONS.USERS_EDIT);

  const login = String(formData.get("login") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login || !email || password.length < 6) {
    return { error: "Username, email, and a password of at least 6 characters are required." };
  }

  const conflict = await findRegistrationConflict(login, email);
  if (conflict === "login_taken") return { error: "That username is already taken." };
  if (conflict === "email_taken") return { error: "That email is already in use." };

  const userId = await createUser({
    login,
    email,
    password,
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    groupIds: parseGroupIds(formData),

    disableOverdueNotices: !!formData.get("disableOverdueNotices"),
    taxExempt: !!formData.get("taxExempt"),
    moderateDisable: !!formData.get("moderateDisable"),
    timezone: String(formData.get("timezone") ?? ""),
    signature: String(formData.get("signature") ?? ""),
    vatId: String(formData.get("vatId") ?? ""),
    invoicesByEmail: !!formData.get("invoicesByEmail"),
    securityQuestion: String(formData.get("securityQuestion") ?? ""),
    securityAnswer: String(formData.get("securityAnswer") ?? ""),
    sellerAccount: !!formData.get("sellerAccount"),
    sellerGrades: formData.getAll("sellerGrades").map(String),
    sessionCost: String(formData.get("sessionCost") ?? "0"),

    address1: String(formData.get("address1") ?? ""),
    address2: String(formData.get("address2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    country: String(formData.get("country") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    fax: String(formData.get("fax") ?? ""),

    favoritesNotify: !!formData.get("favoritesNotify"),
    franchiseAllowExport: !!formData.get("franchiseAllowExport"),
    franchiseAllowExportListings: !!formData.get("franchiseAllowExportListings"),
    franchiseAllowExportRegiRequest: !!formData.get("franchiseAllowExportRegiRequest"),
    enableEventbrite: !!formData.get("enableEventbrite"),

    isSngMember: !!formData.get("isSngMember"),
    comment: String(formData.get("comment") ?? ""),
  });

  revalidatePath("/cp/users");
  revalidatePath(`/cp/users/${userId}`);
  // Back to the Users list (not the new user's own edit page) with a flag the list page turns
  // into a "User added successfully" popup — see SuccessModal in _components. The flag gets
  // stripped from the URL as soon as that popup closes, so refreshing /cp/users afterward
  // never re-shows it.
  redirect("/cp/users?created=1");
}

export async function listAllGroupsForForm() {
  return prisma.find_users_groups.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

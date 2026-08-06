import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { prisma } from "@/lib/prisma";
import { NewUserForm } from "./NewUserForm";

export default async function NewUserPage() {
  await requireCpPermission(CP_PERMISSIONS.USERS_EDIT);
  const allGroups = await prisma.find_users_groups.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Add User</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Creates a real find_users account — the same table your event members register into. Fields mirror
          admin_users.php&apos;s own Add User form.
        </p>
      </div>

      <NewUserForm allGroups={allGroups} />
    </div>
  );
}

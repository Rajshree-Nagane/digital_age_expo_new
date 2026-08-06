/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getMenu } from "@/lib/services/menu";
import { Navbar } from "@/components/layout/Navbar";

export async function Header() {
  const [domain, menu, session] = await Promise.all([
    getDomain(),
    getMenu(),
    getServerSession(authOptions),
  ]);

  return <Navbar menu={menu} domainName={domain.name} session={session} />;
}

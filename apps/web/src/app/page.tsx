import { redirect } from "next/navigation";
import { isAuthenticated, isAuthEnabled } from "@/lib/auth";

export default async function RootPage() {
  if (isAuthEnabled() && !(await isAuthenticated())) {
    redirect("/login");
  }
  redirect("/dashboard");
}

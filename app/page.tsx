import { redirect } from "next/navigation";
import { auth } from "@/auth.config";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/login");
}


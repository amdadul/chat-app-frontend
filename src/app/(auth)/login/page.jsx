// app/login/page.js (Server Component)
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Login from "../../components/auth/Login";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    // Redirect to user page
    redirect("/");
  }

  return <Login />;
}

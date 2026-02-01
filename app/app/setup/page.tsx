import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import UsernameForm from "./UsernameForm";

export default async function SetupPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/");
  }

  const user = await getUserById(session.userId);

  if (!user) {
    redirect("/");
  }

  if (user.username) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="w-full max-w-md px-8">
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-black">
          Welcome to PeopleTracker
        </h1>
        <p className="mb-8 text-center text-gray-600">
          Choose a username to get started
        </p>

        <div className="border-2 border-black p-8">
          <UsernameForm />
        </div>
      </main>
    </div>
  );
}

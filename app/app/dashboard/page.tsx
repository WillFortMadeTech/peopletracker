import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { SocketProvider } from "./components/SocketProvider";
import DashboardClient from "./components/DashboardClient";

export default async function DashboardPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/");
  }

  const user = await getUserById(session.userId);

  if (!user) {
    redirect("/");
  }

  if (!user.username) {
    redirect("/setup");
  }

  return (
    <SocketProvider>
      <DashboardClient
        user={{
          username: user.username,
          profileImageUrl: user.profileImageUrl,
        }}
      />
    </SocketProvider>
  );
}

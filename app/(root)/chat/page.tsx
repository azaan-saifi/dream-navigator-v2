import Chat from "@/components/Chat";
import { getUserById } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const ChatPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await getUserById({ userId });

  return (
    <div className="flex max-h-[100vh-200px] w-full items-start gap-3 pt-20">
      <Chat userId={user?.clerkId} picture={user?.picture} />
    </div>
  );
};

export default ChatPage;

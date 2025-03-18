import Chat from "@/components/Chat";
import { auth } from "@clerk/nextjs/server";
import React from "react";

const HomePage = async () => {
  const { userId } = await auth();

  return <Chat welcome={true} userId={userId} />;
};

export default HomePage;

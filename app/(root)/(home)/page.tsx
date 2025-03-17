import Chat from "@/components/Chat";
import { auth } from "@clerk/nextjs/server";
import React from "react";

const HomePage = async () => {
  const { userId } = await auth();
  console.log(userId);

  return <Chat welcome={true} userId={userId} />;
};

export default HomePage;

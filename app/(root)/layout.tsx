import Navbar from "@/components/Navbar";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="">
      <Navbar />
      {children}
    </main>
  );
};

export default Layout;

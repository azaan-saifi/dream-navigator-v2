import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import HeroVideoDialog from "./ui/hero-video-dialog";

const Navbar = () => {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 flex items-center justify-between bg-dark-medium px-4 py-6 lg:inset-x-24">
      <Link href={"/"} className="w-1/3 text-sm text-white sm:text-xl">
        <span className="text-primary-100">Dream</span>Navigator
      </Link>
      <div className="flex w-2/3 items-center justify-end gap-4 max-sm:gap-2">
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/jWDtJVdbI3g?si=XevzIzxLCLbWkar5"
        />
        <SignedOut>
          <Link href={"/sign-in"} className="max-sm:text-xs ">
            <Button className="rounded-full bg-white hover:bg-zinc-100">
              <p className="max-sm:text-xs sm:px-2">Sign In</p>
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
              variables: {
                colorPrimary: "#FF0A33",
              },
            }}
          />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;

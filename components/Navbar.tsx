"use client";
import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import HeroVideoDialog from "./ui/hero-video-dialog";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaPlayCircle, FaQuestionCircle } from "react-icons/fa";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { GiScrollQuill } from "react-icons/gi";
import { toast } from "react-hot-toast";
import MobileMenu from "./MobileMenu";

const Navbar = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: formData.get("type"),
          message: formData.get("feedback"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Thank you for your feedback!");
        form.reset();
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-10 flex items-center justify-between bg-dark-100 px-4 py-6 lg:inset-x-24">
      <Link href={"/"} className="w-1/3 text-sm text-white sm:text-xl">
        <span className="text-primary-100">Dream</span>Navigator
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden w-2/3 items-center justify-end gap-1 md:flex">
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/YpaBf9imGlA"
        />
        <Dialog>
          <DialogTrigger className="rounded-md px-4 py-1.5 font-rubikRegular font-normal text-white duration-100 hover:bg-white hover:text-black max-sm:text-sm">
            Knowledge
          </DialogTrigger>
          <DialogContent className="flex w-auto flex-col gap-5 bg-dark-100">
            <DialogHeader className="border-b-2 border-zinc-700 pb-4 text-center">
              <DialogTitle className="pr-8 font-rubikRegular text-base font-light text-white">
                Ask questions based on the current knowledge base of each
                functionality up to:
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaPlayCircle className="text-primary-100" />
                <p className="font-rubikRegular font-bold text-gray-500">
                  Video Timestamp:
                </p>
              </div>
              <Badge variant="default" className="bg-primary-100 text-white">
                Intensive 1
              </Badge>
            </div>
            <div className="flex justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <GiScrollQuill className="-ml-1 text-xl text-amber-500" />
                <p className="font-rubikRegular font-bold text-gray-500">
                  Resources Count:
                </p>
              </div>
              <Badge variant="default" className="bg-amber-500 text-white">
                200+
              </Badge>
            </div>
            <div className="flex justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaQuestionCircle className="text-xl text-purple-600" />
                <p className="font-rubikRegular font-bold text-gray-500">
                  Quiz Creation:
                </p>
              </div>
              <Badge variant="default" className="bg-purple-600 text-white">
                Intensive 2
              </Badge>
            </div>
          </DialogContent>
        </Dialog>

        <SignedOut>
          <Link href={"/sign-in"} className="max-sm:text-xs">
            <Button className="rounded-md bg-white px-4 py-1.5 font-rubikRegular font-normal text-black duration-100 hover:bg-zinc-200 hover:text-black max-sm:text-sm">
              Sign In
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="font-rubikRegular text-white">
                Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-100 font-rubikRegular">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium text-white">
                  Send Feedback
                </DialogTitle>
                <p className="text-sm text-gray-400">
                  Help us improve DreamNavigator
                </p>
              </DialogHeader>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Feedback Type</Label>
                  <RadioGroup
                    name="type"
                    defaultValue="suggestion"
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="suggestion" id="suggestion" />
                      <Label htmlFor="suggestion" className="text-white">
                        Suggestion
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bug" id="bug" />
                      <Label htmlFor="bug" className="text-white">
                        Bug Report
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="text-white">
                        Other
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-white">
                    Your Feedback
                  </Label>
                  <Textarea
                    name="feedback"
                    id="feedback"
                    placeholder="Tell us what you think..."
                    className="h-32 border-zinc-700 bg-dark-200 text-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-100 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

      {/* Mobile Navigation */}
      <div className="flex items-center gap-2 md:hidden">
        <SignedOut>
          <Link href={"/sign-in"} className="max-sm:text-xs">
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
        <MobileMenu />
      </div>
    </nav>
  );
};

export default Navbar;

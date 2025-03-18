import React from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Badge } from "./ui/badge";
import { FaPlayCircle, FaQuestionCircle } from "react-icons/fa";
import { GiScrollQuill } from "react-icons/gi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { toast } from "react-hot-toast";
import HeroVideoDialog from "./ui/hero-video-dialog";

const MobileMenu = () => {
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
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
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="border border-zinc-600 text-white md:hidden"
        >
          <Menu className="size-14 text-3xl" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-dark-100 p-0">
        <div className="flex h-full flex-col gap-4 p-6">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-primary-100">Dream</span>
            <span className="text-xl font-bold text-white">Navigator</span>
          </Link>

          <div className="flex flex-col gap-4 border-t border-zinc-700 py-4">
            <SignedOut>
              <Link href="/sign-in">
                <Button className="w-full rounded-full bg-white text-black hover:bg-zinc-100">
                  Sign In
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white"
                  >
                    Send Feedback
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
                    >
                      Submit Feedback
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </SignedIn>

            <HeroVideoDialog
              animationStyle="from-center"
              videoSrc="https://www.youtube.com/embed/jWDtJVdbI3g?si=XevzIzxLCLbWkar5"
            />

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white"
                >
                  Knowledge Base
                </Button>
              </DialogTrigger>
              <DialogContent className="flex flex-col gap-5 bg-dark-100">
                <DialogHeader className="border-b-2 border-zinc-700 pb-4 text-start">
                  <DialogTitle className="pr-8 font-rubikRegular text-sm font-light text-white">
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
                  <Badge
                    variant="default"
                    className="bg-primary-100 text-white"
                  >
                    Intensive 4
                  </Badge>
                </div>
                <div className="flex justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <GiScrollQuill className="-ml-1 text-xl text-amber-500" />
                    <p className="font-rubikRegular font-bold text-gray-500">
                      Resource Retrieval:
                    </p>
                  </div>
                  <Badge variant="default" className="bg-amber-500 text-white">
                    Dreamers Tab
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
                    Intensive 4
                  </Badge>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;

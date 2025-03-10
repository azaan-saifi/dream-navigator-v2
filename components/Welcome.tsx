import React from "react";

const Welcome = () => {
  return (
    <div className="mx-auto max-w-3xl pt-24 flex-col gap-4 sm:px-12 px-4">
      <div className="flex w-full flex-col gap-16 text-center text-white max-lg:gap-7 max-lg:px-5">
        <div className="flex flex-col gap-4">
          <p className="font-uthmaniScript text-4xl antialiased max-sm:text-3xl">
            السَّلَامُ عَلَيْكُمْ
          </p>
          <div className="text-3xl font-bold max-sm:text-lg">
            <span className="text-dark-300">Welcome to</span>{" "}
            <span className="text-primary-100">Dream</span>
            Navigator
          </div>
          <p className="-mt-3 max-sm:text-xs">
            An intelligent assistant built for the Dream Students Community.
          </p>
        </div>
        <div className="flex items-center justify-center gap-5 max-lg:flex-col max-sm:w-full max-sm:gap-3">
          <p className="rounded-xl border border-zinc-700 bg-dark-200 p-4 text-left max-sm:text-xs">
            <b>Ask specific questions </b>about Ustadh Nouman Ali Khan&apos;s
            lectures, and the chatbot will provide you with{" "}
            <b>precise answers</b> along with <b>clickable timestamps.</b>
          </p>
          <p className="rounded-xl border border-zinc-700 bg-dark-200 p-4 text-left max-sm:text-xs">
            <b>Request study resources</b>, and you&apos;ll instantly receive
            the relevant resource links to enhance your learning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

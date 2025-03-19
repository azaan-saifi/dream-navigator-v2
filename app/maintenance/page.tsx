import React from "react";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-100 p-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          🛠️ Under Maintenance
        </h1>
        <p className="mb-8 text-xl text-gray-300">
          We&apos;re currently performing some maintenance to improve your
          experience. Please check back soon!
        </p>
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-2 w-3/4 rounded bg-gray-700"></div>
          <div className="mx-auto mb-4 h-2 w-1/2 rounded bg-gray-700"></div>
          <div className="mx-auto h-2 w-2/3 rounded bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

/**
 * LoadingSpinner Component
 * Displays a loading animation with message
 */
export default function LoadingSpinner({ message = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"
        ></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}

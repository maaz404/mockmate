import React from "react";

const LoadingSpinner = ({ size = "medium", message = "Loading..." }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900">
      <div className="text-center">
        {/* Spinner */}
        <div
          className={`${sizeClasses[size]} border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4`}
        ></div>

        {/* Message */}
        <p className="text-surface-300 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

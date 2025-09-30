import React from "react";
import logoImage from "../../assets/mockmate-logo-bkg-crop.png";

/**
 * BrandLogo
 * Crops the uploaded image to a square "mark" (the M in a square), with rounded corners.
 * Uses object-fit cover to avoid stretching and to clip extra background/text.
 */
const sizeClasses = {
  xs: "w-5 h-5",
  sm: "w-6 h-6",
  md: "w-8 h-8 sm:w-9 sm:h-9",
  lg: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12",
  xl: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
};

export default function BrandLogo({
  size = "md",
  className = "",
  alt = "MockMate",
  variant = "mark",
}) {
  const baseSize = sizeClasses[size] || sizeClasses.md;
  if (variant === "full") {
    // Show entire image proportionally without cropping
    const cls = `${baseSize} w-auto inline-block ${className}`.trim();
    return <img src={logoImage} alt={alt} className={cls} draggable={false} />;
  }
  // Default: mark-only (cropped square)
  const box =
    `${baseSize} inline-block overflow-hidden rounded-lg bg-transparent ${className}`.trim();
  return (
    <span className={box} aria-label={alt} role="img">
      <img
        src={logoImage}
        alt={alt}
        className="w-full h-full object-cover object-center select-none pointer-events-none"
        draggable={false}
      />
    </span>
  );
}

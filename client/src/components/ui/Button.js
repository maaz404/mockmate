import React from "react";
import { cn } from "../../utils/cn";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  icon: Icon,
  iconPosition = "left",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-primary hover:shadow-glow text-white focus:ring-primary-500 transform hover:scale-105 active:scale-95",
    secondary: "bg-surface-800 hover:bg-surface-700 text-white focus:ring-surface-500 transform hover:scale-105 active:scale-95",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-500 active:scale-95",
    ghost: "text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus:ring-primary-500 active:bg-surface-200",
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base", 
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        isDisabled && "transform-none",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="loading-spinner w-4 h-4 mr-2" />
      )}
      {Icon && iconPosition === "left" && !loading && (
        <Icon size={16} className="mr-2" aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === "right" && !loading && (
        <Icon size={16} className="ml-2" aria-hidden="true" />
      )}
    </button>
  );
};

export default Button;
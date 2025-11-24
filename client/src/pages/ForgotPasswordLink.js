import React from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordLink() {
  return (
    <div className="mt-4 text-center">
      <Link
        to="/request-password-reset"
        className="text-primary-600 hover:underline"
      >
        Forgot password?
      </Link>
    </div>
  );
}

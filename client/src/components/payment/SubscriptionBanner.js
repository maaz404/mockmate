import React from "react";
import { useNavigate } from "react-router-dom";
import { Crown, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Don't show banner if user is premium or has plenty of interviews left
  if (!user || user.subscription?.plan === "premium") {
    return null;
  }

  const interviewsRemaining = user.interviewsRemaining || 0;

  // Show different messages based on interviews remaining
  const shouldShowBanner = interviewsRemaining <= 2;

  if (!shouldShowBanner) {
    return null;
  }

  const isUrgent = interviewsRemaining === 0;

  return (
    <div
      className={`${
        isUrgent ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
      } border rounded-lg p-4 mb-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {isUrgent ? (
            <AlertCircle
              className="text-red-500 flex-shrink-0 mt-0.5"
              size={24}
            />
          ) : (
            <Crown className="text-yellow-500 flex-shrink-0 mt-0.5" size={24} />
          )}
          <div>
            <h3
              className={`font-semibold ${
                isUrgent ? "text-red-900" : "text-yellow-900"
              } mb-1`}
            >
              {isUrgent
                ? "No Interviews Remaining"
                : `Only ${interviewsRemaining} Interview${
                    interviewsRemaining === 1 ? "" : "s"
                  } Left`}
            </h3>
            <p
              className={`text-sm ${
                isUrgent ? "text-red-700" : "text-yellow-700"
              }`}
            >
              {isUrgent
                ? "Upgrade to Premium for unlimited interviews and advanced features."
                : "Upgrade to Premium to get unlimited interviews and never worry about running out."}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/pricing")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
            isUrgent
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-yellow-600 text-white hover:bg-yellow-700"
          }`}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBanner;

import React from "react";
import { Link } from "react-router-dom";

export default function UpcomingCard({ next }) {
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
      <div className="p-6 border-b border-surface-700">
        <h3 className="text-lg font-medium text-white">Next Up</h3>
        <p className="text-sm text-surface-400 mt-1">Stay consistent</p>
      </div>
      <div className="p-6">
        {next ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Scheduled practice</p>
              <p className="text-base text-white font-medium">{next.title}</p>
              <p className="text-sm text-surface-400">{next.when}</p>
            </div>
            <Link to="/interviews" className="btn-outline">
              Open
            </Link>
          </div>
        ) : (
          <div className="text-surface-300 text-sm">
            No session scheduled.
            <Link
              to="/interview/new"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Create one
            </Link>{" "}
            or use Quick Start.
          </div>
        )}
      </div>
    </div>
  );
}

// Central navigation configuration for sidebar & potentially other nav components
// Each section contains items with: name, path, icon (React node), optional flags
import React from "react";

// Reusable icon helpers (inline to avoid extra deps)
const icon = (d) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export const navigationConfig = [
  {
    section: "Main",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: icon("M4 4h16v4H4V4zm0 6h16v10H4V10zm8 2v6"),
      },
      {
        name: "Mock Interview",
        path: "/interview/create",
        icon: icon("M12 17v-6m0 0l-3 3m3-3l3 3M6 7h12"),
      },
      {
        name: "Scheduled Sessions",
        path: "/scheduled",
        icon: icon("M8 7V3m8 4V3M5 11h14M5 19h14M9 15h6"),
      },
      {
        name: "Interview History",
        path: "/interviews",
        icon: icon("M8 7v10M16 7v10M12 11v6M4 4h16v16H4V4z"),
      },
    ],
  },
  {
    section: "Tools",
    items: [
      {
        name: "Question Bank",
        path: "/questions",
        icon: icon("M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14M9 7h6M9 11h6M9 15h2"),
      },
      {
        name: "Coding Demo",
        path: "/coding-demo",
        icon: icon("M16 18l6-6-6-6M8 6l-6 6 6 6"),
      },
      {
        name: "Video Demo",
        path: "/video-demo",
        icon: icon(
          "M15 10l4.5-2.5A1 1 0 0121 8.6v6.8a1 1 0 01-1.5.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        ),
      },
    ],
  },
  {
    section: "Labs",
    items: [
      {
        name: "Comprehensive Dashboard",
        path: "/comprehensive-dashboard",
        icon: icon(
          "M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"
        ),
      },
      { name: "Hybrid Demo", path: "/demo", icon: icon("M12 6v6l4 2") },
    ],
  },
  {
    section: "Resources",
    items: [
      {
        name: "Learning Materials",
        path: "/resources",
        icon: icon("M12 4v16m8-8H4"),
      },
      {
        name: "Reports & Analytics",
        path: "/reports",
        icon: icon(
          "M3 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4"
        ),
      },
    ],
  },
  {
    section: "Account",
    items: [
      {
        name: "Settings",
        path: "/settings",
        icon: icon(
          // Gear icon (settings)
          "M12 2a2 2 0 012 2v1.09a7.001 7.001 0 013.09.9l.77-.77a2 2 0 112.83 2.83l-.77.77a7.001 7.001 0 01.9 3.09H20a2 2 0 012 2v0a2 2 0 01-2 2h-1.09a7.001 7.001 0 01-.9 3.09l.77.77a2 2 0 11-2.83 2.83l-.77-.77a7.001 7.001 0 01-3.09.9V20a2 2 0 01-2 2v0a2 2 0 01-2-2v-1.09a7.001 7.001 0 01-3.09-.9l-.77.77a2 2 0 11-2.83-2.83l.77-.77a7.001 7.001 0 01-.9-3.09H4a2 2 0 01-2-2v0a2 2 0 012-2h1.09a7.001 7.001 0 01.9-3.09l-.77-.77a2 2 0 112.83-2.83l.77.77a7.001 7.001 0 013.09-.9V4a2 2 0 012-2z"
        ),
      },
      {
        name: "Help & Support",
        path: "/support",
        icon: icon(
          // Life ring icon (support)
          "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a7 7 0 017 7c0 1.61-.51 3.09-1.38 4.29l-1.42-1.42A5.007 5.007 0 0012 7a5.007 5.007 0 00-4.2 2.87l-1.42-1.42A7.003 7.003 0 0112 5zm0 14a7 7 0 01-7-7c0-1.61.51-3.09 1.38-4.29l1.42 1.42A5.007 5.007 0 0012 17a5.007 5.007 0 004.2-2.87l1.42 1.42A7.003 7.003 0 0112 19z"
        ),
      },
    ],
  },
];

export default navigationConfig;

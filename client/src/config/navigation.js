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
        icon: icon(
          "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        ),
      },
      {
        name: "Mock Interview",
        path: "/mock-interview",
        icon: icon("M12 6v6l4 2"),
      },
      {
        name: "Practice Sessions",
        path: "/practice",
        icon: icon(
          "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        ),
      },
      {
        name: "Scheduled Sessions",
        path: "/scheduled",
        icon: icon(
          "M8 7V3m8 4V3M5 11h14M5 19h14M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8"
        ),
      },
    ],
  },
  {
    section: "Tools",
    items: [
      {
        name: "Question Bank",
        path: "/questions",
        icon: icon(
          "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ),
      },
      {
        name: "Coding Demo",
        path: "/coding-demo",
        icon: icon("M3 7h18M3 12h18M3 17h18"),
      },
      {
        name: "Video Demo",
        path: "/video-demo",
        icon: icon(
          "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        ),
      },
      {
        name: "Interview History",
        path: "/interviews",
        icon: icon(
          "M3 5h12M9 3v2m3 14h6m-6-4h6m-6-4h6M3 9h12M5 21h8a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
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
        icon: icon(
          "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253"
        ),
      },
      {
        name: "Reports & Analytics",
        path: "/reports",
        icon: icon(
          "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
          "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        ),
      },
      {
        name: "Help & Support",
        path: "/support",
        icon: icon(
          "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
        ),
      },
    ],
  },
];

export default navigationConfig;

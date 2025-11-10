// Central navigation configuration for sidebar & potentially other nav components
// Each section contains items with: name, path, icon (React node), optional flags
import React from "react";
import {
  Settings as SettingsIcon,
  Presentation as PresentationIcon,
  BookOpen as BookOpenIcon,
  LineChart,
  HelpCircle,
  LayoutDashboard,
  Mic,
  CalendarClock,
  History,
  Code2,
  Video,
} from "lucide-react";

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
        icon: (
          <LayoutDashboard
            className="w-5 h-5"
            aria-label="Dashboard"
            role="img"
          />
        ),
      },
      {
        name: "Mock Interview",
        path: "/interview/create",
        icon: <Mic size={20} />,
      },
      {
        name: "Scheduled Sessions",
        path: "/scheduled",
        icon: <CalendarClock size={20} />,
      },
      {
        name: "Interview History",
        path: "/interviews",
        icon: <History size={20} />,
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
        icon: <Code2 size={20} />,
      },
      {
        name: "Video Demo",
        path: "/video-demo",
        icon: <Video size={20} />,
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
      {
        name: "Hybrid Demo",
        path: "/demo",
        icon: <PresentationIcon className="w-5 h-5" aria-label="Hybrid Demo" />,
      },
    ],
  },
  {
    section: "Resources",
    items: [
      {
        name: "Learning Materials",
        path: "/resources",
        icon: (
          <BookOpenIcon
            className="w-5 h-5"
            aria-label="Learning Materials"
            role="img"
          />
        ),
      },
      {
        name: "Reports & Analytics",
        path: "/reports",
        icon: (
          <LineChart size={20} aria-label="Reports & Analytics" role="img" />
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
        icon: <SettingsIcon className="w-5 h-5" aria-label="Settings" />,
      },
      {
        name: "Help & Support",
        path: "/support",
        icon: (
          <HelpCircle
            size={20}
            className="w-5 h-5"
            aria-label="Help & Support"
            role="img"
          />
        ),
      },
    ],
  },
];

export default navigationConfig;

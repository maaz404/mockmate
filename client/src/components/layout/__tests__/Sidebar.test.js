import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../Sidebar";
import { ThemeProvider } from "../../../context/ThemeContext";

// Mock AuthContext hook used inside Sidebar
jest.mock("../../../context/AuthContext.jsx", () => ({
  useAuthContext: () => ({ user: null, loading: false, logout: jest.fn() }),
}));

describe("Sidebar", () => {
  test("renders key navigation links", () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Core links
    // Use exact match to avoid collision with 'Comprehensive Dashboard'
    expect(screen.getByText(/^Dashboard$/)).toBeInTheDocument();
    expect(screen.getByText(/Mock Interview/i)).toBeInTheDocument();
    expect(screen.getByText(/Practice Sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled Sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Question Bank/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview History/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });
});

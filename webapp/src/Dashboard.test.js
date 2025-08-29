import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "./pages/Dashboard";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

describe("Dashboard", () => {
  test("renders Dashboard and switches language", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );
    expect(screen.getByText(/Übersicht|Dashboard/)).toBeInTheDocument();
    const langBtn = screen.getByRole("button", { name: /EN|DE/ });
    fireEvent.click(langBtn);
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
  });
});

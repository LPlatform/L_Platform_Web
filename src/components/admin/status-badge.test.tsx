import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("maps known statuses to readable labels", () => {
    const { rerender } = render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<StatusBadge status="REVOKED" />);
    expect(screen.getByText("Revoked")).toBeInTheDocument();

    rerender(<StatusBadge status="DUPLICATE" />);
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
  });

  it("falls back to a lowercased label for unknown statuses", () => {
    render(<StatusBadge status="TRIAL" />);
    expect(screen.getByText("trial")).toBeInTheDocument();
  });
});

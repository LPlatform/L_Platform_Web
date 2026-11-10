import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TablePagination } from "./table-pagination";

const meta = { page: 2, pageSize: 10, total: 34, totalPages: 4 };

describe("TablePagination", () => {
  it("summarizes the visible range", () => {
    render(<TablePagination meta={meta} onPageChange={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "Pagination" });
    expect(navigation.textContent).toContain("Showing 11–20 of 34 results");
    expect(screen.getByText(/Page 2 of 4/)).toBeInTheDocument();
  });

  it("requests the first, next and last pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<TablePagination meta={meta} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "First page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("disables controls at the boundaries", () => {
    const { rerender } = render(
      <TablePagination
        meta={{ page: 1, pageSize: 10, total: 34, totalPages: 4 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    rerender(
      <TablePagination
        meta={{ page: 4, pageSize: 10, total: 34, totalPages: 4 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
  });

  it("renders an empty result set and a custom item label", () => {
    render(
      <TablePagination
        meta={{ page: 1, pageSize: 10, total: 0, totalPages: 1 }}
        onPageChange={vi.fn()}
        itemLabel="organizations"
      />,
    );

    const navigation = screen.getByRole("navigation", { name: "Pagination" });
    expect(navigation.textContent).toContain("Showing 0–0 of 0 organizations");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ColumnVisibilityPanel from "../../components/Datatable/ColumnVisibilityPanel";

// Mock Checkbox component in case it contains internal styling or assets
vi.mock("./Checkbox", () => {
  return {
    default: ({ checked, onChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
      />
    ),
  };
});

describe("ColumnVisibilityPanel Component", () => {
  const defaultColumns = [
    { key: "id", label: "ID", hideable: false }, // Un-hideable
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
  ];

  const defaultProps = {
    columns: defaultColumns,
    hiddenColumns: new Set<string>(),
    onToggle: vi.fn(),
    onShowAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders closed dropdown state initially with correct ARIA bindings", () => {
    render(<ColumnVisibilityPanel {...defaultProps} />);

    const triggerButton = screen.getByRole("button", { name: /columns/i });
    expect(triggerButton).toHaveAttribute("aria-expanded", "false");
    expect(triggerButton).toHaveAttribute("aria-haspopup", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("toggles dropdown visibility panel open and closed on button click", async () => {
    render(<ColumnVisibilityPanel {...defaultProps} />);
    const user = userEvent.setup();
    const triggerButton = screen.getByRole("button", { name: /columns/i });

    // Open
    await user.click(triggerButton);
    expect(triggerButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: /column visibility/i })).toBeInTheDocument();

    // Close
    await user.click(triggerButton);
    expect(triggerButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("filters out columns configured with hideable: false", async () => {
    render(<ColumnVisibilityPanel {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /columns/i }));

    // Hideable columns should be visible in options
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    
    // The "id" column has hideable: false, so it should not render in choices
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
  });

  test("displays correct badge count and visibility calculations when columns are hidden", async () => {
    const hiddenSet = new Set(["email", "role"]);
    render(<ColumnVisibilityPanel {...defaultProps} hiddenColumns={hiddenSet} />);

    // Check main button hidden badge indicator
    expect(screen.getByText("2")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /columns/i }));

    // Footer summary calculation (3 hideable columns total, 2 hidden = 1 visible)
    expect(screen.getByText("1 of 3 columns visible")).toBeInTheDocument();
  });

  test("displays hidden labels and strikethroughs correctly for hidden columns", async () => {
    const hiddenSet = new Set(["email"]);
    render(<ColumnVisibilityPanel {...defaultProps} hiddenColumns={hiddenSet} />);
    
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /columns/i }));

    const emailLabel = screen.getByText("Email");
    expect(emailLabel).toHaveClass("line-through");
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  test("calls onToggle when a column visibility checkbox is clicked", async () => {
    render(<ColumnVisibilityPanel {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    
    const checkbox = screen.getByRole("checkbox", { name: "Toggle Name column" });
    await user.click(checkbox);

    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onToggle).toHaveBeenCalledWith("name");
  });

  test("shows 'Show all' action button only when hiddenCount > 0 and handles event invocation", async () => {
    const { rerender } = render(<ColumnVisibilityPanel {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(screen.queryByRole("button", { name: /show all/i })).not.toBeInTheDocument();

    // Re-render with a hidden column to trigger action link visibility
    const hiddenSet = new Set(["role"]);
    rerender(<ColumnVisibilityPanel {...defaultProps} hiddenColumns={hiddenSet} />);

    const showAllBtn = screen.getByRole("button", { name: /show all/i });
    expect(showAllBtn).toBeInTheDocument();

    await user.click(showAllBtn);
    expect(defaultProps.onShowAll).toHaveBeenCalledTimes(1);
  });

  test("closes the dropdown panel automatically when the 'Escape' key is pressed", async () => {
    render(<ColumnVisibilityPanel {...defaultProps} />);
    const user = userEvent.setup();

    const triggerButton = screen.getByRole("button", { name: /columns/i });
    await user.click(triggerButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fire global keyboard Escape sequence
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("closes the panel on clicking outside the container context but remains open if clicking inside", async () => {
    render(
      <div>
        <div data-testid="outside-element">Outside Context</div>
        <ColumnVisibilityPanel {...defaultProps} />
      </div>
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Click inside the dialog context should leave it open
    await user.click(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click outside elements to verify closure hook
    await user.click(screen.getByTestId("outside-element"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("falls back to parsing column key name if label string property is absent", async () => {
    const fallbackColumns = [{ key: "unlabeledColumn" }];
    render(<ColumnVisibilityPanel {...defaultProps} columns={fallbackColumns} />);
    
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /columns/i }));

    expect(screen.getByText("unlabeledColumn")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Toggle unlabeledColumn column" })).toBeInTheDocument();
  });
});
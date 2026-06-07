import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import Pagination from "../../components/Datatable/Pagination";

describe("Pagination Component", () => {
  const defaultProps = {
    pagination: { page: 1, pageSize: 10 },
    totalRows: 50,
    totalPages: 5,
    pageSizeOptions: [10, 20, 50],
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders empty state correctly when totalRows is 0", () => {
    render(<Pagination {...defaultProps} totalRows={0} totalPages={0} />);
    
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  test("calculates and displays correct row numbers and total on desktop vs mobile", () => {
    render(<Pagination {...defaultProps} pagination={{ page: 2, pageSize: 10 }} />);

    // Desktop text
    expect(screen.getByText("Showing 11–20 of 50 rows")).toBeInTheDocument();
    // Mobile compressed text
    expect(screen.getByText("11–20 / 50")).toBeInTheDocument();
  });

  test("prevents lower and upper indexing bounds from overshooting totalRows", () => {
    render(
      <Pagination 
        {...defaultProps} 
        pagination={{ page: 5, pageSize: 12 }} 
        totalRows={53} 
        totalPages={5} 
      />
    );

    expect(screen.getByText("Showing 49–53 of 53 rows")).toBeInTheDocument();
  });

  test("disables the previous button on the first page", () => {
    render(<Pagination {...defaultProps} pagination={{ page: 1, pageSize: 10 }} />);

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  test("disables the next button on the last page", () => {
    render(<Pagination {...defaultProps} pagination={{ page: 5, pageSize: 10 }} />);

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test("calls onPageChange when previous or next page arrows are clicked", async () => {
    render(<Pagination {...defaultProps} pagination={{ page: 3, pageSize: 10 }} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
  });

  test("calls onPageChange when a numbered page link is clicked", async () => {
    render(<Pagination {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Page 3" }));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  test("calls onPageSizeChange when a new row select value option is picked", async () => {
    render(<Pagination {...defaultProps} />);
    const user = userEvent.setup();

    const select = screen.getByRole("combobox", { name: "Rows" });
    await user.selectOptions(select, "20");

    expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(20);
  });

  test("applies aria-current='page' to the currently active page button", () => {
    render(<Pagination {...defaultProps} pagination={{ page: 3, pageSize: 10 }} />);

    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 2" })).not.toHaveAttribute("aria-current");
  });

  test("applies additional consumer className when provided", () => {
    const { container } = render(<Pagination {...defaultProps} className="custom-test-class" />);
    
    expect(container.firstChild).toHaveClass("custom-test-class");
  });

  test("disables all inputs and controls completely when loading is true", () => {
    render(<Pagination {...defaultProps} loading={true} />);

    expect(screen.getByRole("combobox", { name: "Rows" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    
    const pageButtons = screen.getAllByRole("button", { name: /Page \d+/ });
    pageButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  describe("Ellipsis Generation Configurations", () => {
    test("shows all sequential pages cleanly when totalPages <= 7", () => {
      render(<Pagination {...defaultProps} totalPages={7} />);

      const pageButtons = screen.getAllByRole("button", { name: /Page \d+/ });
      expect(pageButtons).toHaveLength(7);
      expect(screen.queryByText("…")).not.toBeInTheDocument();
    });

    test("shows an ellipsis block at the end when current page is early (page <= 4)", () => {
      render(<Pagination {...defaultProps} totalPages={10} pagination={{ page: 3, pageSize: 10 }} />);

      // Expected format: 1, 2, 3, 4, 5, ..., 10
      expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();
      expect(screen.getByText("…")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 10" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Page 6" })).not.toBeInTheDocument();
    });

    test("shows an ellipsis block at the front when current page is near the end (page >= totalPages - 3)", () => {
      render(<Pagination {...defaultProps} totalPages={10} pagination={{ page: 8, pageSize: 10 }} />);

      // Expected format: 1, ..., 6, 7, 8, 9, 10
      expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
      expect(screen.getByText("…")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 10" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Page 5" })).not.toBeInTheDocument();
    });

    test("shows double ellipsis blocks flanking both sides when current page is dead-center", () => {
      render(<Pagination {...defaultProps} totalPages={10} pagination={{ page: 5, pageSize: 10 }} />);

      // Expected format: 1, ..., 4, 5, 6, ..., 10
      expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 10" })).toBeInTheDocument();
      
      const ellipses = screen.getAllByText("…");
      expect(ellipses).toHaveLength(2);
    });
  });
});
import { fireEvent, render, screen } from "@testing-library/react";
import { Wallet } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import {
  Alert,
  Badge,
  EmptyState,
  FormField,
  MetricRow,
  Modal,
  RiskGauge,
  SectionHeader,
  Select,
  Spinner,
  StatCard,
  TabBar,
} from "./index";

describe("StatCard", () => {
  it("renders the label and the value", () => {
    render(<StatCard label="Net Worth" value="Ready" />);

    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("formats numeric values with grouping and at most two decimals", () => {
    render(<StatCard label="Value" value={1234567.891} />);

    expect(screen.getByText("1,234,567.89")).toBeInTheDocument();
  });

  it("wraps the value in its prefix and suffix", () => {
    render(<StatCard label="Value" value={5000} prefix="$" suffix=" USD" />);

    expect(screen.getByText("$5,000 USD")).toBeInTheDocument();
  });

  it("shows a gain with a plus sign in the positive colour", () => {
    render(<StatCard label="Day" value={1} change={2.5} changeLabel="%" />);

    expect(screen.getByText("+2.50%")).toHaveClass("text-jade-500");
  });

  it("shows a loss without a plus sign in the negative colour", () => {
    render(<StatCard label="Day" value={1} change={-1.25} changeLabel="%" />);

    expect(screen.getByText("-1.25%")).toHaveClass("text-crimson-400");
  });

  it("treats a zero change as a gain", () => {
    render(<StatCard label="Day" value={1} change={0} changeLabel="%" />);

    expect(screen.getByText("+0.00%")).toHaveClass("text-jade-500");
  });

  it("shows no change indicator when none is given or it is not a number", () => {
    const { container, rerender } = render(<StatCard label="Day" value={1} />);
    expect(container.querySelector(".font-mono.text-xs")).toBeNull();

    rerender(<StatCard label="Day" value={1} change="n/a" />);
    expect(container.querySelector(".font-mono.text-xs")).toBeNull();
  });

  it("shows an icon only when one is given", () => {
    const { container, rerender } = render(<StatCard label="Cash" value={1} />);
    expect(container.querySelector("svg")).toBeNull();

    rerender(<StatCard label="Cash" value={1} icon={Wallet} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("SectionHeader", () => {
  it("renders the title, optional subtitle and optional actions", () => {
    const { rerender } = render(<SectionHeader title="Portfolios" />);
    expect(
      screen.getByRole("heading", { name: "Portfolios" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Your accounts")).not.toBeInTheDocument();

    rerender(
      <SectionHeader
        title="Portfolios"
        subtitle="Your accounts"
        actions={<button>New</button>}
      />,
    );
    expect(screen.getByText("Your accounts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="Add holding">
        body
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows its title and content while open", () => {
    render(
      <Modal open onClose={() => {}} title="Add holding">
        <p>holding form</p>
      </Modal>,
    );

    expect(
      screen.getByRole("heading", { name: "Add holding" }),
    ).toBeInTheDocument();
    expect(screen.getByText("holding form")).toBeInTheDocument();
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Add holding">
        body
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked but not when the content is", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Add holding">
        <p>holding form</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText("holding form"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector(".bg-black\\/70"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("accepts a custom width", () => {
    const { container } = render(
      <Modal open onClose={() => {}} title="Wide" maxWidth="max-w-3xl">
        body
      </Modal>,
    );

    expect(container.querySelector(".max-w-3xl")).toBeInTheDocument();
  });
});

describe("Alert", () => {
  it.each([
    ["error", "text-crimson-400"],
    ["success", "text-jade-500"],
    ["info", "text-gold-400"],
  ])("styles the %s type", (type, expectedClass) => {
    const { container } = render(<Alert type={type} message="Heads up" />);

    expect(container.firstElementChild).toHaveClass(expectedClass);
    expect(screen.getByText("Heads up")).toBeInTheDocument();
  });

  it("falls back to the info style for unknown types and by default", () => {
    const { container, rerender } = render(<Alert message="Heads up" />);
    expect(container.firstElementChild).toHaveClass("text-gold-400");

    rerender(<Alert type="weird" message="Heads up" />);
    expect(container.firstElementChild).toHaveClass("text-gold-400");
  });

  it("shows a dismiss button only when it can be dismissed", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Alert message="Heads up" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<Alert message="Heads up" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("small components", () => {
  it("Badge picks its style from the variant", () => {
    const { rerender } = render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toHaveClass("badge-slate");

    rerender(<Badge variant="jade">Active</Badge>);
    expect(screen.getByText("Active")).toHaveClass("badge-jade");
  });

  it("Spinner uses the requested size and extra classes", () => {
    const { container } = render(<Spinner size={30} className="mx-2" />);
    const icon = container.querySelector("svg");

    expect(icon).toHaveAttribute("width", "30");
    expect(icon).toHaveClass("animate-spin", "mx-2");
  });

  it("EmptyState shows a title and only the optional parts that are given", () => {
    const { container, rerender } = render(<EmptyState title="No goals yet" />);
    expect(
      screen.getByRole("heading", { name: "No goals yet" }),
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();

    rerender(
      <EmptyState
        icon={Wallet}
        title="No goals yet"
        description="Create one to start planning."
        action={<button>Create goal</button>}
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(
      screen.getByText("Create one to start planning."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create goal" }),
    ).toBeInTheDocument();
  });

  it("FormField shows its label and error only when given", () => {
    const { rerender } = render(
      <FormField>
        <input aria-label="amount" />
      </FormField>,
    );
    expect(screen.queryByText("Amount")).not.toBeInTheDocument();

    rerender(
      <FormField label="Amount" error="Must be positive.">
        <input aria-label="amount" />
      </FormField>,
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Must be positive.")).toHaveClass(
      "text-crimson-400",
    );
  });

  it("MetricRow highlights a value when asked", () => {
    const { rerender } = render(<MetricRow label="Sharpe" value="1.42" />);
    expect(screen.getByText("1.42")).toHaveClass("text-slate-200");

    rerender(<MetricRow label="Sharpe" value="1.42" highlight />);
    expect(screen.getByText("1.42")).toHaveClass("text-gold-400");
  });
});

describe("Select", () => {
  const options = [
    { value: "usd", label: "US Dollar" },
    { value: "eur", label: "Euro" },
  ];

  it("lists its options and shows the current value", () => {
    render(
      <Select
        label="Currency"
        value="eur"
        onChange={() => {}}
        options={options}
      />,
    );

    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("eur");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("reports the chosen value, not the event", () => {
    const onChange = vi.fn();
    render(<Select value="usd" onChange={onChange} options={options} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "eur" },
    });

    expect(onChange).toHaveBeenCalledWith("eur");
  });
});

describe("TabBar", () => {
  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "history", label: "History" },
  ];

  it("highlights only the active tab", () => {
    render(<TabBar tabs={tabs} active="history" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "History" })).toHaveClass(
      "text-gold-400",
    );
    expect(screen.getByRole("button", { name: "Overview" })).not.toHaveClass(
      "text-gold-400",
    );
  });

  it("reports the value of the clicked tab", () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} active="overview" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "History" }));

    expect(onChange).toHaveBeenCalledWith("history");
  });
});

describe("RiskGauge", () => {
  const needleColor = (container) =>
    container.querySelector("circle").getAttribute("fill");

  it.each([
    [10, "#3dffc8"],
    [29, "#3dffc8"],
    [30, "#e8b320"],
    [59, "#e8b320"],
    [60, "#ff4459"],
    [95, "#ff4459"],
  ])("colours a score of %d as %s", (score, color) => {
    const { container } = render(
      <RiskGauge score={score} profile="moderate" />,
    );

    expect(needleColor(container)).toBe(color);
  });

  it("shows the score and the profile name with spaces", () => {
    render(<RiskGauge score={72} profile="very_aggressive" />);

    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("very aggressive")).toBeInTheDocument();
  });

  it("keeps the arc inside the dial for out-of-range scores", () => {
    const arc = (container) =>
      container.querySelectorAll("path")[1].getAttribute("stroke-dasharray");

    const { container: high } = render(<RiskGauge score={250} profile="x" />);
    expect(arc(high)).toBe("188.5 188.5");

    const { container: low } = render(<RiskGauge score={-20} profile="x" />);
    expect(arc(low)).toBe("0 188.5");
  });

  it("copes with a missing profile", () => {
    render(<RiskGauge score={50} />);

    expect(screen.getByText("50")).toBeInTheDocument();
  });
});

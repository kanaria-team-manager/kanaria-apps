import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Page from "./+page.svelte";

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

describe("/+page.svelte", () => {
  it("should render redirect message", () => {
    render(Page);

    const message = screen.getByText("リダイレクト中...");
    expect(message).toBeInTheDocument();
  });
});

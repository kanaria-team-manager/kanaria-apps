import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Page from "./+page.svelte";

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

describe("/+page.svelte", () => {
  it("should render redirect message", async () => {
    render(Page);

    const message = page.getByText("リダイレクト中...");
    await expect.element(message).toBeInTheDocument();
  });
});

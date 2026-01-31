import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Layout from "./+layout.svelte";

// Mock $page state
const { mockPage } = vi.hoisted(() => {
  return {
    mockPage: {
      url: new URL("http://localhost/dashboard"),
      route: { id: "/dashboard" },
      data: {},
      params: {},
      status: 200,
      error: null,
      state: {},
      form: null,
    },
  };
});

vi.mock("$app/state", () => ({
  page: mockPage,
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  afterNavigate: vi.fn(),
  beforeNavigate: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  replaceState: vi.fn(),
  pushState: vi.fn(),
}));

describe("+layout.svelte", () => {
  // We need to render something as children
  const childrenSnippet = createRawSnippet(() => ({
    render: () => '<div data-testid="child">Child Content</div>',
  }));

  it("should render Sidebar on private routes (/dashboard)", async () => {
    mockPage.url = new URL("http://localhost/dashboard");
    mockPage.route = { id: "/dashboard" };

    render(Layout, { children: childrenSnippet });

    // Check for sidebar content
    const header = page.getByRole("banner"); // header tag has banner role? or check text
    const kanariaText = page.getByText("Kanaria");
    await expect.element(kanariaText.first()).toBeInTheDocument();
  });

  it("should NOT render Sidebar on public routes (/auth/login)", async () => {
    mockPage.url = new URL("http://localhost/auth/login");
    mockPage.route = { id: "/auth/login" };

    render(Layout, { children: childrenSnippet });

    // Check absence of sidebar content
    const kanariaText = page.getByText("Kanaria");
    await expect.element(kanariaText).not.toBeInTheDocument();
  });
});

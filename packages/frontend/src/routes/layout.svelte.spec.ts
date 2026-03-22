import { createRawSnippet } from "svelte";
import { render, screen, cleanup } from "@testing-library/svelte";
import { describe, expect, it, vi, afterEach } from "vitest";
import Layout from "./+layout.svelte";

// Mock $app/state
// In Svelte 5, $app/state exports 'page' which is a reactive object.
// To simulate changing routes, we need to update this object.
const pageState = {
    url: new URL("http://localhost/dashboard"),
    route: { id: "/dashboard" },
    data: {},
    params: {},
    status: 200,
    error: null,
    state: {},
    form: null,
};

vi.mock("$app/state", () => ({
  get page() { return pageState },
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

afterEach(() => {
  cleanup();
});

describe("+layout.svelte", () => {
  // We need to render something as children
  const childrenSnippet = createRawSnippet(() => ({
    render: () => '<div data-testid="child">Child Content</div>',
  }));

  it("should render Sidebar on private routes (/dashboard)", async () => {
    pageState.url = new URL("http://localhost/dashboard");
    pageState.route = { id: "/dashboard" };

    render(Layout, { children: childrenSnippet });

    // Both mobile header and sidebar contain "Kanaria", so use getAllByText
    const kanariaTexts = screen.getAllByText("Kanaria");
    expect(kanariaTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("should render mobile header with hamburger on private routes", async () => {
    pageState.url = new URL("http://localhost/dashboard");
    pageState.route = { id: "/dashboard" };

    render(Layout, { children: childrenSnippet });

    // Check for hamburger button
    const hamburgerButton = screen.getByLabelText("メニューを開く");
    expect(hamburgerButton).toBeInTheDocument();
  });

  it("should NOT render Sidebar on public routes (/auth/login)", async () => {
    pageState.url = new URL("http://localhost/auth/login");
    pageState.route = { id: "/auth/login" };

    cleanup();
    
    render(Layout, { children: childrenSnippet });

    // Check absence of sidebar content
    const kanariaText = screen.queryByText("Kanaria");
    expect(kanariaText).not.toBeInTheDocument();

    // Also check no hamburger on public routes
    const hamburgerButton = screen.queryByLabelText("メニューを開く");
    expect(hamburgerButton).not.toBeInTheDocument();
  });
});

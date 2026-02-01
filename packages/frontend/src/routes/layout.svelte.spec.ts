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
  // In Svelte 5 with @testing-library/svelte, we can pass snippets via props or Slot options (depends on version, but snippets are standard in S5)
  // render(Component, { props: { children: snippet } }) 
  const childrenSnippet = createRawSnippet(() => ({
    render: () => '<div data-testid="child">Child Content</div>',
  }));

  it("should render Sidebar on private routes (/dashboard)", async () => {
    pageState.url = new URL("http://localhost/dashboard");
    pageState.route = { id: "/dashboard" };

    render(Layout, { children: childrenSnippet });

    // Check for sidebar content
    const kanariaText = screen.getByText("Kanaria");
    expect(kanariaText).toBeInTheDocument();
  });

  it("should NOT render Sidebar on public routes (/auth/login)", async () => {
    pageState.url = new URL("http://localhost/auth/login");
    pageState.route = { id: "/auth/login" };

    // We need to re-render to reflect the state change because the Layout component
    // typically reads the page state at initialization or via $derived.
    // In a real app, navigation updates the state. Here we are simulating it.
    // However, since we define 'shouldShowSidebar' as a $derived, it should react
    // if the dependencies are reactive source.
    // But our mock 'page' is just a plain object, so $derived might not pick up changes 
    // unless we use $state for the mock or re-mount.
    // For simplicity, we re-mount (render new instance) for this test case.
    
    // Cleaning up previous render is handled by cleanup() from testing-library usually,
    // but just calling render() again is fine as it appends to body.
    // To be cleaner, we can rely on `afterEach(cleanup)` which is default in recent versions,
    // manually verify scope.
    cleanup();
    
    render(Layout, { children: childrenSnippet });

    // Check absence of sidebar content
    const kanariaText = screen.queryByText("Kanaria");
    expect(kanariaText).not.toBeInTheDocument();
  });
});

import { createRawSnippet } from "svelte";
import { readable, writable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Layout from "./+layout.svelte";

// Mock $page store
const mockPage = writable({
  url: new URL("http://localhost/dashboard"),
  route: { id: "/dashboard" },
  data: {},
  params: {},
  status: 200,
  error: null,
  state: {},
  form: null,
});

vi.mock("$app/stores", () => ({
  page: {
    subscribe: (fn: (value: any) => void) => mockPage.subscribe(fn),
  },
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
  const snippets = {
    children: '<div data-testid="child">Child Content</div>',
  };

  const childrenSnippet = createRawSnippet(() => ({
    render: () => '<div data-testid="child">Child Content</div>',
  }));

  it("should render GlobalHeader on private routes (/dashboard)", async () => {
    mockPage.set({
      url: new URL("http://localhost/dashboard"),
      route: { id: "/dashboard" },
      data: {},
      params: {},
      status: 200,
      error: null,
      state: {},
      form: null,
    });

    render(Layout, { children: childrenSnippet });

    // Check for header content
    const header = page.getByRole("banner"); // header tag has banner role? or check text
    const kanariaText = page.getByText("Kanaria");
    await expect.element(kanariaText.first()).toBeInTheDocument();
  });

  it("should NOT render GlobalHeader on public routes (/auth/login)", async () => {
    mockPage.set({
      url: new URL("http://localhost/auth/login"),
      route: { id: "/auth/login" },
      data: {},
      params: {},
      status: 200,
      error: null,
      state: {},
      form: null,
    });

    render(Layout, { children: childrenSnippet });

    // Check absence of header content
    const kanariaText = page.getByText("Kanaria");
    await expect.element(kanariaText).not.toBeInTheDocument();
  });
});

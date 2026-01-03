import { render, screen, fireEvent, cleanup, within } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from './+page.svelte';
import * as navigation from '$app/navigation';

// Mock imports
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock('$app/forms', () => ({
  enhance: () => () => {},
}));

// Mock props
const mockData = {
  session: { access_token: 'mock-token' },
  places: [
    { id: '1', name: 'Place 1', description: 'Desc 1', location: { x: 0, y: 0 } },
    { id: '2', name: 'Place 2', description: 'Desc 2' },
  ],
};

describe('Places Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

  it('renders places and navigates to details on card click', async () => {
    render(Page, { props: { data: mockData as any, form: null } });

    // Wait for loading to finish
    const place1 = await screen.findByText('Place 1');
    expect(place1).toBeInTheDocument();

    // Find the card container (parent of the title)
    // We can find the card by getting the closest div with the click handler, 
    // but in TDD we expect the card to be clickable.
    // Let's assume the card is the container.
    // For now, let's click the text 'Place 1' which is inside the card. 
    // If the event bubbles up to the card, it should trigger navigation.
    await fireEvent.click(place1);

    expect(navigation.goto).toHaveBeenCalledWith('/places/1');
  });

  it('does not show edit icon', async () => {
    render(Page, { props: { data: mockData as any, form: null } });
    await screen.findByText('Place 1');

    // Use queryByLabelText to check for '編集' (Edit) button/link
    const editButton = screen.queryByLabelText('編集');
    expect(editButton).not.toBeInTheDocument();
  });

  it('renders delete button for each place', async () => {
    render(Page, { props: { data: mockData as any, form: null } });

    const place1Title = await screen.findByText('Place 1');
    // Assuming the structure: card -> div > h3(Place 1)
    // We can find the closest card container or just traverse nearby.
    // However, simplest robust way in this structure without adding test-ids:
    // navigate up to the card.
    
    // In the component: 
    // <div class="bg-card ..."> ... <h3 ...>Place 1</h3> ... <button aria-label="削除">
    
    // valid approach if we don't want to rely on class names too much:
    // The button is commonly in the same container. 
    // Let's use `closest` which DOM provides.
    const card = place1Title.closest('.bg-card');
    expect(card).toBeInTheDocument();
    
    if (card) {
        const deleteBtn = within(card as HTMLElement).getByLabelText('削除');
        expect(deleteBtn).toBeInTheDocument();
    }
  });
});

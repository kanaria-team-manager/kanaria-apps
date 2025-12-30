import { render, screen, fireEvent, cleanup, within } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from './+page.svelte';
import * as navigation from '$app/navigation';
import * as apiClient from '$lib/api/client';

// Mock imports
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock('$lib/api/client', () => ({
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock props
const mockData = {
  session: { access_token: 'mock-token' },
};

describe('Places Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiClient.apiGet).mockResolvedValue([
            { id: '1', name: 'Place 1', description: 'Desc 1', location: [0, 0] },
            { id: '2', name: 'Place 2', description: 'Desc 2' },
        ]);
    });

    afterEach(() => {
        cleanup();
    });

  it('renders places and navigates to details on card click', async () => {
    render(Page, { props: { data: mockData as any } });

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
    render(Page, { props: { data: mockData as any } });
    await screen.findByText('Place 1');

    // Use queryByLabelText to check for '編集' (Edit) button/link
    const editButton = screen.queryByLabelText('編集');
    expect(editButton).not.toBeInTheDocument();
  });

  it('handles delete without navigating', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(Page, { props: { data: mockData as any } });

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
        await fireEvent.click(deleteBtn);
    }

    expect(apiClient.apiDelete).toHaveBeenCalledWith('/places/1', 'mock-token');
    // Should NOT navigate
    expect(navigation.goto).not.toHaveBeenCalled();
  });
});

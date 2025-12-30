import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import PlaceDisplay from './PlaceDisplay.svelte';

describe('PlaceDisplay Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders place name and description', async () => {
    render(PlaceDisplay, {
      props: {
        place: {
          name: 'グラウンドA',
          description: '第一グラウンド',
          location: { x: 139.69, y: 35.68 },
        },
      },
    });

    expect(screen.getByText('グラウンドA')).toBeInTheDocument();
    expect(screen.getByText('第一グラウンド')).toBeInTheDocument();
  });

  it('displays map when location is present', async () => {
    render(PlaceDisplay, {
      props: {
        place: {
          name: 'グラウンドA',
          description: null,
          location: { x: 139.69, y: 35.68 },
        },
      },
    });

    // Map section should be present
    expect(screen.getByText('地図')).toBeInTheDocument();
  });

  it('does not display map when location is null', async () => {
    render(PlaceDisplay, {
      props: {
        place: {
          name: '体育館',
          description: '室内練習場',
          location: null,
        },
      },
    });

    expect(screen.queryByText('地図')).not.toBeInTheDocument();
  });

  it('shows fallback text when description is empty', async () => {
    render(PlaceDisplay, {
      props: {
        place: {
          name: 'テスト場所',
          description: null,
          location: null,
        },
      },
    });

    expect(screen.getByText('テスト場所')).toBeInTheDocument();
  });
});

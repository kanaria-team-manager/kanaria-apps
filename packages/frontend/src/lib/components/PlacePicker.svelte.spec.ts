import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PlacePicker from './PlacePicker.svelte';

// Mock places data
const mockPlaces = [
  { id: '1', name: 'グラウンドA', description: '第一グラウンド', location: { x: 139.69, y: 35.68 } },
  { id: '2', name: '体育館', description: '室内練習場', location: null },
];

describe('PlacePicker Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a select dropdown with places', async () => {
    render(PlacePicker, {
      props: {
        places: mockPlaces,
        value: '',
      },
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check options exist
    expect(screen.getByText('グラウンドA')).toBeInTheDocument();
    expect(screen.getByText('体育館')).toBeInTheDocument();
  });

  it('calls onchange when a place is selected', async () => {
    const handleChange = vi.fn();
    render(PlacePicker, {
      props: {
        places: mockPlaces,
        value: '',
        onchange: handleChange,
      },
    });

    const select = screen.getByRole('combobox');
    await fireEvent.change(select, { target: { value: '1' } });

    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('displays a map when a place with location is selected', async () => {
    render(PlacePicker, {
      props: {
        places: mockPlaces,
        value: '1', // Place with location
      },
    });

    // MapPicker should be present when location exists
    // We check for the map container or related element
    const mapContainer = document.querySelector('.leaflet-container') 
        || screen.queryByText('地図');
    // Since MapPicker is async-loaded, we might need to wait
    // For now, let's check if map section is rendered
    expect(screen.getByText('地図')).toBeInTheDocument();
  });

  it('does not display map when place has no location', async () => {
    render(PlacePicker, {
      props: {
        places: mockPlaces,
        value: '2', // Place without location
      },
    });

    // No map should be displayed
    expect(screen.queryByText('地図')).not.toBeInTheDocument();
  });
});

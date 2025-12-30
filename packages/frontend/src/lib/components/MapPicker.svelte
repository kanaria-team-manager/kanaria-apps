<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import 'leaflet/dist/leaflet.css';

  let Map: any; 
  let mapInstance: any;
  let markerInstance: any;
  let L: any;

  const { value = null, readonly = false, onchange } = $props<{ 
    value?: {x: number, y: number} | null,
    readonly?: boolean, 
    onchange?: (val: {x: number, y: number}) => void 
  }>();

  let mapElement: HTMLElement;

  // Default center (Tokyo)
  const defaultCenter = [35.6895, 139.6917];

  onMount(async () => {
    if (browser) {
      const leaflet = await import('leaflet');
      L = leaflet.default;

      // Fix marker icon issue in Leaflet with Webpack/Vite
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      initMap();
    }
  });

  onDestroy(() => {
    if (mapInstance) {
      mapInstance.remove();
    }
  });

  function initMap() {
    if (!mapElement) return;

    const initialCenter = value ? [value.y, value.x] : defaultCenter; // value is {x:lng, y:lat} usually, Leaflet uses [lat, lng]
    // Wait, let's standardize:
    // Postgres Point: (x, y). Traditionally (lng, lat) in GIS (x=lng, y=lat). Leaflet takes [lat, lng].
    // So if value is {x, y} (lng, lat), then center is [y, x].
    
    mapInstance = L.map(mapElement).setView(initialCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    if (value) {
      addMarker(value.y, value.x);
    }

    if (!readonly) {
      mapInstance.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        // lat=y, lng=x
        updateValue(lng, lat);
        addMarker(lat, lng);
      });
    }
  }

  function addMarker(lat: number, lng: number) {
    if (markerInstance) {
      markerInstance.setLatLng([lat, lng]);
    } else {
      markerInstance = L.marker([lat, lng]).addTo(mapInstance);
    }
  }

  function updateValue(x: number, y: number) {
    if (onchange) {
      onchange({ x, y });
    }
  }
  
  // Watch for external value changes
  $effect(() => {
    if (mapInstance && value) {
        // Only update if significantly different to avoid loop/jitters or if marker is missing
        if (!markerInstance) {
            addMarker(value.y, value.x);
            mapInstance.setView([value.y, value.x], 13);
        } else {
            const cur = markerInstance.getLatLng();
            if (Math.abs(cur.lat - value.y) > 0.0001 || Math.abs(cur.lng - value.x) > 0.0001) {
                markerInstance.setLatLng([value.y, value.x]);
                mapInstance.setView([value.y, value.x], 13); // Optional: pan to new location
            }
        }
    }
  });

</script>

<div class="w-full h-full min-h-[300px] rounded-md border border-border z-0" bind:this={mapElement}></div>

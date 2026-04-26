import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, input, signal, viewChild } from '@angular/core';
import { AuthSessionLocation } from '../../../features/settings/models/auth-session.model';

@Component({
  selector: 'app-session-location-map',
  standalone: true,
  imports: [],
  templateUrl: './session-location-map.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLocationMapComponent implements AfterViewInit, OnDestroy {
  readonly initialLocation = input<AuthSessionLocation | null>(null);
  readonly lastLocation = input<AuthSessionLocation | null>(null);
  readonly initialPointLabel = input('Initial point');
  readonly lastPointLabel = input('Latest point');
  readonly containerClass = input('h-72 w-full rounded-2xl');

  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private leafletModule: typeof import('leaflet') | null = null;
  private map: import('leaflet').Map | null = null;
  private layerGroup: import('leaflet').LayerGroup | null = null;
  private readonly viewInitialized = signal(false);

  private readonly renderEffect = effect(() => {
    const host = this.mapContainer()?.nativeElement;
    const initialLocation = this.initialLocation();
    const lastLocation = this.lastLocation();
    const initialPointLabel = this.initialPointLabel();
    const lastPointLabel = this.lastPointLabel();

    if (!this.viewInitialized() || !host) {
      return;
    }

    queueMicrotask(() => {
      void this.renderMapAsync(host, initialLocation, lastLocation, initialPointLabel, lastPointLabel);
    });
  });

  ngAfterViewInit(): void {
    this.viewInitialized.set(true);
  }

  ngOnDestroy(): void {
    this.layerGroup?.clearLayers();
    this.map?.remove();
    this.layerGroup = null;
    this.map = null;
  }

  private async renderMapAsync(
    host: HTMLDivElement,
    initialLocation: AuthSessionLocation | null,
    lastLocation: AuthSessionLocation | null,
    initialPointLabel: string,
    lastPointLabel: string,
  ): Promise<void> {
    const points = [initialLocation, lastLocation]
      .filter((location): location is AuthSessionLocation => this.hasCoordinates(location));

    if (!points.length) {
      this.layerGroup?.clearLayers();
      return;
    }

    if (!this.leafletModule) {
      this.leafletModule = await import('leaflet');
    }

    const L = this.leafletModule;
    if (!this.map) {
      this.map = L.map(host, {
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      this.layerGroup = L.layerGroup().addTo(this.map);
    }

    this.layerGroup?.clearLayers();

    const bounds = L.latLngBounds([]);
    for (const point of points) {
      const latLng = L.latLng(point.latitude!, point.longitude!);
      bounds.extend(latLng);

      const isInitial = point === initialLocation;
      const marker = L.circleMarker(latLng, {
        radius: isInitial ? 9 : 7,
        color: isInitial ? '#1d4ed8' : '#059669',
        weight: 3,
        fillColor: isInitial ? '#60a5fa' : '#34d399',
        fillOpacity: 0.8,
      });

      marker.bindPopup(this.buildPopupLabel(point, isInitial ? initialPointLabel : lastPointLabel));
      marker.addTo(this.layerGroup!);
    }

    if (points.length === 1) {
      this.map.setView([points[0].latitude!, points[0].longitude!], 12);
    } else {
      this.map.fitBounds(bounds.pad(0.18));
    }

    queueMicrotask(() => this.map?.invalidateSize());
  }

  private hasCoordinates(location: AuthSessionLocation | null): location is AuthSessionLocation {
    return !!location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
  }

  private buildPopupLabel(location: AuthSessionLocation, prefix: string): string {
    const label = location.label?.trim();
    const coordinates = `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`;
    return label ? `${prefix}: ${label}<br>${coordinates}` : `${prefix}<br>${coordinates}`;
  }
}

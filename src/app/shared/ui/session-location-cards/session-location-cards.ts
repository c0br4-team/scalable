import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthSessionLocation } from '../../../features/settings/models/auth-session.model';

@Component({
  selector: 'app-session-location-cards',
  standalone: true,
  templateUrl: './session-location-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLocationCardsComponent {
  readonly initialLocation = input<AuthSessionLocation | null>(null);
  readonly lastLocation = input<AuthSessionLocation | null>(null);
  readonly initialPointLabel = input('Initial point');
  readonly lastPointLabel = input('Latest point');
  readonly coordinatesLabel = input('Coordinates');
  readonly accuracyLabel = input('Accuracy');
  readonly notAvailableLabel = input('Not available');

  private readonly translate = inject(TranslateService);

  protected formatLocation(location: AuthSessionLocation | null): string {
    if (!location) {
      return this.notAvailableLabel();
    }

    const label = location.label?.trim();
    const coordinates = this.formatCoordinates(location);
    const source = this.translate.instant(`AUTH_SESSIONS.LOCATION_SOURCE.${location.source.toUpperCase()}`);

    if (label && coordinates) {
      return `${label} · ${source} · ${coordinates}`;
    }

    if (label) {
      return `${label} · ${source}`;
    }

    if (coordinates) {
      return `${source} · ${coordinates}`;
    }

    return source;
  }

  protected formatCoordinates(location: AuthSessionLocation | null): string {
    if (!this.hasCoordinates(location)) {
      return '';
    }

    return `${location.latitude!.toFixed(5)}, ${location.longitude!.toFixed(5)}`;
  }

  protected formatAccuracy(location: AuthSessionLocation | null): string {
    if (!location?.accuracyMeters) {
      return this.notAvailableLabel();
    }

    return `${location.accuracyMeters.toFixed(0)} m`;
  }

  private hasCoordinates(location: AuthSessionLocation | null): location is AuthSessionLocation {
    return !!location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
  }
}

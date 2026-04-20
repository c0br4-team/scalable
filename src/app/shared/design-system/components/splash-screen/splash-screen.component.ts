import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SplashScreenService } from '../../services/splash-screen.service';

@Component({
  selector: 'sce-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-label': 'Loading',
    'aria-live': 'polite',
    role: 'status',
  },
})
export class SplashScreenComponent implements OnInit {
  private readonly splash = inject(SplashScreenService);

  ngOnInit(): void {
    requestAnimationFrame(() => this.splash.hide());
  }
}

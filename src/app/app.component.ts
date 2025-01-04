import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Subscription, take } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnvService } from '@myrmidon/ngx-tools';
import {
  User,
  AuthJwtService,
  GravatarService,
  GravatarPipe,
} from '@myrmidon/auth-jwt-login';

import { ThesaurusEntry, Thesaurus } from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    GravatarPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private _authSub?: Subscription;
  private _brSub?: Subscription;

  public user?: User;
  public logged?: boolean;
  public itemBrowsers?: ThesaurusEntry[];
  public version: string;

  constructor(
    @Inject('itemBrowserKeys')
    private _itemBrowserKeys: { [key: string]: string },
    private _authService: AuthJwtService,
    private _gravatarService: GravatarService,
    private _appRepository: AppRepository,
    private _router: Router,
    env: EnvService
  ) {
    this.version = env.get('version') || '';
  }

  ngOnInit(): void {
    this._router.navigate(['/home']);
    this.user = this._authService.currentUserValue || undefined;
    this.logged = this.user !== null;

    this._authSub = this._authService.currentUser$.subscribe(
      (user: User | null) => {
        this.logged = this._authService.isAuthenticated(true);
        this.user = user || undefined;
        if (user) {
          this._appRepository.load();
        }
      }
    );

    this._brSub = this._appRepository.itemBrowserThesaurus$.subscribe(
      (thesaurus: Thesaurus | undefined) => {
        this.itemBrowsers = thesaurus ? thesaurus.entries : undefined;
      }
    );
  }

  ngOnDestroy(): void {
    this._authSub?.unsubscribe();
    this._brSub?.unsubscribe();
  }

  public getItemBrowserRoute(id: string): string {
    return this._itemBrowserKeys[id] || id;
  }

  public logout(): void {
    if (!this.logged) {
      return;
    }
    this._authService
      .logout()
      .pipe(take(1))
      .subscribe((_) => {
        this._router.navigate(['/home']);
      });
  }
}

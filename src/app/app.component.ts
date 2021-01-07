import { Component } from '@angular/core';
import { AuthService } from '@myrmidon/cadmus-api';
import { GravatarService, User } from '@myrmidon/cadmus-core';

@Component({
  selector: 'biblio-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public user?: User;
  public logged?: boolean;

  constructor(
    private _authService: AuthService,
    private _gravatarService: GravatarService
  ) {}

  ngOnInit(): void {
    this.user = this._authService.currentUserValue;
    this.logged = this.user !== null;

    this._authService.currentUser$.subscribe((user: User) => {
      this.logged = this._authService.isAuthenticated(true);
      this.user = user;
    });
  }

  public getGravatarUrl(email?: string, size = 80): string {
    if (!email) {
      return '';
    }
    return this._gravatarService.buildGravatarUrl(email, size);
  }

  public logout(): void {
    if (!this.logged) {
      return;
    }
    this._authService.logout();
  }
}

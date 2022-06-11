import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';

// material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { DemoComponent } from './demo/demo.component';
import { WorkPageComponent } from './work-page/work-page.component';
import { PartPageComponent } from './part-page/part-page.component';
import { CadmusUiPgModule } from '@myrmidon/cadmus-ui-pg';
import { EnvServiceProvider, NgToolsModule } from '@myrmidon/ng-tools';
import {
  AuthJwtInterceptor,
  AuthJwtLoginModule,
} from '@myrmidon/auth-jwt-login';
import { AuthJwtAdminModule } from '@myrmidon/auth-jwt-admin';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginPageComponent } from './login-page/login-page.component';

// import from projects for faster debug, not to be done in production:
import { CadmusBiblioCoreModule } from 'projects/myrmidon/cadmus-biblio-core/src/public-api';
import { CadmusBiblioApiModule } from 'projects/myrmidon/cadmus-biblio-api/src/public-api';
import { CadmusBiblioUiModule } from 'projects/myrmidon/cadmus-biblio-ui/src/public-api';
import { CadmusPartBiblioUiModule } from 'projects/myrmidon/cadmus-part-biblio-ui/src/public-api';

// import { CadmusBiblioCoreModule } from '@myrmidon/cadmus-biblio-core';
// import { CadmusBiblioApiModule } from '@myrmidon/cadmus-biblio-api';
// import { CadmusBiblioUiModule } from '@myrmidon/cadmus-biblio-ui';
// import { CadmusPartBiblioUiModule } from '@myrmidon/cadmus-part-biblio-ui';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DemoComponent,
    WorkPageComponent,
    PartPageComponent,
    LoginPageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ClipboardModule,
    RouterModule.forRoot(
      [
        { path: '', redirectTo: 'home', pathMatch: 'full' },
        { path: 'home', component: HomeComponent },
        { path: 'demo', component: DemoComponent },
        { path: 'works', component: WorkPageComponent },
        { path: 'part', component: PartPageComponent },
        // auth
        { path: 'login', component: LoginPageComponent },
        { path: '**', component: HomeComponent },
      ],
      {
        initialNavigation: 'enabledBlocking',
        useHash: true,
        relativeLinkResolution: 'legacy',
      }
    ),
    // material
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatToolbarModule,
    // flex
    FlexLayoutModule,
    // Akita
    AkitaNgDevtools.forRoot(),
    // myrmidon
    NgToolsModule,
    NgMatToolsModule,
    AuthJwtLoginModule,
    AuthJwtAdminModule,
    // Cadmus
    CadmusCoreModule,
    CadmusUiModule,
    CadmusUiPgModule,
    // Biblio
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
    CadmusBiblioUiModule,
    CadmusPartBiblioUiModule,
  ],
  providers: [
    EnvServiceProvider,
    // HTTP interceptor
    // https://medium.com/@ryanchenkie_40935/angular-authentication-using-the-http-client-and-http-interceptors-2f9d1540eb8
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthJwtInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

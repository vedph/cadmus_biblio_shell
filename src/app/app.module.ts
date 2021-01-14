import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard'

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CadmusCoreModule, EnvServiceProvider } from '@myrmidon/cadmus-core';
import { CadmusMaterialModule } from '@myrmidon/cadmus-material';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '@myrmidon/cadmus-api';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { DemoComponent } from './demo/demo.component';
import { CadmusBiblioCoreModule } from 'projects/myrmidon/cadmus-biblio-core/src/public-api';
import { CadmusBiblioApiModule } from 'projects/myrmidon/cadmus-biblio-api/src/public-api';
import { CadmusBiblioUiModule } from 'projects/myrmidon/cadmus-biblio-ui/src/public-api';
import { WorkPageComponent } from './work-page/work-page.component';
// import { CadmusBiblioCoreModule } from '@myrmidon/cadmus-biblio-core';
// import { CadmusBiblioApiModule } from '@myrmidon/cadmus-biblio-api';
// import { CadmusBiblioUiModule } from '@myrmidon/cadmus-biblio-ui';

@NgModule({
  declarations: [AppComponent, HomeComponent, DemoComponent, WorkPageComponent],
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
        {
          path: 'login',
          loadChildren: () =>
            import('@myrmidon/cadmus-login').then(
              (module) => module.CadmusLoginModule
            ),
        },
        { path: '**', component: HomeComponent },
      ],
      {
        initialNavigation: 'enabled',
        useHash: true,
        relativeLinkResolution: 'legacy',
      }
    ),
    // flex
    FlexLayoutModule,
    // Akita
    AkitaNgDevtools.forRoot(),
    // Cadmus
    CadmusCoreModule,
    CadmusMaterialModule,
    CadmusUiModule,
    // Biblio
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
    CadmusBiblioUiModule,
  ],
  providers: [
    EnvServiceProvider,
    // HTTP interceptor
    // https://medium.com/@ryanchenkie_40935/angular-authentication-using-the-http-client-and-http-interceptors-2f9d1540eb8
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

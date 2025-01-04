import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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

// vendor
import { NgeMonacoModule } from '@cisstech/nge/monaco';
import { NgeMarkdownModule } from '@cisstech/nge/markdown';

// myrmidon
import {
  EllipsisPipe,
  FlatLookupPipe,
  SafeHtmlPipe,
} from '@myrmidon/ngx-tools';
import {
  AuthJwtAdminGuardService,
  AuthJwtGuardService,
  AuthJwtLoginComponent,
  GravatarPipe,
  authJwtInterceptor,
} from '@myrmidon/auth-jwt-login';
import {
  AuthJwtRegistrationComponent,
  UserListComponent,
} from '@myrmidon/auth-jwt-admin';

// bricks
import { RefLookupComponent } from '@myrmidon/cadmus-refs-lookup';

// cadmus
import { EditorGuardService } from '@myrmidon/cadmus-api';
import { PendingChangesGuard } from '@myrmidon/cadmus-core';

import { AppComponent } from './app.component';
import { BiblioPageComponent } from './biblio-page/biblio-page.component';
import { DemoComponent } from './demo/demo.component';
import { HomeComponent } from './home/home.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { WorkPageComponent } from './work-page/work-page.component';
import { PartPageComponent } from './part-page/part-page.component';
import { ManageUsersPageComponent } from './manage-users-page/manage-users-page.component';
import { RegisterUserPageComponent } from './register-user-page/register-user-page.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PART_EDITOR_KEYS } from './part-editor-keys';
import { INDEX_LOOKUP_DEFINITIONS } from './index-lookup-definitions';
import { ITEM_BROWSER_KEYS } from './item-browser-keys';
import { ExtBibliographyPartComponent } from 'projects/myrmidon/cadmus-part-biblio-ui/src/public-api';
import {
  KeywordPickerComponent,
  WorkAuthorsComponent,
  WorkBrowserComponent,
  WorkComponent,
  WorkDetailsComponent,
  WorkFilterComponent,
  WorkKeywordsComponent,
  WorkListComponent,
} from 'projects/myrmidon/cadmus-biblio-ui/src/public-api';

@NgModule({
  declarations: [
    AppComponent,
    BiblioPageComponent,
    DemoComponent,
    HomeComponent,
    LoginPageComponent,
    ManageUsersPageComponent,
    PartPageComponent,
    RegisterUserPageComponent,
    ResetPasswordComponent,
    WorkPageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ClipboardModule,
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'demo', component: DemoComponent },
      { path: 'works', component: WorkPageComponent },
      { path: 'part', component: PartPageComponent },
      // auth
      { path: 'login', component: LoginPageComponent },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        canActivate: [AuthJwtGuardService],
      },
      {
        path: 'register-user',
        component: RegisterUserPageComponent,
        canActivate: [AuthJwtAdminGuardService],
      },
      {
        path: 'manage-users',
        component: ManageUsersPageComponent,
        canActivate: [AuthJwtAdminGuardService],
      },
      // cadmus - items
      {
        path: 'items/:id',
        loadComponent: () =>
          import('@myrmidon/cadmus-item-editor').then(
            (module) => module.ItemEditorComponent
          ),
        canActivate: [AuthJwtGuardService],
        canDeactivate: [PendingChangesGuard],
      },
      {
        path: 'items',
        loadComponent: () =>
          import('@myrmidon/cadmus-item-list').then(
            (module) => module.ItemListComponent
          ),
        canActivate: [AuthJwtGuardService],
      },
      {
        path: 'search',
        loadComponent: () =>
          import('@myrmidon/cadmus-item-search').then(
            (module) => module.ItemSearchComponent
          ),
        canActivate: [AuthJwtGuardService],
      },
      // cadmus - thesauri
      {
        path: 'thesauri/:id',
        loadComponent: () =>
          import('@myrmidon/cadmus-thesaurus-editor').then(
            (module) => module.ThesaurusEditorFeatureComponent
          ),
        canActivate: [EditorGuardService],
      },
      {
        path: 'thesauri',
        loadComponent: () =>
          import('@myrmidon/cadmus-thesaurus-list').then(
            (module) => module.ThesaurusListComponent
          ),
        canActivate: [EditorGuardService],
      },
      // cadmus - parts
      {
        path: 'items/:iid/general',
        loadChildren: () =>
          import('@myrmidon/cadmus-part-general-pg').then(
            (module) => module.CadmusPartGeneralPgModule
          ),
        canActivate: [AuthJwtGuardService],
      },
      // biblio - parts
      {
        path: 'items/:iid/biblio',
        loadChildren: () =>
          import('@myrmidon/cadmus-part-biblio-pg').then(
            (module) => module.CadmusPartBiblioPgModule
          ),
        canActivate: [AuthJwtGuardService],
      },
      // cadmus - flags
      {
        path: 'flags',
        loadComponent: () =>
          import('@myrmidon/cadmus-flags-pg').then(
            (module) => module.FlagsEditorFeatureComponent
          ),
        canActivate: [AuthJwtGuardService],
      },
      // cadmus - graph
      {
        path: 'graph',
        loadComponent: () =>
          import('@myrmidon/cadmus-graph-pg-ex').then(
            (module) => module.GraphEditorExFeatureComponent
          ),
        canActivate: [AuthJwtGuardService],
      },
      // cadmus - preview
      {
        path: 'preview',
        loadChildren: () =>
          import('@myrmidon/cadmus-preview-pg').then(
            (module) => module.CadmusPreviewPgModule
          ),
        canActivate: [AuthJwtGuardService],
      },
      // biblio
      {
        path: 'biblio',
        component: BiblioPageComponent,
        canActivate: [AuthJwtAdminGuardService],
      },
      // home
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      // fallback
      { path: '**', component: HomeComponent },
    ]),
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
    // vendors
    NgeMonacoModule.forRoot({}),
    NgeMarkdownModule,
    // myrmidon
    EllipsisPipe,
    FlatLookupPipe,
    SafeHtmlPipe,
    AuthJwtLoginComponent,
    AuthJwtRegistrationComponent,
    UserListComponent,
    GravatarPipe,
    // cadmus
    RefLookupComponent,
    ExtBibliographyPartComponent,
    KeywordPickerComponent,
    WorkKeywordsComponent,
    WorkAuthorsComponent,
    WorkListComponent,
    WorkFilterComponent,
    WorkComponent,
    WorkBrowserComponent,
    WorkDetailsComponent
  ],
  providers: [
    provideHttpClient(withInterceptors([authJwtInterceptor])),
    // parts and fragments type IDs to editor group keys mappings
    // https://github.com/nrwl/nx/issues/208#issuecomment-384102058
    // inject like: @Inject('partEditorKeys') partEditorKeys: PartEditorKeys
    {
      provide: 'partEditorKeys',
      useValue: PART_EDITOR_KEYS,
    },
    // index lookup definitions
    {
      provide: 'indexLookupDefinitions',
      useValue: INDEX_LOOKUP_DEFINITIONS,
    },
    // item browsers IDs to editor keys mappings
    // inject like: @Inject('itemBrowserKeys') itemBrowserKeys: { [key: string]: string }
    {
      provide: 'itemBrowserKeys',
      useValue: ITEM_BROWSER_KEYS,
    },
    // HTTP interceptor
    // https://medium.com/@ryanchenkie_40935/angular-authentication-using-the-http-client-and-http-interceptors-2f9d1540eb8
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: AuthJwtInterceptor,
    //   multi: true,
    // },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

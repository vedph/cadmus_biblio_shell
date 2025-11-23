import { Routes } from '@angular/router';

import { jwtGuard, jwtAdminGuard } from '@myrmidon/auth-jwt-login';
import { editorGuard } from '@myrmidon/cadmus-api';
import { PendingChangesGuard } from '@myrmidon/cadmus-core';

import { BiblioPageComponent } from './biblio-page/biblio-page.component';
import { DemoComponent } from './demo/demo.component';
import { HomeComponent } from './home/home.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { ManageUsersPageComponent } from './manage-users-page/manage-users-page.component';
import { PartPageComponent } from './part-page/part-page.component';
import { RegisterUserPageComponent } from './register-user-page/register-user-page.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { WorkPageComponent } from './work-page/work-page.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'demo', component: DemoComponent },
  { path: 'works', component: WorkPageComponent },
  { path: 'part', component: PartPageComponent },
  // auth
  { path: 'login', component: LoginPageComponent },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [jwtGuard],
  },
  {
    path: 'register-user',
    component: RegisterUserPageComponent,
    canActivate: [jwtAdminGuard],
  },
  {
    path: 'manage-users',
    component: ManageUsersPageComponent,
    canActivate: [jwtAdminGuard],
  },
  // cadmus - items
  {
    path: 'items/:id',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-editor').then(
        (module) => module.ItemEditorComponent
      ),
    canActivate: [jwtGuard],
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'items',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-list').then(
        (module) => module.ItemListComponent
      ),
    canActivate: [jwtGuard],
  },
  {
    path: 'search',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-search').then(
        (module) => module.ItemSearchComponent
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - thesauri
  {
    path: 'thesauri/:id',
    loadComponent: () =>
      import('@myrmidon/cadmus-thesaurus-editor').then(
        (module) => module.ThesaurusEditorFeatureComponent
      ),
    canActivate: [editorGuard],
  },
  {
    path: 'thesauri',
    loadComponent: () =>
      import('@myrmidon/cadmus-thesaurus-list').then(
        (module) => module.ThesaurusListComponent
      ),
    canActivate: [editorGuard],
  },
  // cadmus - parts
  {
    path: 'items/:iid/general',
    loadChildren: () =>
      import('@myrmidon/cadmus-part-general-pg').then(
        (module) => module.CADMUS_PART_GENERAL_PG_ROUTES
      ),
    canActivate: [jwtGuard],
  },
  // biblio - parts
  {
    path: 'items/:iid/biblio',
    loadChildren: () =>
      import('@myrmidon/cadmus-part-biblio-pg').then(
        (module) => module.CadmusPartBiblioPgModule
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - flags
  {
    path: 'flags',
    loadComponent: () =>
      import('@myrmidon/cadmus-flags-pg').then(
        (module) => module.FlagsEditorFeatureComponent
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - graph
  {
    path: 'graph',
    loadComponent: () =>
      import('@myrmidon/cadmus-graph-pg-ex').then(
        (module) => module.GraphEditorExFeatureComponent
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - preview
  {
    path: 'preview',
    loadChildren: () =>
      import('@myrmidon/cadmus-preview-pg').then(
        (module) => module.CADMUS_PART_PREVIEW_PG_ROUTES
      ),
    canActivate: [jwtGuard],
  },
  // biblio
  {
    path: 'biblio',
    component: BiblioPageComponent,
    canActivate: [jwtAdminGuard],
  },
  // home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // fallback
  { path: '**', component: HomeComponent },
];

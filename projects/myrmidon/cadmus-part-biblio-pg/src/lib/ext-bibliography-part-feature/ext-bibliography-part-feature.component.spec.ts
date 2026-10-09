import { Component } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { EditedObject } from '@myrmidon/cadmus-core';
import {
  EXT_BIBLIOGRAPHY_PART_TYPEID,
  ExtBibliographyPart,
} from '@myrmidon/cadmus-part-biblio-ui';
import { AppRepository, PartEditorService } from '@myrmidon/cadmus-state';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-ui-pg';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { LocalStorageService } from '@myrmidon/ngx-tools';

import { ExtBibliographyPartFeatureComponent } from './ext-bibliography-part-feature.component';

// the real bar depends on the whole app state
@Component({ selector: 'cadmus-current-item-bar', template: '' })
class CurrentItemBarStubComponent {}

const PART: ExtBibliographyPart = {
  id: 'p1',
  itemId: 'i1',
  typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
  timeCreated: new Date(2024, 0, 1),
  creatorId: 'zeus',
  timeModified: new Date(2024, 0, 1),
  userId: 'zeus',
  entries: [
    { id: 'w1', label: 'Doe - Alpha, 2000', tag: 'pri' },
    { id: 'w2', label: 'Roe - Beta, 2010' },
  ],
};

const DATA: EditedObject<ExtBibliographyPart> = {
  value: PART,
  thesauri: {
    'ext-biblio-work-tags': {
      id: 'ext-biblio-work-tags@en',
      language: 'en',
      entries: [
        { id: 'pri', value: 'primary' },
        { id: 'sec', value: 'secondary' },
      ],
    },
  },
};

/** Async observable, like HTTP responses. */
function later<T>(value: T): Observable<T> {
  return of(value).pipe(delay(0));
}

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 10));
  await fixture.whenStable();
}

async function setup(pid = 'p1') {
  const user = { userName: 'zeus', roles: ['editor'] };
  const editorService = {
    loading$: of(false),
    saving$: of(false),
    load: vi.fn(() => Promise.resolve(DATA)),
    save: vi.fn((part: ExtBibliographyPart) =>
      Promise.resolve({ ...part, id: part.id || 'new-id' })
    ),
  };
  const router = { navigate: vi.fn() };
  const snackbar = { open: vi.fn() };
  const route = {
    snapshot: {
      params: { iid: 'i1', pid },
      queryParams: {},
      routeConfig: { path: `${EXT_BIBLIOGRAPHY_PART_TYPEID}/:pid` },
    },
  };
  const result = await render(ExtBibliographyPartFeatureComponent, {
    importOverrides: [
      { replace: CurrentItemBarComponent, with: CurrentItemBarStubComponent },
    ],
    providers: [
      { provide: PartEditorService, useValue: editorService },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: route },
      { provide: MatSnackBar, useValue: snackbar },
      { provide: ItemService, useValue: {} },
      { provide: ThesaurusService, useValue: {} },
      {
        provide: AuthJwtService,
        useValue: {
          currentUserValue: user,
          currentUser$: new BehaviorSubject(user),
        },
      },
      { provide: AppRepository, useValue: { getTypeThesaurus: () => undefined } },
      {
        provide: BiblioService,
        useValue: {
          getWorks: () => later({ pageNumber: 1, pageSize: 10, total: 0, items: [] }),
          getWorkTypes: () =>
            later({ pageNumber: 1, pageSize: 0, total: 0, items: [] }),
        },
      },
      { provide: DialogService, useValue: { confirm: () => later(true) } },
      {
        provide: LocalStorageService,
        useValue: { retrieve: () => null, store: vi.fn() },
      },
      { provide: ViewportScroller, useValue: { scrollToAnchor: vi.fn() } },
      provideNativeDateAdapter(),
    ],
  });
  await settle(result.fixture);
  return {
    ...result,
    editorService,
    router,
    snackbar,
    user: userEvent.setup(),
  };
}

describe('ExtBibliographyPartFeatureComponent', () => {
  it('should load the part with its thesauri', async () => {
    const { editorService } = await setup();
    expect(editorService.load).toHaveBeenCalledWith(
      {
        itemId: 'i1',
        typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
        partId: 'p1',
        roleId: undefined,
      },
      [
        'ext-biblio-author-roles',
        'ext-biblio-languages',
        'ext-biblio-work-tags',
        'ext-biblio-link-scopes',
      ]
    );
    // the editor got the loaded data
    expect(screen.getByText(/Doe - Alpha, 2000/)).toBeInTheDocument();
    expect(screen.getByText(/Roe - Beta, 2010/)).toBeInTheDocument();
    const tags = screen.getAllByRole('combobox', { name: 'tag' });
    await vi.waitFor(() => expect(tags[0]).toHaveTextContent('primary'));
  });

  it('should load a new part with a null part ID', async () => {
    const { editorService } = await setup('new');
    expect(editorService.load).toHaveBeenCalledWith(
      expect.objectContaining({ partId: null }),
      expect.any(Array)
    );
  });

  it('should save the edited part', async () => {
    const { user, editorService, snackbar, fixture } = await setup();
    await user.click(
      screen
        .getAllByRole('button', { description: 'Remove this work from list' })
        .filter((b) => !b.closest('table'))[0]
    );
    await settle(fixture);
    await user.click(screen.getByRole('button', { name: /save/ }));
    await settle(fixture);
    expect(editorService.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', entries: [PART.entries[1]] })
    );
    expect(snackbar.open).toHaveBeenCalledWith('Part saved', 'OK', {
      duration: 3000,
    });
  });

  it('should go back to the item on close', async () => {
    const { user, router } = await setup();
    await user.click(screen.getByRole('button', { name: /close/ }));
    expect(router.navigate).toHaveBeenCalledWith(['items', 'i1']);
  });
});

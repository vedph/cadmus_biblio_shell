import { inputBinding, outputBinding } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { render, screen, within } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject, delay, Observable, of, Subject } from 'rxjs';

import { BiblioService, WorkFilter } from '@myrmidon/cadmus-biblio-api';
import { Container, Work, WorkInfo } from '@myrmidon/cadmus-biblio-core';
import { DataPage, LocalStorageService } from '@myrmidon/ngx-tools';

import { WorkBrowserComponent } from './work-browser.component';

function info(id: string, props: Partial<WorkInfo> = {}): WorkInfo {
  return {
    isContainer: false,
    id,
    key: `key-${id}`,
    authors: [{ first: 'John', last: 'Doe' }],
    type: 'book',
    title: `Title ${id}`,
    language: 'eng',
    edition: 1,
    yearPub: 2000,
    placePub: 'Rome',
    ...props,
  };
}

function page(items: WorkInfo[], pageNumber = 1, total = 0): DataPage<WorkInfo> {
  return {
    pageNumber,
    pageSize: 20,
    pageCount: 3,
    total: total || items.length,
    items,
  };
}

const WORKS = [
  info('w1', {
    key: '!Manual 2000',
    container: { key: 'j', type: 'journal', title: 'Journal', language: 'eng' },
    number: '3',
  }),
  info('w2', { yearPub: 0, authors: [] }),
];
const CONTAINERS = [info('c1', { isContainer: true, title: 'Proceedings' })];

const WORK: Work = {
  id: 'w1',
  key: 'Doe 2000',
  type: 'book',
  title: 'Title w1',
  language: 'eng',
  yearPub: 2000,
  authors: [{ first: 'John', last: 'Doe' }],
};
const CONTAINER: Container = {
  id: 'c1',
  key: 'P 2001',
  type: 'procs',
  title: 'Proceedings',
  language: 'eng',
  yearPub: 2001,
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

interface SetupOptions {
  inputs?: Record<string, unknown>;
  storedFilter?: WorkFilter | null;
  getWorks?: (f: WorkFilter) => Observable<DataPage<WorkInfo>>;
}

async function setup(options: SetupOptions = {}) {
  const biblio = {
    getWorks: vi.fn(options.getWorks ?? ((f: WorkFilter) =>
      later(page(WORKS, f.pageNumber, 45)))),
    getContainers: vi.fn(() => later(page(CONTAINERS))),
    getWork: vi.fn(() => later(WORK)),
    getContainer: vi.fn(() => later(CONTAINER)),
    getWorkTypes: vi.fn(() => later({ pageNumber: 1, pageSize: 0, total: 0, items: [] })),
    getAuthor: vi.fn(),
  };
  const storage = {
    retrieve: vi.fn(() => options.storedFilter ?? null),
    store: vi.fn(),
  };
  const scroller = { scrollToAnchor: vi.fn() };
  const signals$ = new BehaviorSubject<string>('');
  const outputs = {
    workPick: vi.fn(),
    workAdd: vi.fn(),
    workEdit: vi.fn(),
    workDelete: vi.fn(),
  };
  const result = await render(WorkBrowserComponent, {
    bindings: [
      inputBinding('signals$', () => signals$),
      ...Object.entries(options.inputs ?? {}).map(([k, v]) =>
        inputBinding(k, () => v)
      ),
      ...Object.entries(outputs).map(([k, fn]) => outputBinding(k, fn)),
    ],
    providers: [
      { provide: BiblioService, useValue: biblio },
      { provide: LocalStorageService, useValue: storage },
      { provide: ViewportScroller, useValue: scroller },
    ],
  });
  await settle(result.fixture);
  return {
    ...result,
    biblio,
    storage,
    scroller,
    signals$,
    ...outputs,
    user: userEvent.setup(),
  };
}

function table(): HTMLElement {
  return screen.getAllByRole('table')[0];
}

function bodyRows(): HTMLElement[] {
  const [, body] = within(table()).getAllByRole('rowgroup');
  return within(body).queryAllByRole('row');
}

function cells(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole('cell')
    .slice(1)
    .map((c) => c.textContent!.trim());
}

describe('WorkBrowserComponent', () => {
  it('should load and list the first page of works', async () => {
    const { biblio } = await setup();
    expect(biblio.getWorks).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 20 })
    );
    const rows = bodyRows();
    expect(rows).toHaveLength(2);
    // manual key prefix is not shown; empty year is blank
    expect(cells(rows[0])).toEqual([
      'book',
      'Manual 2000',
      'Doe, John',
      'Title w1',
      'Journal',
      '3',
      '2000',
    ]);
    expect(cells(rows[1])).toEqual([
      'book',
      'key-w2',
      '',
      'Title w2',
      '',
      '',
      '',
    ]);
    expect(
      within(table()).getByRole('columnheader', { name: 'container' })
    ).toBeInTheDocument();
  });

  it('should switch to containers', async () => {
    const { user, biblio, fixture } = await setup();
    await user.click(screen.getByRole('checkbox', { name: 'container' }));
    await settle(fixture);
    expect(biblio.getContainers).toHaveBeenCalled();
    expect(bodyRows()).toHaveLength(1);
    expect(cells(bodyRows()[0])[3]).toBe('Proceedings');
    expect(
      within(table()).queryByRole('columnheader', { name: 'container' })
    ).not.toBeInTheDocument();
  });

  it('should emit pick, edit and delete for a work', async () => {
    const { user, workPick, workEdit, workDelete } = await setup();
    const row = bodyRows()[1];
    await user.click(
      within(row).getByRole('button', { description: 'Pick this work' })
    );
    await user.click(
      within(row).getByRole('button', { description: 'Edit this work' })
    );
    await user.click(
      within(row).getByRole('button', { description: 'Delete this work' })
    );
    expect(workPick).toHaveBeenCalledWith(WORKS[1]);
    expect(workEdit).toHaveBeenCalledWith(WORKS[1]);
    expect(workDelete).toHaveBeenCalledWith(WORKS[1]);
  });

  it('should emit add with the container flag', async () => {
    const { user, workAdd, fixture } = await setup();
    await user.click(screen.getByRole('button', { name: /new/ }));
    expect(workAdd).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole('checkbox', { name: 'container' }));
    await settle(fixture);
    await user.click(screen.getByRole('button', { name: /new/ }));
    expect(workAdd).toHaveBeenLastCalledWith(true);
  });

  it('should hide disabled actions', async () => {
    await setup({
      inputs: {
        addEnabled: false,
        pickEnabled: false,
        editEnabled: false,
        deleteEnabled: false,
      },
    });
    expect(screen.queryByRole('button', { name: /new/ })).not.toBeInTheDocument();
    const row = bodyRows()[0];
    expect(within(row).getAllByRole('button')).toHaveLength(1);
    expect(
      within(row).getByRole('button', { description: 'View work details' })
    ).toBeInTheDocument();
  });

  it('should show the details of a work', async () => {
    const { user, biblio, scroller } = await setup();
    await user.click(
      within(bodyRows()[0]).getByRole('button', {
        description: 'View work details',
      })
    );
    expect(biblio.getWork).toHaveBeenCalledWith('w1');
    expect(
      await screen.findByRole('button', { name: 'Doe - Title w1, 2000' })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Doe 2000')).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(scroller.scrollToAnchor).toHaveBeenCalledWith('work-details')
    );
  });

  it('should show the details of a container', async () => {
    const { user, biblio, fixture } = await setup();
    await user.click(screen.getByRole('checkbox', { name: 'container' }));
    await settle(fixture);
    await user.click(
      screen.getByRole('button', { description: 'View work details' })
    );
    expect(biblio.getContainer).toHaveBeenCalledWith('c1');
    expect(
      await screen.findByRole('button', { name: ' - Proceedings, 2001'.trim() })
    ).toBeInTheDocument();
  });

  it('should load the requested page', async () => {
    const { user, biblio, fixture } = await setup();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await settle(fixture);
    expect(biblio.getWorks).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageNumber: 2, pageSize: 20 })
    );
    expect(screen.getByText(/21 – 40 of 45/)).toBeInTheDocument();
  });

  it('should apply a filter from the first page', async () => {
    const { user, biblio, fixture } = await setup();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await settle(fixture);
    await user.type(screen.getByRole('textbox', { name: 'title' }), 'alpha');
    await user.click(screen.getByRole('button', { description: 'Apply filters' }));
    await settle(fixture);
    expect(biblio.getWorks).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'alpha', pageNumber: 1, pageSize: 20 })
    );
  });

  it('should apply a persisted filter on load', async () => {
    const { biblio } = await setup({
      storedFilter: { pageNumber: 1, pageSize: 10, title: 'stored' },
    });
    expect(biblio.getWorks).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'stored', pageNumber: 1 })
    );
    expect(screen.getByRole('textbox', { name: 'title' })).toHaveValue('stored');
  });

  it('should show the page requested last when responses are out of order', async () => {
    const responses: Subject<DataPage<WorkInfo>>[] = [];
    const { user, fixture } = await setup({
      getWorks: () => {
        const s = new Subject<DataPage<WorkInfo>>();
        responses.push(s);
        return s;
      },
    });
    responses[0].next(page(WORKS, 1, 45));
    await settle(fixture);
    // request page 2, then reload page 2 with a filter
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.type(screen.getByRole('textbox', { name: 'title' }), 'x');
    await user.click(screen.getByRole('button', { description: 'Apply filters' }));
    expect(responses).toHaveLength(3);
    // last response arrives first, then the stale one
    responses[2].next(page([info('last')]));
    responses[1].next(page([info('stale')]));
    await settle(fixture);
    expect(bodyRows()).toHaveLength(1);
    expect(cells(bodyRows()[0])[3]).toBe('Title last');
  });

  it('should reload on refresh signal', async () => {
    const { biblio, signals$, fixture } = await setup();
    const count = biblio.getWorks.mock.calls.length;
    signals$.next('refresh');
    await settle(fixture);
    expect(biblio.getWorks.mock.calls.length).toBe(count + 1);
  });
});

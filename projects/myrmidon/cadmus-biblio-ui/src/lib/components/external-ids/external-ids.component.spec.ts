import { ComponentFixture } from '@angular/core/testing';
import { inputBinding, outputBinding, signal } from '@angular/core';
import { render, screen, within } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';

import { ExternalId } from '@myrmidon/cadmus-biblio-core';

import { ExternalIdsComponent } from './external-ids.component';

const IDS: ExternalId[] = [
  { sourceId: 's1', scope: 'doi', value: '10.1/a' },
  { sourceId: 's2', scope: 'isbn', value: '978-1' },
  { sourceId: 's3', scope: 'url', value: 'http://x.org' },
];

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r));
  await fixture.whenStable();
}

async function setup(ids?: ExternalId[]) {
  const idsChange = vi.fn();
  const idsInput = signal(ids);
  const result = await render(ExternalIdsComponent, {
    bindings: [
      inputBinding('ids', idsInput),
      outputBinding('idsChange', idsChange),
    ],
  });
  await settle(result.fixture);
  return { ...result, idsInput, idsChange, user: userEvent.setup() };
}

/** Get the body rows of the IDs table. */
function rows(): HTMLElement[] {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body).queryAllByRole('row');
}

function rowValues(): string[] {
  return rows().map((r) => {
    const cells = within(r).getAllByRole('cell');
    return `${cells[1].textContent!.trim()}=${cells[2].textContent!.trim()}`;
  });
}

describe('ExternalIdsComponent', () => {
  it('should render an empty table without IDs', async () => {
    await setup();
    expect(rows()).toHaveLength(0);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should list the bound IDs', async () => {
    await setup(IDS);
    expect(rowValues()).toEqual([
      'doi=10.1/a',
      'isbn=978-1',
      'url=http://x.org',
    ]);
  });

  it('should reflect later input changes', async () => {
    const { idsInput, fixture } = await setup(IDS);
    idsInput.set([IDS[2]]);
    await settle(fixture);
    expect(rowValues()).toEqual(['url=http://x.org']);
    idsInput.set([IDS[0], IDS[1]]);
    await settle(fixture);
    expect(rowValues()).toEqual(['doi=10.1/a', 'isbn=978-1']);
  });

  it('should add a new ID', async () => {
    const { user, idsChange } = await setup([IDS[0]]);
    await user.click(screen.getByRole('button', { name: /ID/ }));
    expect(screen.getByText('#0')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'scope' }), 'isbn');
    await user.type(screen.getByRole('textbox', { name: 'value' }), '123');
    await user.click(
      screen.getByRole('button', { description: 'Accept changes' })
    );

    expect(rowValues()).toEqual(['doi=10.1/a', 'isbn=123']);
    expect(idsChange).toHaveBeenLastCalledWith([
      IDS[0],
      { sourceId: '', scope: 'isbn', value: '123' },
    ]);
    // editor closed
    expect(
      screen.queryByRole('textbox', { name: 'value' })
    ).not.toBeInTheDocument();
  });

  it('should edit an existing ID', async () => {
    const { user, idsChange } = await setup(IDS);
    await user.click(
      screen.getAllByRole('button', { description: 'Edit this ID' })[1]
    );
    expect(screen.getByText('#2')).toBeInTheDocument();
    const value = screen.getByRole('textbox', { name: 'value' });
    expect(value).toHaveValue('978-1');

    await user.clear(value);
    await user.type(value, '978-2');
    await user.click(
      screen.getByRole('button', { description: 'Accept changes' })
    );

    expect(rowValues()).toEqual([
      'doi=10.1/a',
      'isbn=978-2',
      'url=http://x.org',
    ]);
    expect(idsChange).toHaveBeenLastCalledWith([
      IDS[0],
      { sourceId: 's2', scope: 'isbn', value: '978-2' },
      IDS[2],
    ]);
  });

  it('should close the editor without changes on cancel', async () => {
    const { user, idsChange } = await setup(IDS);
    await user.click(
      screen.getAllByRole('button', { description: 'Edit this ID' })[0]
    );
    await user.click(
      screen.getByRole('button', { description: 'Discard changes' })
    );
    expect(
      screen.queryByRole('textbox', { name: 'value' })
    ).not.toBeInTheDocument();
    expect(idsChange).not.toHaveBeenCalled();
  });

  it('should delete the clicked ID', async () => {
    const { user, idsChange } = await setup(IDS);
    await user.click(
      screen.getAllByRole('button', { description: 'Delete this ID' })[0]
    );
    expect(rowValues()).toEqual(['isbn=978-1', 'url=http://x.org']);
    expect(idsChange).toHaveBeenLastCalledWith([IDS[1], IDS[2]]);
  });

  it('should close the editor when deleting the edited ID', async () => {
    const { user } = await setup(IDS);
    await user.click(
      screen.getAllByRole('button', { description: 'Edit this ID' })[1]
    );
    await user.click(
      screen.getAllByRole('button', { description: 'Delete this ID' })[1]
    );
    expect(rowValues()).toEqual(['doi=10.1/a', 'url=http://x.org']);
    expect(
      screen.queryByRole('textbox', { name: 'value' })
    ).not.toBeInTheDocument();
  });

  it('should keep editing the same ID when deleting a previous one', async () => {
    const { user } = await setup(IDS);
    await user.click(
      screen.getAllByRole('button', { description: 'Edit this ID' })[2]
    );
    await user.click(
      screen.getAllByRole('button', { description: 'Delete this ID' })[0]
    );
    expect(screen.getByText('#2')).toBeInTheDocument();
    const value = screen.getByRole('textbox', { name: 'value' });
    await user.clear(value);
    await user.type(value, 'http://y.org');
    await user.click(
      screen.getByRole('button', { description: 'Accept changes' })
    );
    expect(rowValues()).toEqual(['isbn=978-1', 'url=http://y.org']);
  });
});

import { inputBinding, outputBinding } from '@angular/core';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';

import { ExternalId } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { ExternalIdComponent } from './external-id.component';

const SCOPES: ThesaurusEntry[] = [
  { id: 'doi', value: 'DOI' },
  { id: 'isbn', value: 'ISBN' },
];

async function setup(
  inputs: { id?: ExternalId; scopeEntries?: ThesaurusEntry[] } = {}
) {
  const idChange = vi.fn();
  const close = vi.fn();
  const result = await render(ExternalIdComponent, {
    bindings: [
      ...Object.entries(inputs).map(([k, v]) => inputBinding(k, () => v)),
      outputBinding('idChange', idChange),
      outputBinding('close', close),
    ],
    waitForStableOnRender: true,
  });
  // let Material complete its deferred initialization (e.g. select text)
  await new Promise((r) => setTimeout(r));
  await result.fixture.whenStable();
  return { ...result, idChange, close, user: userEvent.setup() };
}

function acceptButton(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept changes' });
}

describe('ExternalIdComponent', () => {
  it('should render a free scope input without scope entries', async () => {
    await setup();
    expect(screen.getByRole('textbox', { name: 'scope' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'value' })).toHaveValue('');
  });

  it('should show the bound ID', async () => {
    await setup({ id: { sourceId: 's', scope: 'doi', value: '10.1/x' } });
    expect(screen.getByRole('textbox', { name: 'scope' })).toHaveValue('doi');
    expect(screen.getByRole('textbox', { name: 'value' })).toHaveValue(
      '10.1/x'
    );
  });

  it('should disable save while pristine or invalid', async () => {
    const { user } = await setup();
    expect(acceptButton()).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'value' }), 'v');
    // scope still empty
    expect(acceptButton()).toBeDisabled();
  });

  it('should save trimmed values preserving source ID', async () => {
    const { user, idChange } = await setup({
      id: { sourceId: 'src', scope: 'doi', value: 'old' },
    });
    const value = screen.getByRole('textbox', { name: 'value' });
    await user.clear(value);
    await user.type(value, '  new  ');
    await user.click(acceptButton());
    expect(idChange).toHaveBeenCalledWith({
      sourceId: 'src',
      scope: 'doi',
      value: 'new',
    });
  });

  it('should save a new ID with empty source ID', async () => {
    const { user, idChange } = await setup();
    await user.type(screen.getByRole('textbox', { name: 'scope' }), 'isbn');
    await user.type(screen.getByRole('textbox', { name: 'value' }), '123');
    await user.click(acceptButton());
    expect(idChange).toHaveBeenCalledWith({
      sourceId: '',
      scope: 'isbn',
      value: '123',
    });
  });

  it('should emit close on cancel', async () => {
    const { user, close, idChange } = await setup();
    await user.click(
      screen.getByRole('button', { description: 'Discard changes' })
    );
    expect(close).toHaveBeenCalled();
    expect(idChange).not.toHaveBeenCalled();
  });

  it('should show required errors when touched', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('textbox', { name: 'scope' }));
    await user.click(screen.getByRole('textbox', { name: 'value' }));
    await user.tab();
    expect(await screen.findByText('scope required')).toBeInTheDocument();
    expect(screen.getByText('value required')).toBeInTheDocument();
  });

  it('should show a too long error', async () => {
    const { user } = await setup();
    const scope = screen.getByRole('textbox', { name: 'scope' });
    await user.click(scope);
    await user.paste('x'.repeat(51));
    await user.tab();
    expect(await screen.findByText('scope too long')).toBeInTheDocument();
  });

  describe('with scope entries', () => {
    it('should render a scope select defaulting to the first entry', async () => {
      await setup({ scopeEntries: SCOPES });
      const select = screen.getByRole('combobox', { name: 'scope' });
      expect(select).toHaveTextContent('DOI');
    });

    it('should default the scope of a new empty ID', async () => {
      const { user, idChange } = await setup({
        scopeEntries: SCOPES,
        id: { sourceId: '', scope: '', value: '' },
      });
      expect(screen.getByRole('combobox', { name: 'scope' })).toHaveTextContent(
        'DOI'
      );
      await user.type(screen.getByRole('textbox', { name: 'value' }), '10.1');
      await user.click(acceptButton());
      expect(idChange).toHaveBeenCalledWith({
        sourceId: '',
        scope: 'doi',
        value: '10.1',
      });
    });

    it('should show the bound scope', async () => {
      await setup({
        scopeEntries: SCOPES,
        id: { sourceId: '', scope: 'isbn', value: '1' },
      });
      expect(screen.getByRole('combobox', { name: 'scope' })).toHaveTextContent(
        'ISBN'
      );
    });

    it('should save the selected scope', async () => {
      const { user, idChange } = await setup({ scopeEntries: SCOPES });
      await user.click(screen.getByRole('combobox', { name: 'scope' }));
      await user.click(await screen.findByRole('option', { name: 'ISBN' }));
      await user.type(screen.getByRole('textbox', { name: 'value' }), '978');
      await user.click(acceptButton());
      expect(idChange).toHaveBeenCalledWith({
        sourceId: '',
        scope: 'isbn',
        value: '978',
      });
    });
  });
});

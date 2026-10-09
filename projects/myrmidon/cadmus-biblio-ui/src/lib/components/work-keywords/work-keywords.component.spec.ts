import { inputBinding, outputBinding, signal } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { WorkKeywordsComponent } from './work-keywords.component';

const KEYWORDS: Keyword[] = [
  { language: 'ita', value: 'storia' },
  { language: 'eng', value: 'history' },
  { language: 'eng', value: 'art' },
];

const LOOKUP: Keyword[] = [
  { language: 'eng', value: 'alpha' },
  { language: 'eng', value: 'art' },
];

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r));
  await fixture.whenStable();
}

async function setup(
  inputs: {
    keywords?: Keyword[];
    langEntries?: ThesaurusEntry[];
    limit?: number;
  } = {}
) {
  // async like HTTP
  const getKeywords = vi.fn(() =>
    of({ pageNumber: 1, pageSize: 10, total: 2, items: LOOKUP }).pipe(delay(0))
  );
  const keywordsChange = vi.fn();
  const editorClose = vi.fn();
  const keywordsInput = signal(inputs.keywords);
  const result = await render(WorkKeywordsComponent, {
    bindings: [
      inputBinding('keywords', keywordsInput),
      inputBinding('langEntries', () => inputs.langEntries),
      inputBinding('limit', () => inputs.limit ?? 10),
      outputBinding('keywordsChange', keywordsChange),
      outputBinding('editorClose', editorClose),
    ],
    providers: [{ provide: BiblioService, useValue: { getKeywords } }],
  });
  await settle(result.fixture);
  return {
    ...result,
    keywordsInput,
    getKeywords,
    keywordsChange,
    editorClose,
    user: userEvent.setup(),
  };
}

function header(): HTMLElement {
  return screen.getByRole('button', { expanded: false });
}

function rows(): string[] {
  const langs = screen.queryAllByRole('textbox', { name: 'language' });
  const values = screen.queryAllByRole('textbox', { name: 'value' });
  return langs.map(
    (l, i) =>
      `${(l as HTMLInputElement).value}:${(values[i] as HTMLInputElement).value}`
  );
}

function accept(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept keywords' });
}

describe('WorkKeywordsComponent', () => {
  it('should show 0 keywords when empty', async () => {
    await setup();
    expect(header()).toHaveTextContent('0');
  });

  it('should list the bound keywords sorted by language and value', async () => {
    const { user } = await setup({ keywords: KEYWORDS });
    expect(header()).toHaveTextContent('3');
    await user.click(header());
    expect(rows()).toEqual(['eng:art', 'eng:history', 'ita:storia']);
    // pristine
    expect(accept()).toBeDisabled();
  });

  it('should invalidate the form when a loaded keyword is invalid', async () => {
    const { user } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    const value = screen.getAllByRole('textbox', { name: 'value' })[0];
    await user.clear(value);
    await user.tab();
    expect(accept()).toBeDisabled();
    expect(await screen.findByText('required')).toBeInTheDocument();
  });

  it('should save edited keywords', async () => {
    const { user, keywordsChange } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    const value = screen.getAllByRole('textbox', { name: 'value' })[0];
    await user.clear(value);
    await user.type(value, ' arts ');
    await user.click(accept());
    expect(keywordsChange).toHaveBeenLastCalledWith([
      { language: 'eng', value: 'arts' },
      { language: 'eng', value: 'history' },
      { language: 'ita', value: 'storia' },
    ]);
  });

  it('should add a new empty keyword', async () => {
    const { user, keywordsChange } = await setup({ keywords: [KEYWORDS[0]] });
    await user.click(header());
    await user.click(
      screen.getByRole('button', { description: 'Add a new keyword' })
    );
    expect(rows()).toEqual(['ita:storia', ':']);
    expect(accept()).toBeDisabled();
    await user.type(
      screen.getAllByRole('textbox', { name: 'language' })[1],
      'eng'
    );
    await user.type(screen.getAllByRole('textbox', { name: 'value' })[1], 'x');
    await user.click(accept());
    expect(keywordsChange).toHaveBeenLastCalledWith([
      { language: 'ita', value: 'storia' },
      { language: 'eng', value: 'x' },
    ]);
  });

  it('should remove a keyword', async () => {
    const { user, keywordsChange } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    await user.click(
      screen.getAllByRole('button', { description: 'Remove this keyword' })[1]
    );
    expect(rows()).toEqual(['eng:art', 'ita:storia']);
    await user.click(accept());
    expect(keywordsChange).toHaveBeenLastCalledWith([
      { language: 'eng', value: 'art' },
      { language: 'ita', value: 'storia' },
    ]);
  });

  it('should save undefined when all keywords are removed', async () => {
    const { user, keywordsChange } = await setup({ keywords: [KEYWORDS[0]] });
    await user.click(header());
    await user.click(
      screen.getByRole('button', { description: 'Remove this keyword' })
    );
    await user.click(accept());
    expect(keywordsChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should discard changes on cancel', async () => {
    const { user, keywordsChange, editorClose } = await setup({
      keywords: KEYWORDS,
    });
    await user.click(header());
    await user.click(
      screen.getAllByRole('button', { description: 'Remove this keyword' })[0]
    );
    await user.click(
      screen.getByRole('button', { description: 'Discard keywords' })
    );
    expect(editorClose).toHaveBeenCalled();
    expect(keywordsChange).not.toHaveBeenCalled();
    await user.click(header());
    expect(rows()).toEqual(['eng:art', 'eng:history', 'ita:storia']);
  });

  it('should look up and add keywords, ignoring duplicates', async () => {
    const { user, getKeywords } = await setup({
      keywords: [KEYWORDS[2]],
      limit: 5,
    });
    await user.click(header());
    const lookup = screen.getByRole('combobox');
    await user.type(lookup, 'eng:al');
    await user.click(await screen.findByRole('option', { name: '[eng] alpha' }));
    expect(getKeywords).toHaveBeenLastCalledWith({
      pageNumber: 1,
      pageSize: 5,
      language: 'eng',
      value: 'al',
    });
    expect(rows()).toEqual(['eng:art', 'eng:alpha']);

    // pick an already present keyword
    await user.clear(lookup);
    await user.type(lookup, 'a');
    await user.click(await screen.findByRole('option', { name: '[eng] art' }));
    expect(rows()).toEqual(['eng:art', 'eng:alpha']);
  });

  it('should clear the lookup after a pick', async () => {
    const { user } = await setup();
    await user.click(header());
    const lookup = screen.getByRole('combobox');
    const clear = screen.getByRole('button', { description: 'Clear' });
    expect(clear).toBeDisabled();
    await user.type(lookup, 'al');
    await user.click(await screen.findByRole('option', { name: '[eng] alpha' }));
    expect(lookup).toHaveValue('[eng] alpha');
    await user.click(clear);
    expect(lookup).toHaveValue('');
    // wait past the debounce time: no empty option is rendered
    await new Promise((r) => setTimeout(r, 400));
    await user.click(lookup);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('should not save when pressing Enter in the lookup', async () => {
    const { user, keywordsChange } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    // make the form dirty and valid
    await user.click(
      screen.getAllByRole('button', { description: 'Remove this keyword' })[0]
    );
    await user.type(screen.getByRole('combobox'), 'zzz{Enter}');
    expect(keywordsChange).not.toHaveBeenCalled();
  });

  it('should reflect a later undefined input', async () => {
    const { user, keywordsInput, fixture } = await setup({ keywords: KEYWORDS });
    keywordsInput.set(undefined);
    await settle(fixture);
    await user.click(header());
    expect(rows()).toEqual([]);
  });

  it('should use a language select with language entries', async () => {
    const { user, keywordsChange } = await setup({
      keywords: [KEYWORDS[0]],
      langEntries: [
        { id: 'ita', value: 'Italian' },
        { id: 'eng', value: 'English' },
      ],
    });
    await user.click(header());
    const select = screen.getByRole('combobox', { name: 'language' });
    expect(select).toHaveTextContent('Italian');
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'English' }));
    await user.click(accept());
    expect(keywordsChange).toHaveBeenLastCalledWith([
      { language: 'eng', value: 'storia' },
    ]);
  });

  it('should render no <form>, so it can be nested at any depth', async () => {
    const { container } = await setup({ keywords: KEYWORDS });
    expect(container.querySelector('form')).toBeNull();
  });

  it('should not be made dirty by typing in the lookup', async () => {
    const { user } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(accept()).toBeDisabled();
  });

  it('should accept the keywords on Enter in a keyword input', async () => {
    const { user, keywordsChange } = await setup({ keywords: KEYWORDS });
    await user.click(header());
    const value = screen.getAllByRole('textbox', { name: 'value' })[0];
    await user.type(value, 's{Enter}');
    expect(keywordsChange).toHaveBeenLastCalledWith([
      { language: 'eng', value: 'arts' },
      { language: 'eng', value: 'history' },
      { language: 'ita', value: 'storia' },
    ]);
  });
});

import { inputBinding, outputBinding } from '@angular/core';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';

import { KeywordPickerComponent } from './keyword-picker.component';

const KEYWORDS: Keyword[] = [
  { language: 'eng', value: 'alpha' },
  { language: 'ita', value: 'alfa' },
];

async function setup(inputs: { limit?: number; label?: string } = {}) {
  // async like HTTP
  const getKeywords = vi.fn(() =>
    of({ pageNumber: 1, pageSize: 10, total: 2, items: KEYWORDS }).pipe(
      delay(0)
    )
  );
  const keywordChange = vi.fn();
  const result = await render(KeywordPickerComponent, {
    bindings: [
      ...Object.entries(inputs).map(([k, v]) => inputBinding(k, () => v)),
      outputBinding('keywordChange', keywordChange),
    ],
    providers: [{ provide: BiblioService, useValue: { getKeywords } }],
    waitForStableOnRender: true,
  });
  return { ...result, getKeywords, keywordChange, user: userEvent.setup() };
}

describe('KeywordPickerComponent', () => {
  it('should use the default label as placeholder', async () => {
    await setup();
    expect(
      screen.getByPlaceholderText('keyword/lang:keyword')
    ).toBeInTheDocument();
  });

  it('should use a custom label', async () => {
    await setup({ label: 'find keyword' });
    expect(screen.getByPlaceholderText('find keyword')).toBeInTheDocument();
  });

  it('should look up keywords by value', async () => {
    const { user, getKeywords } = await setup({ limit: 5 });
    await user.type(screen.getByRole('combobox'), 'al');
    expect(
      await screen.findByRole('option', { name: '[eng] alpha' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '[ita] alfa' })).toBeInTheDocument();
    expect(getKeywords).toHaveBeenLastCalledWith({
      pageNumber: 1,
      pageSize: 5,
      language: undefined,
      value: 'al',
    });
  });

  it('should look up keywords by language and value', async () => {
    const { user, getKeywords } = await setup();
    await user.type(screen.getByRole('combobox'), 'eng:al');
    await screen.findAllByRole('option');
    expect(getKeywords).toHaveBeenLastCalledWith({
      pageNumber: 1,
      pageSize: 10,
      language: 'eng',
      value: 'al',
    });
  });

  it('should emit the picked keyword and clear the lookup', async () => {
    const { user, keywordChange } = await setup();
    const input = screen.getByRole('combobox');
    await user.type(input, 'al');
    await user.click(await screen.findByRole('option', { name: '[ita] alfa' }));
    expect(keywordChange).toHaveBeenCalledTimes(1);
    expect(keywordChange).toHaveBeenCalledWith(KEYWORDS[1]);
    expect(input).toHaveValue('');
  });

  it('should not show an empty option after picking', async () => {
    const { user } = await setup();
    const input = screen.getByRole('combobox');
    await user.type(input, 'al');
    await user.click(await screen.findByRole('option', { name: '[eng] alpha' }));
    // wait past the debounce time
    await new Promise((r) => setTimeout(r, 400));
    await user.click(input);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('should enable clear only when there is text, and clear it', async () => {
    const { user } = await setup();
    const clear = screen.getByRole('button', { description: 'Clear' });
    expect(clear).toBeDisabled();
    const input = screen.getByRole('combobox');
    await user.type(input, 'x');
    expect(clear).toBeEnabled();
    await user.click(clear);
    expect(input).toHaveValue('');
    expect(clear).toBeDisabled();
  });
});

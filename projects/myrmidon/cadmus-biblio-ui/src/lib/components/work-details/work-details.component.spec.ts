import { inputBinding } from '@angular/core';
import { render, screen } from '@testing-library/angular/zoneless';

import { Container, Work } from '@myrmidon/cadmus-biblio-core';

import { WorkDetailsComponent } from './work-details.component';

const WORK: Work = {
  id: 'w-id',
  key: 'Doe 2020',
  type: 'article',
  title: 'The Alpha',
  language: 'eng',
  edition: 2,
  authors: [
    { first: 'John', last: 'Doe', role: 'editor' },
    { first: 'Jane', last: 'Roe' },
  ],
  container: {
    key: 'J',
    type: 'journal',
    title: 'Journal of Tests',
    language: 'eng',
    number: '12',
  },
  placePub: 'Rome',
  yearPub: 2020,
  yearPub2: 2021,
  firstPage: 10,
  lastPage: 20,
  publisher: 'ACME',
  datation: 'c. 1200 AD',
  location: 'http://acme.org/alpha',
  accessDate: new Date(2024, 0, 15),
  keywords: [{ language: 'eng', value: 'test' }],
  note: 'A note',
};

async function setup(work?: Work | Container) {
  return render(WorkDetailsComponent, {
    bindings: [inputBinding('work', () => work)],
    waitForStableOnRender: true,
  });
}

describe('WorkDetailsComponent', () => {
  it('should render nothing without a work', async () => {
    const { container } = await setup();
    expect(container.textContent?.trim()).toBe('');
  });

  it('should render the full work details', async () => {
    await setup(WORK);
    expect(screen.getByText('article')).toBeInTheDocument();
    expect(screen.getByText('(eng)')).toBeInTheDocument();
    expect(screen.getByText('Doe 2020')).toBeInTheDocument();
    expect(
      screen.getByText('Doe, John (editor); Roe, Jane')
    ).toBeInTheDocument();
    expect(screen.getByText('The Alpha')).toBeInTheDocument();
    expect(screen.getByText('2', { exact: false, selector: '.sup' })).toBeInTheDocument();
    expect(screen.getByText('Journal of Tests')).toBeInTheDocument();
    expect(screen.getByText(/2020-2021/)).toBeInTheDocument();
    expect(screen.getByText('p. 10 - 20')).toBeInTheDocument();
    expect(screen.getByText(/\(ACME\)/)).toBeInTheDocument();
    expect(screen.getByText(/c\. 1200 AD/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'http://acme.org/alpha' })
    ).toHaveAttribute('href', 'http://acme.org/alpha');
    expect(screen.getByText(/accessed: Jan 15, 2024/)).toBeInTheDocument();
    expect(
      screen.getByRole('listitem')
    ).toHaveTextContent('test (eng)');
    expect(screen.getByText('w-id')).toBeInTheDocument();
    expect(screen.getByText('A note')).toBeInTheDocument();
  });

  it('should render a non-URL location as text', async () => {
    await setup({ ...WORK, location: 'Library shelf 3' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Library shelf 3')).toBeInTheDocument();
  });

  it('should omit missing optional parts', async () => {
    await setup({
      key: 'k',
      type: 'book',
      title: 'Minimal',
      language: 'ita',
    });
    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^in /)).not.toBeInTheDocument();
    expect(screen.queryByText(/p\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/accessed/)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('should render a single year without range', async () => {
    await setup({ ...WORK, yearPub2: undefined });
    expect(screen.getByText(/Rome/)).toHaveTextContent(/^Rome\s+2020\s*p\./);
    expect(screen.queryByText(/2020-/)).not.toBeInTheDocument();
  });
});

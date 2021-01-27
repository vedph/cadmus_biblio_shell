import { Injectable } from '@angular/core';
import { EditPartQueryBase } from '@myrmidon/cadmus-state';
import { EditExtBibliographyPartStore } from './edit-ext-bibliography-part.store';

@Injectable({ providedIn: 'root' })
export class EditExtBibliographyPartQuery extends EditPartQueryBase {
  constructor(store: EditExtBibliographyPartStore) {
    super(store);
  }
}

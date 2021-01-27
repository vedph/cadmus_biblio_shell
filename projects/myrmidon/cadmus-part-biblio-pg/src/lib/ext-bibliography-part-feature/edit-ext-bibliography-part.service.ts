import { Injectable } from '@angular/core';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { EditPartServiceBase } from '@myrmidon/cadmus-state';
import { EditExtBibliographyPartStore } from './edit-ext-bibliography-part.store';

@Injectable({ providedIn: 'root' })
export class EditExtBibliographyPartService extends EditPartServiceBase {
  constructor(
    editPartStore: EditExtBibliographyPartStore,
    itemService: ItemService,
    thesaurusService: ThesaurusService
  ) {
    super(itemService, thesaurusService);
    this.store = editPartStore;
  }
}

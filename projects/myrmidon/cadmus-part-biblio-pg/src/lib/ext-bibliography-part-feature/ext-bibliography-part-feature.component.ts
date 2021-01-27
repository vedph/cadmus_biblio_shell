import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  EditItemQuery,
  EditItemService,
  EditPartFeatureBase,
} from '@myrmidon/cadmus-state';

import { EditExtBibliographyPartService } from './edit-ext-bibliography-part.service';
import { EditExtBibliographyPartQuery } from './edit-ext-bibliography-part.query';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'biblio-ext-bibliography-part-feature',
  templateUrl: './ext-bibliography-part-feature.component.html',
  styleUrls: ['./ext-bibliography-part-feature.component.css'],
})
export class ExtBibliographyPartFeatureComponent
  extends EditPartFeatureBase
  implements OnInit {
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    editPartQuery: EditExtBibliographyPartQuery,
    editPartService: EditExtBibliographyPartService,
    editItemQuery: EditItemQuery,
    editItemService: EditItemService
  ) {
    super(
      router,
      route,
      snackbar,
      editPartQuery,
      editPartService,
      editItemQuery,
      editItemService
    );
  }

  public ngOnInit(): void {
    this.initEditor([
      'ext-biblio-author-roles',
      'ext-biblio-languages',
      'ext-biblio-work-tags',
    ]);
  }
}

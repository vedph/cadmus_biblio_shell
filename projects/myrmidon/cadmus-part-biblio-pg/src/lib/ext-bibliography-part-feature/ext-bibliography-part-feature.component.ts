import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';

@Component({
  selector: 'biblio-ext-bibliography-part-feature',
  templateUrl: './ext-bibliography-part-feature.component.html',
  styleUrls: ['./ext-bibliography-part-feature.component.css'],
})
export class ExtBibliographyPartFeatureComponent
  extends EditPartFeatureBase
  implements OnInit
{
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    itemService: ItemService,
    thesaurusService: ThesaurusService,
    editorService: PartEditorService
  ) {
    super(
      router,
      route,
      snackbar,
      itemService,
      thesaurusService,
      editorService
    );
  }

  protected override getReqThesauriIds(): string[] {
    return [
      'ext-biblio-author-roles',
      'ext-biblio-languages',
      'ext-biblio-work-tags',
      'ext-biblio-link-scopes'
    ];
  }
}

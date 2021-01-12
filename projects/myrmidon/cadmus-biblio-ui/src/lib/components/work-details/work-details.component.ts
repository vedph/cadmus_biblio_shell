import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Container, Work } from '@myrmidon/cadmus-biblio-core';

@Component({
  selector: 'biblio-work-details',
  templateUrl: './work-details.component.html',
  styleUrls: ['./work-details.component.css']
})
export class WorkDetailsComponent {
  @Input()
  public work: Work | Container | undefined;
}

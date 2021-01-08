import { Component, OnInit } from '@angular/core';
import { WorkBase } from '@myrmidon/cadmus-biblio-core';

@Component({
  selector: 'biblio-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent implements OnInit {
  public work: WorkBase | undefined;
  public container: WorkBase | undefined;

  constructor() { }

  ngOnInit(): void {
  }

  public onWorkChange(work: WorkBase): void {
    this.work = work;
  }

  public onContainerChange(container: WorkBase): void {
    this.container = container;
  }
}

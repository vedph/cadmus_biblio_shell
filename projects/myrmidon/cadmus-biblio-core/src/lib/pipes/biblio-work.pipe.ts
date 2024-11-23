import { Pipe, PipeTransform } from '@angular/core';

import { Container, Work } from '../models';
import { BiblioUtilService } from '../services/biblio-util.service';

@Pipe({
  name: 'biblioWork',
  standalone: false,
})
export class BiblioWorkPipe implements PipeTransform {
  constructor(private _utilService: BiblioUtilService) {}

  transform(value: Work | Container | undefined | null): unknown {
    return this._utilService.workToString(value);
  }
}

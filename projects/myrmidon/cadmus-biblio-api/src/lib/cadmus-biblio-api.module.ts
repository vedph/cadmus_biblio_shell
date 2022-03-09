import { NgModule } from '@angular/core';
import { EnvServiceProvider, NgToolsModule } from '@myrmidon/ng-tools';

@NgModule({
  declarations: [],
  imports: [
    NgToolsModule
  ],
  exports: [],
  providers: [
    EnvServiceProvider
  ]
})
export class CadmusBiblioApiModule {}

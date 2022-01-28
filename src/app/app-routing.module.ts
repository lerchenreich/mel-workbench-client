import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MelTableListComponent }   from './components/mel/meltable-list/meltable-list.component'
import { MelTableCardComponent }   from './components/mel/meltable-card/meltable-card.component'

import { baseRoutes } from 'mel-client';
import { CreateAppDialogComponent } from './components/dialogs/create-app-dialog/create-app-dialog.component';

const routes = ([
  { path: 'create-app' ,          component : CreateAppDialogComponent },
  { path: 'meltable-list' ,       component : MelTableListComponent},
  { path: 'meltable-card/:name',  component : MelTableCardComponent},
  { path: 'meltable-card' ,       component : MelTableCardComponent}, 
] as Routes).concat(baseRoutes);

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy', onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }

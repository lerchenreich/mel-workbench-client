import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageNotFoundComponent} from './components/page-not-found/page-not-found.component'
import { MelTableListComponent }   from './components/mel/meltable-list/meltable-list.component'
import { MelTableCardComponent }   from './components/mel/meltable-card/meltable-card.component'
import { CreateAppComponent } from './components/functions/create-app/create-app.component';
import { ObjectDesignerComponent } from './components/object-designer/object-designer.component';
import { CreateServerComponent } from './components/functions/create-server/create-server.component';
import { CreateClientComponent } from './components/functions/create-client/create-client.component';

import { baseRoutes } from 'mel-client';

const routes = ([
  { path: 'object-designer' , component : ObjectDesignerComponent },
  { path: 'create-app' , component : CreateAppComponent },
  { path: 'create-server' , component : CreateServerComponent },
  { path: 'create-client' , component : CreateClientComponent },
  { path: 'meltable-list' , component : MelTableListComponent},
  { path: 'meltable-card/:name' , component : MelTableCardComponent},
  { path: 'meltable-card' , component : MelTableCardComponent}, 
] as Routes).concat(baseRoutes);

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy', onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }

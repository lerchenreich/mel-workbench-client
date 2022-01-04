import { ElectronService, NgxElectronModule }     from 'ngx-electron'
import { app }                                    from 'electron';
import { NgbActiveModal, NgbModule }              from '@ng-bootstrap/ng-bootstrap';

import { BrowserModule }                          from '@angular/platform-browser';
import { BrowserAnimationsModule }                from '@angular/platform-browser/animations'
import { APP_INITIALIZER, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { MDBBootstrapModule }                     from 'angular-bootstrap-md';
import { HttpClientModule, HttpClient }           from '@angular/common/http'
import { MAT_DIALOG_DEFAULT_OPTIONS }             from '@angular/material/dialog'

import { NgScrollbarModule }                      from 'ngx-scrollbar'

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
//mport { TranslateHttpLoader } from '@ngx-translate/http-loader'

import { AppRoutingModule } from './app-routing.module';

//import { MomentDateAdapter,MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter'
//import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core'
import { MaterialModule } from 'mel-client'

//import { FlexLayoutModule } from '@angular/flex-layout'
//import { GridModule } from '@angular/flex-layout/grid'

// Services
//#region  Dev-Environment
import { DevInitializationService, ListComponent } from 'mel-client'
//import { MelFieldService, MelTableService } from './services/melservices'
//#endregion
//#region App
//import { AppInitializationService} from '../mel-client/services/initialization-service'
//#endregion

import { CLIENT_CONFIG, APP_MODUL_NAME, MelClientModule, IconService } from 'mel-client'

// components
//import { ModalWaitComponent, PageBlankComponent, ProgressDialogComponent , CardSelectComponent, ConnectDialogComponent}   from 'mel-client';

import { PageNotFoundComponent}       from './components/page-not-found/page-not-found.component'
import { MelTableListComponent }      from './components/mel/meltable-list/meltable-list.component';
import { MelTableCardComponent }      from './components/mel/meltable-card/meltable-card.component';
import { SelectAppDialogComponent }   from './components/dialogs/selectApp-dialog/selectApp-dialog.component'
import { CreateAppComponent }         from './components/functions/create-app/create-app.component';
import { CreateServerComponent }      from './components/functions/create-server/create-server.component';
import { CreateClientComponent }      from './components/functions/create-client/create-client.component';

import { AppToolbarComponent }        from './components/app-toolbar/app-toolbar.component';
import { AppRootComponent }           from './components/app-root/app-root.component';

import { ObjectDesignerComponent }    from './components/object-designer/object-designer.component';

import { initializationFactory }      from './services/initialization-service'
import { WORKBENCH_CONFIG }           from './client.configs';

import { AppTablesDialogComponent } from './components/dialogs/apptables-dialog/apptables-dialog.component';

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new MultiTranslateHttpLoader(http, [
    {prefix: "./assets/i18n/", suffix: ".json"},
    {prefix: "./assets/i18n/mel/", suffix: ".json"},
  ]);
  //return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  id : APP_MODUL_NAME,
  bootstrap: [AppRootComponent],
  schemas : [NO_ERRORS_SCHEMA],
  declarations: [ 
    AppRootComponent,     
    AppToolbarComponent,
    PageNotFoundComponent,
    MelTableListComponent, MelTableCardComponent,
    SelectAppDialogComponent, CreateAppComponent, ObjectDesignerComponent, CreateServerComponent, 
    AppTablesDialogComponent,
    CreateClientComponent
  
  ],
  imports: [ 
    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
      }
    }),
    //TranslateService,
    MDBBootstrapModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgbModule,
    MaterialModule, 
    
    HttpClientModule,
    NgScrollbarModule,
    NgxElectronModule,

    MelClientModule,
    //GridModule,
    //FlexLayoutModule,

  ],
  exports :[
  ],
  providers: [    
  NgbActiveModal,
    TranslateService, 
    ElectronService,
    //#region dev-environment
    DevInitializationService,
    { provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [DevInitializationService, TranslateService, IconService], multi : true },
    //#endregion
    //#region app
    //{ provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [AppInitializationService, TranslateService], multi : true },
    
    //#endregion
    { provide: CLIENT_CONFIG, useValue: WORKBENCH_CONFIG}, 
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}},
  //  {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
  //  {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}},
  //  {provide: MAT_DATE_LOCALE, useValue: 'de'},
  //  {provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' }},
  ]
})
export class AppModule { }

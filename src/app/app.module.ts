
import { LOCALE_ID } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { BrowserModule }                          from '@angular/platform-browser';
import { BrowserAnimationsModule }                from '@angular/platform-browser/animations'
import { APP_INITIALIZER, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { HttpClientModule, HttpClient }           from '@angular/common/http'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { app }                                    from 'electron';
//ngx-...
import { ElectronService, NgxElectronModule }     from 'ngx-electron'
import { NgScrollbarModule }                      from 'ngx-scrollbar'
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
import { NgxSliderModule }            from '@angular-slider/ngx-slider';

import { MaterialModule } from './material-module'
import { AppRoutingModule } from './app-routing.module';

// Services
//#region  Dev-Environment
import { AppService, WorkbenchInitializationService } from 'mel-client'
//import { MelFieldService, MelTableService } from './services/melservices'
//#endregion
//#region App
//import { AppInitializationService} from '../mel-client/services/initialization-service'
//#endregion

import { CLIENT_CONFIG, APP_MODUL_NAME, IconService, MelClientModule } from 'mel-client'

// components
//import { ModalWaitComponent, PageBlankComponent, ProgressDialogComponent , CardSelectComponent, ConnectDialogComponent}   from 'mel-client';

import { PageNotFoundComponent}       from './components/page-not-found/page-not-found.component'
import { MelTableListComponent }      from './components/mel/meltable-list/meltable-list.component';
import { MelTableCardComponent }      from './components/mel/meltable-card/meltable-card.component';
import { SelectAppComponent }         from './components/dialogs/select-app/select-app-comp'

import { AppToolbarComponent }        from './components/app-toolbar/app-toolbar.component';
import { AppRootComponent }           from './components/app-root/app-root.comp';

import { AppTablesDialogComponent }   from './components/dialogs/apptables-dialog/apptables-dialog.component';
import { CreateAppDlgComponent }   from './components/dialogs/create-app/create-app-comp';

import { initializationFactory }      from './initialization'
import { WORKBENCH_CONFIG }           from './client.configs';

// services
import { WorkbenchService }           from './services/workbench-service';
import { ModalStyleDirective } from './components/directives';
import { CreateServerComponent } from './components/dialogs/create-server-project/create-server.comp';

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new MultiTranslateHttpLoader(http, [
    {prefix: "./assets/i18n/", suffix: ".json"},
    {prefix: "./assets/i18n/mel/", suffix: ".json"},
  ]);
}

@NgModule({
  id : APP_MODUL_NAME,
  bootstrap: [AppRootComponent],
  schemas : [NO_ERRORS_SCHEMA],
  declarations: [
    AppRootComponent,
    AppToolbarComponent,
    PageNotFoundComponent,
    MelTableListComponent,
    MelTableCardComponent,
    SelectAppComponent,
    AppTablesDialogComponent,
    CreateAppDlgComponent,
    CreateServerComponent,
    ModalStyleDirective,
  ],
  imports: [
    // wie mel-client
    CommonModule,
    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
      },
      isolate: false
    }),
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    CdkTableModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NgScrollbarModule,
    NgbModule,
 //   NgbProgressbarModule,
    NgxSliderModule,

    //App-spezifisch
    HttpClientModule,
    AppRoutingModule,
    MelClientModule,
    NgxElectronModule,
  ],
  exports :[
  ],
  providers: [
    NgbModal,
    TranslateService,
    ElectronService,
    WorkbenchService,
    AppService,
    //#region dev-environment
    WorkbenchInitializationService,
    { provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [WorkbenchInitializationService, TranslateService, IconService], multi : true },
    { provide: LOCALE_ID, useValue : window.navigator.language },
    //#endregion
    //#region app
    //{ provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [AppInitializationService, TranslateService], multi : true },

    //#endregion
    { provide: CLIENT_CONFIG, useValue: WORKBENCH_CONFIG},
  //  { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}},
  //  {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
  //  {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}},
  //  {provide: MAT_DATE_LOCALE, useValue: 'de'},
  //  {provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' }},
  ]
})
export class AppModule { }

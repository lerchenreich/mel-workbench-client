import { ElectronService, NgxElectronModule } from 'ngx-electron'
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { APP_INITIALIZER, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule, ReactiveFormsModule} from '@angular/forms'
import { MomentDateAdapter,MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core'
import { HttpClientModule, HttpClient } from '@angular/common/http'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog'
import { MaterialModule } from './material-module'
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

//import { FlexLayoutModule } from '@angular/flex-layout'
//import { GridModule } from '@angular/flex-layout/grid'
import { NgScrollbarModule } from 'ngx-scrollbar'

import { CLIENT_CONFIG, clientConfig } from './client.configs'
// Services
//#region  Dev-Environment
import { DevInitializationService } from './services/initialization-service'
//import { MelFieldService, MelTableService } from './services/melservices'
//#endregion
//#region App
//import { AppInitializationService} from './services/initialization-service'
//#endregion
import { initializationFactory } from './services/initialization-service'
//import { IconService } from './services/icon-service';
//import { AppService } from './services/app-service'
//import { DownloadService } from './services/download-service'
//import { AlertService } from './services/alert.service'

import   * as D  from './components/core/directives';

import { app } from 'electron';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

// components

import { ListPartComponent } from './components/parts/list-part/list-part.component';
import { FilterDialogComponent } from './components/dialogs/filter-dialog/filter-dialog.component';
import { PageNotFoundComponent} from './components/page-not-found/page-not-found.component'
import { AlertComponent } from './components/controls/alert/alert.component'
import { LookupDialogComponent } from './components/dialogs/lookup-dialog/lookup-dialog.component'
import { MessageDialogComponent } from './components/dialogs/message-dialog/message-dialog.component';
import { TableDesignerComponent } from './components/core/table-designer/table-designer.component';
import { MelTableListComponent } from './components/mel/meltable-list/meltable-list.component';
import { MelTableCardComponent } from './components/mel/meltable-card/meltable-card.component';
import { ListSelectComponent } from './components/controls/fields/list-select/list-select.component';
import { ListCheckboxComponent } from './components/controls/fields/list-checkbox/list-checkbox.component';
import { EnumComponent } from './components/controls/fields/enum/enum.component';
import { ListFieldComponent } from './components/controls/fields/listfield/listfield.component';
import { ListComponent } from './components/controls/mel-list/mel-list.component';
import { AppTablesDialogComponent } from './components/dialogs/apptables-dialog/apptables-dialog.component';
import { ProgressDialogComponent } from './components/dialogs/progress-dialog/progress-dialog.component';
import { CardFieldComponent } from './components/controls/fields/cardfield/cardfield.component';
import { CardInputComponent } from './components/controls/fields/card-input/card-input.component';
import { ListInputComponent } from './components/controls/fields/list-input/list-input.component';
import { CardSelectComponent } from './components/controls/fields/card-select/card-select.component';
import { CardCheckboxComponent } from './components/controls/fields/card-checkbox/card-checkbox.component';
import { SelectAppDialogComponent } from './components/dialogs/selectApp-dialog/selectApp-dialog.component';
import { CreateAppComponent } from './components/create-app/create-app.component';
import { ModalWaitComponent } from './components/dialogs/modal-wait/modal-wait.component';
import { ObjectDesignerComponent } from './components/object-designer/object-designer.component';
import { CreateServerComponent } from './components/create-server/create-server.component';
import { CreateClientComponent } from './components/create-client/create-client.component';
import { ConnectDialogComponent } from './components/dialogs/connect-dialog/connect-dialog.component';

import { PageBlankComponent } from './components/page-blank/page-blank.component';
import { APP_MODUL_NAME } from './core';

//import { TemplateService } from './template.service';


// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import { MelClientModule } from './mel-client.module';

@NgModule({
  id : APP_MODUL_NAME,
  bootstrap: [AppComponent],
  schemas : [NO_ERRORS_SCHEMA],
  declarations: [ 
    AppComponent,     
    PageNotFoundComponent,
    D.FocusableDirective, 
    D.ViewInput,    D.ListInput,    D.CardInput,  
    D.ViewBoolean,  D.ListBoolean,  D.CardBoolean, 
    D.ViewEnum,     D.ListEnum,     D.CardEnum, 
    CardInputComponent, ListInputComponent, ListCheckboxComponent, EnumComponent, ListSelectComponent, CardCheckboxComponent,
    ListFieldComponent, CardFieldComponent,
    ListComponent,
    ListPartComponent,
    AlertComponent,
    LookupDialogComponent, FilterDialogComponent, MessageDialogComponent,
    
    TableDesignerComponent,
    MelTableListComponent, MelTableCardComponent,
    AppTablesDialogComponent, ProgressDialogComponent, CardSelectComponent,  SelectAppDialogComponent, CreateAppComponent, ModalWaitComponent, ObjectDesignerComponent, CreateServerComponent, CreateClientComponent, ConnectDialogComponent, PageBlankComponent,  
  
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

    MDBBootstrapModule,
    MelClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgbModule,
    MaterialModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatInputModule, 
    MatFormFieldModule,
    HttpClientModule,
    NgScrollbarModule,
    NgxElectronModule,
  
    //GridModule,
    //FlexLayoutModule,

  ],
  exports :[
    //mel-client -> AlertComponent
  ],
  providers: [    
  NgbActiveModal,
    TranslateService, 
    ElectronService,
    //#region dev-environment
    DevInitializationService,
    { provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [DevInitializationService, TranslateService], multi : true },
    //mel-client -> MelTableService, MelFieldService,
    //#endregion
    //#region app
    //{ provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [AppInitializationService, TranslateService], multi : true },
    
    //#endregion
    { provide: CLIENT_CONFIG, useValue: clientConfig}, 
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}},
  //  {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
  //  {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}},
  //  {provide: MAT_DATE_LOCALE, useValue: 'de'},
  //  {provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' }},
    //mel-client -> AlertService, DownloadService, AppService, IconService, TemplateService,
  ]
})
export class AppModule { }

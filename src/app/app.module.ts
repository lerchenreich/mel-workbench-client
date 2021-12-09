import { ElectronService, NgxElectronModule } from 'ngx-electron'
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { APP_INITIALIZER, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule, ReactiveFormsModule} from '@angular/forms'
//import { MomentDateAdapter,MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter'
//import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core'
import { HttpClientModule, HttpClient } from '@angular/common/http'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog'
import { MaterialModule } from './material-module'
import { MatInputModule } from '@angular/material/input';
//mport { MatFormFieldModule } from '@angular/material/form-field';

//import { FlexLayoutModule } from '@angular/flex-layout'
//import { GridModule } from '@angular/flex-layout/grid'
import { NgScrollbarModule } from 'ngx-scrollbar'

import { CLIENT_CONFIG, TEST_CONFIG, PROD_CONFIG, DEV_CONFIG } from './client.configs'
// Services
import { InitializationService, initializationFactory } from './services/initialization-service'
import { IconService } from './services/icon-service';
import { AppService } from './services/app-service'
import { DownloadService } from './services/download-service'
import { AlertService } from './services/alert.service'
import { MelFieldService, MelTableService } from './services/melservices'
import   * as D  from './components/core/directives';

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
import { TemplateService } from './template.service';
import { ListInputComponent } from './components/controls/fields/list-input/list-input.component';
import { CardSelectComponent } from './components/controls/fields/card-select/card-select.component';
import { CardCheckboxComponent } from './components/controls/fields/card-checkbox/card-checkbox.component';
import { SelectAppDialogComponent } from './components/dialogs/selectApp-dialog/selectApp-dialog.component';
import { CreateAppComponent } from './components/create-app/create-app.component';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalWaitComponent } from './components/dialogs/modal-wait/modal-wait.component';
import { ObjectDesignerComponent } from './components/object-designer/object-designer.component';
import { CreateServerComponent } from './components/create-server/create-server.component';
import { CreateClientComponent } from './components/create-client/create-client.component';
// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  id : "App",
  bootstrap: [AppComponent],
  schemas : [NO_ERRORS_SCHEMA],
  declarations: [ 
    AppComponent, PageNotFoundComponent,
    D.FocusableDirective, 
    D.ViewInput,    D.ListInput,    D.CardInput,  
    D.ViewBoolean,  D.ListBoolean,  D.CardBoolean, 
    D.ViewEnum,     D.ListEnum,     D.CardEnum, 
    CardInputComponent, ListInputComponent, ListCheckboxComponent, EnumComponent, ListSelectComponent,  
    ListFieldComponent, CardFieldComponent,
    ListComponent,
    ListPartComponent,
    AlertComponent,
    LookupDialogComponent, FilterDialogComponent, MessageDialogComponent,
    
    TableDesignerComponent,
    MelTableListComponent, MelTableCardComponent,
    AppTablesDialogComponent, ProgressDialogComponent, CardSelectComponent, CardCheckboxComponent, SelectAppDialogComponent, CreateAppComponent, ModalWaitComponent, ObjectDesignerComponent, CreateServerComponent, CreateClientComponent,  
  ],
  /*
  entryComponents : [
    LookupDialogComponent,
    MessageDialogComponent,
    FilterDialogComponent,
    AppTablesDialogComponent,
  ],
  */
  imports: [
    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient]
      }
  }),
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,    
    HttpClientModule,
    FormsModule, ReactiveFormsModule,
    MatInputModule,
    NgxElectronModule,
    // MatFormFieldModule, 
    //GridModule,
    //FlexLayoutModule,

    MaterialModule,
    MDBBootstrapModule,
    NgScrollbarModule,
    NgbModule,
  ],
  exports :[
    AlertComponent
  ],
  providers: [    
  NgbActiveModal,
   InitializationService, TranslateService, ElectronService,
    { provide: APP_INITIALIZER, useFactory: initializationFactory,  deps: [InitializationService, TranslateService], multi : true },
    { provide: CLIENT_CONFIG, useValue: DEV_CONFIG}, 
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}},
  //  {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
  //  {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}},
  //  {provide: MAT_DATE_LOCALE, useValue: 'de'},
  //  {provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' }},
    AlertService, DownloadService, AppService, IconService, TemplateService,
    MelTableService, MelFieldService
  ]
})
export class AppModule { }

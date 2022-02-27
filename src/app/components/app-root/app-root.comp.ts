import { AfterContentInit, Component} from "@angular/core"
import { Router } from "@angular/router"
import { TranslateService } from "@ngx-translate/core"
import { AlertService, TemplateService, AppConnection,  
         ClientRootComponent, 
         MelRecents, RecentWorkbenchApp,
         openModalDlg, 
         MsgDlgButton, MessageBox, MsgResult,
         animatedDialog,
         MsgReportItem} from "mel-client"
import { MelDatabaseTypes, Version } from "mel-common"
import { CreateAppOptions } from "mel-workbench-api"
//import { BsModalService as ModalService } from "ngx-bootstrap/modal"
import { NgbModal as ModalService, NgbActiveModal as ModalRef}  from '@ng-bootstrap/ng-bootstrap';

import { CreateAppDlgData } from "src/app/components/dialogs/create-app/data"
import { WorkbenchService } from "src/app/services/workbench-service"
import { MenuCommand, MenuCommands } from "../app-toolbar/app-toolbar.component"
import { CreateAppDialogComponent } from "../dialogs/create-app/create-app-comp"

import { createAppCommand, SelectAppComponent } from "../dialogs/select-app/select-app-comp" 

function nop(reason : any) {} 
@Component({
  selector: 'app-root',
  templateUrl: './app-root.comp.html',
  styleUrls: ['./app-root.comp.scss']
})
export class AppRootComponent extends ClientRootComponent implements AfterContentInit {
  readonly createAppPrefix = "App.Function.CreateApp."

  constructor(protected router: Router,
              protected modal : ModalService,      
              public    translate : TranslateService,        
              alertService : AlertService,
              private workbenchService : WorkbenchService,
              templateService : TemplateService
             ){ 
    super(alertService, workbenchService, templateService)
    if (workbenchService.hasEndpoint && workbenchService.isWorkbench())
      this.workbenchService.unlock()
  } 

  ngAfterContentInit(){
    if (!this.workbenchService.hasEndpoint){
      openModalDlg<SelectAppComponent, any, AppConnection>(this.modal, SelectAppComponent, null)
      .then( recentApp  => {     
        if ( recentApp.code === createAppCommand )
          this.createApp()
        else 
          this.changeApp(recentApp)
      })
      .catch(reason => this.alertService.alertWarning(reason))
    } // if
  }

  //#region Menu-functions
  menuCommand(menuCommand : MenuCommand){
    switch(menuCommand.name){
      case MenuCommands.ChangeApp : if (menuCommand.param) this.changeApp(menuCommand.param); break
      case MenuCommands.CreateApp : this.createApp(); break
    }
  }

  private changeApp(appConnection : AppConnection){
    if (appConnection.url.length == 0)
      appConnection.url = this.workbenchService.hRef
    this.currAppConnection = appConnection
    MelRecents.lastRecent = new RecentWorkbenchApp(appConnection)
  }

  private createApp() {
    
    this.prepareCreateAppDlgData()
    .then( (dlgData) => {
      openModalDlg<CreateAppDialogComponent, any, CreateAppDlgData>(
        this.modal, 
        CreateAppDialogComponent, 
        dlgData 
      )
      .then( (dlgData) => {
        const vData = dlgData as Required<CreateAppDlgData>
        var createOptions : CreateAppOptions = {
          appCode : vData.AppCode,
          appName : vData.AppName,
          version : new Version(vData.Version),
          company : {
            name    : vData.CompanyName,
            dbName  : vData.CompanyDbName
          },
          //dropExistingAppDatabase : vData.DropExistingAppDatabase,
          //renameCompanyDatabase   : false, // dlgData.RenameCompanyDatabase,
          /*
          createServerProjectOptions : {
            name        : vData.AppCode+'-server',
            version     : vData.Version,
            description : `Express-Server for application ${vData.AppName}`, 
            keywords    : vData.SpKeywords?.split(',') || [],
            author      : vData.SpAuthor || '',
            license     : vData.SpLicense,
            serverPort  : vData.SpServerPort,
            dbConfig: {
              host      : vData.SpDbConfigHost,
              port      : vData.SpDbConfigPort,
              username  : vData.SpDbConfigUsername,
              password  : vData.SpDbConfigPassword,
              database  : vData.SpDbConfigDatabase,
              ssl       : vData.SpDbConfigSsl,
              timeout   : vData.SpDbConfigTimeout  
            },
            databaseType :vData.SpDatabaseType as MelDatabaseTypes
          },
          createClientProjectOptions : {
            name        : vData.AppCode + '-client',
            version     : vData.Version,
            description : `Client of application ${vData.AppName}`
          } 
          */
        }
        var progressController = animatedDialog (this.modal, { title : this.createAppPrefix+"Running", label : ''})
        this.workbenchService.createApp(createOptions)
        .subscribe({
          next : createResult => {
            progressController.stepper?.next(0) // close the wait-dialog
            MessageBox(this.modal, {
              title : createResult.success ? this.createAppPrefix+"Title" : 'App.Message.Error',
              message : this.createAppPrefix+(createResult.success?"Success" : "Failed"),
              context : {AppName : createOptions.appName },
              reportItems : createResult.success? [] : createResult.details.map(detail => { 
                return { 
                          annotation : detail.annotation, 
                          message : detail.message, 
                          result : detail.success}
                      }
              ),
              buttons : createResult.success ?  MsgDlgButton.YesNo : MsgDlgButton.GotIt,
              default : MsgResult.Positive
            })
            .subscribe( msgResult => {
              if (createResult.success && msgResult == MsgResult.Positive){ // download the serverproject
              
              }             
            })
          },
          error : error => {
            progressController.stepper?.next(0) // close the wait-dialog
            MessageBox(this.modal, {
              title: 'App.Message.Error', 
              context : { AppName : createOptions.appName },
              message: this.createAppPrefix+"Failed",
              buttons: MsgDlgButton.GotIt})
          },
        }) // createApp
      }).catch( nop )   
      
    }).catch( nop )
   
  }

  private prepareCreateAppDlgData() : Promise<CreateAppDlgData>{
    return new Promise<CreateAppDlgData>( (resolve, reject) => {
      var appCodes : string[]
      var appDbNames : string[] 
      var entity = new CreateAppDlgData() 
  
      this.appService.getApps().subscribe({
        next : appSetups => {
          appCodes   = appSetups.map(setup => setup.AppCode as string)
          appDbNames = appSetups.map(setup => setup.AppDbName as string)
        }, 
        error : error =>  
          MessageBox(this.modal, { 
                      message : error,
                      buttons : MsgDlgButton.GotIt
          })
          .subscribe( result => reject(error)),
        complete : () =>  {
          this.appService.getDatabases().subscribe({
            next : databaseNames => {  
              const availableAppDatabases = (databaseNames as string[]).filter(name => !appDbNames.includes(name))
              if (availableAppDatabases?.length){
                entity.CompanyDbName = entity.CompanyName = availableAppDatabases[0]
                resolve(entity)
              }
              else {
                const msg = this.translate.instant('App.Message.NoDbAvailable')
                MessageBox(this.modal, { 
                  message : msg,
                  buttons : MsgDlgButton.GotIt
                })
                .subscribe( dc => reject(msg))
              }
            },
            error : error => MessageBox(this.modal, { 
              message : error,
              buttons : MsgDlgButton.GotIt
              })
              .subscribe( dc => reject(error) ),
          })
        }
      })
    })
   
  }

  //#endregion
}
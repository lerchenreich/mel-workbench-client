import { AfterContentInit, Component} from "@angular/core"
import { Router } from "@angular/router"
import { TranslateService } from "@ngx-translate/core"
import { AlertService, TemplateService, AppConnection,  
         ClientRootComponent, 
         MelRecents, RecentWorkbenchApp } from "mel-client"
import { MelDatabaseTypes, Version } from "mel-common"
import { CreateAppOptions } from "mel-workbench-api"
import { BsModalService } from "ngx-bootstrap/modal"

import { CreateAppDlgData } from "src/app/models/createapp-dialog"
import { WorkbenchService } from "src/app/services/workbench-service"
import { MenuCommand, MenuCommands } from "../app-toolbar/app-toolbar.component"
import { CreateAppDialogComponent } from "../dialogs/create-app-dialog/create-app-dialog.component"


// --> mel-client
import { MessageBox } from "../dialogs/message-dialog/messagebox"
import { MsgResult, MsgDialogButton} from "../dialogs/message-dialog/types"
import { createAppCommand, SelectAppDialogComponent } from "../dialogs/select-app-dialog/select-app-dialog.component"
import { openEntityDialog } from "../dialogs/mel-modal-entity"
import { waitDialog } from "../dialogs/modal-wait/modal-wait.component"
import { openDialog } from "../dialogs/mel-modal"

function nop(reason : any) {} 
@Component({
  selector: 'app-root',
  templateUrl: './app-root.component.html',
  styleUrls: ['./app-root.component.scss']
})
export class AppRootComponent extends ClientRootComponent implements AfterContentInit {
  readonly createAppPrefix = "App.Function.CreateApp."

  constructor(protected router: Router,
              protected modal : BsModalService,      
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
      openDialog<SelectAppDialogComponent, AppConnection>(this.modal, SelectAppDialogComponent)
      .then( (recentApp : AppConnection) => {     
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
    .then( dlgData => {
      openEntityDialog<CreateAppDialogComponent, CreateAppDlgData, CreateAppDlgData>(
        this.modal, 
        CreateAppDialogComponent, 
        dlgData 
      )
      .then( dlgData => {
        var createOptions : CreateAppOptions = {
          appCode : dlgData.AppCode,
          appName : dlgData.AppName,
          version : new Version(dlgData.Version),
          company : {
            name    : dlgData.CompanyName,
            dbName  : dlgData.CompanyDbName
          },
          dropExistingAppDatabase : dlgData.DropExistingAppDatabase,
          renameCompanyDatabase   : dlgData.RenameCompanyDatabase,
          createServerProjectOptions : {
            name        : dlgData.AppCode+'-server',
            version     : dlgData.Version,
            description : `Express-Server for application ${dlgData.AppName}`, 
            keywords    : dlgData.SpKeywords?.split(',') || [],
            author      : dlgData.SpAuthor || '',
            license     : dlgData.SpLicense,
            serverPort  : dlgData.SpServerPort,
            dbConfig: {
              host      : dlgData.SpDbConfigHost,
              port      : dlgData.SpDbConfigPort,
              username  : dlgData.SpDbConfigUsername,
              password  : dlgData.SpDbConfigPassword,
              database  : dlgData.SpDbConfigDatabase,
              ssl       : dlgData.SpDbConfigSsl,
              timeout   : dlgData.SpDbConfigTimeout  
            },
            databaseType :dlgData.SpDatabaseType as MelDatabaseTypes
          },
          createClientProjectOptions : {
            name        : dlgData.AppCode + '-client',
            version     : dlgData.Version,
            description : `Client of application ${dlgData.AppName}`
          } 
        }
        var updateAction = waitDialog(this.modal, this.createAppPrefix+"Running")
        this.workbenchService.createApp(createOptions)
        .subscribe({
          next : createResult => {
            updateAction(null) // close the wait-dialog
            MessageBox(this.modal, {
              title : createResult.success ? this.createAppPrefix+"Title" : 'App.Message.Error',
              message : this.createAppPrefix+(createResult.success?"Success" : "Failed"),
              context : {AppName : createOptions.appName },
              reportItems : createResult.success? undefined : createResult.details,
              buttons : createResult.success ?  MsgDialogButton.YesNo : MsgDialogButton.GotIt,
              default : MsgResult.Positive
            })
            .subscribe( action => {
              if (createResult.success && action == MsgResult.Positive){ // download the serverproject
              }             
            })
          },
          error : error => {
            updateAction(null) // close the wait-dialog
            MessageBox(this.modal, {
              title: 'App.Message.Error', 
              context : { AppName : createOptions.appName },
              message: this.createAppPrefix+"Failed",
              buttons:MsgDialogButton.GotIt})
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
                      buttons : MsgDialogButton.GotIt
          })
          .subscribe( dc => reject(error)),
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
                  buttons : MsgDialogButton.GotIt
                })
                .subscribe( dc => reject(msg))
              }
            },
            error : error => MessageBox(this.modal, { 
              message : error,
              buttons : MsgDialogButton.GotIt
              })
              .subscribe( dc => reject(error) ),
          })
        }
      })
    })
  }

  //#endregion
}
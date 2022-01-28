import { AfterContentInit, Component} from "@angular/core"
import { Router } from "@angular/router"
import { TranslateService } from "@ngx-translate/core"
import { AlertService, TemplateService, AppConnection,  
         ClientRootComponent, 
         MelRecents, RecentWorkbenchApp, WorkbenchApp } from "mel-client"
import { MelDatabaseTypes, Version } from "mel-common"
import { CreateAppOptions } from "mel-workbench-api"
import { BsModalService } from "ngx-bootstrap/modal"

import { CreateAppDlgData } from "src/app/models/createapp-dialog"
import { WorkbenchService } from "src/app/services/workbench-service"
import { MenuCommand, MenuCommands } from "../app-toolbar/app-toolbar.component"
import { CreateAppDialogComponent, openModalWithEntity } from "../dialogs/create-app-dialog/create-app-dialog.component"


// --> mel-client
import { openModal } from "mel-client"
import { MessageBox } from "../dialogs/message-dialog/messagebox"
import { MsgResult, MsgDialogButton} from "../dialogs/message-dialog/types"
import { ModalWaitComponent, openWaitModal } from "mel-client"
import { createAppCommand, SelectAppDialogComponent } from "../dialogs/select-app-dialog/select-app-dialog.component"

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
  private changeApp(appConnection : AppConnection){
    if (appConnection.url.length == 0)
      appConnection.url = this.workbenchService.hRef
    this.currAppConnection = appConnection
    MelRecents.lastRecent = new RecentWorkbenchApp(appConnection)
  }

  ngAfterContentInit(){
    if (!this.workbenchService.hasEndpoint){
      openModal<SelectAppDialogComponent, AppConnection>(this.modal, SelectAppDialogComponent)
      .subscribe( { 
        next : (recentApp : AppConnection) => {     
          if ( recentApp.code === createAppCommand ){
            //get the app-parameter and create a new App
            openModalWithEntity<CreateAppDialogComponent, CreateAppDlgData, CreateAppDlgData>(this.modal, CreateAppDialogComponent)
            .subscribe( { next : dlgData => {
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
              var updateAction = openWaitModal(this.modal, this.createAppPrefix+"Running")
              this.workbenchService.createApp(createOptions)
              .subscribe({
                next : createResult => {
                  updateAction(null) // close the wait-dialog
                  MessageBox(this.modal, {
                    title : this.createAppPrefix+"Title",
                    message : this.createAppPrefix+(createResult.success?"Success" : "Failed"),
                    context : {AppName : "Name"},
                    reportItems : createResult.success? undefined : createResult.details,
                    buttons : createResult.success ?  MsgDialogButton.YesNo : MsgDialogButton.GotIt,
                    default : MsgResult.Positive
                  })
                  .subscribe({
                    next: (action : MsgResult) => {
                      if (createResult.success && action == MsgResult.Positive){ // download the serverproject
                      }
                    }
                  })
                },
                error : error => {
                  MessageBox(this.modal, {title:this.createAppPrefix+"Failed", message:error, buttons:MsgDialogButton.GotIt})
                }
              }) // createApp
            }})
          } // if
          else 
            this.changeApp(recentApp)
        },
        error : reason => this.alertService.alertWarning(reason)
      })
    } // if
  }

  menuCommand(menuCommand : MenuCommand){
    switch(menuCommand.name){
      case MenuCommands.ChangeApp : if (menuCommand.param) this.changeApp(menuCommand.param); break
    }
  }
}
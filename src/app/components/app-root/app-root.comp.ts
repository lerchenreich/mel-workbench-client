import { AfterContentInit, Component} from "@angular/core"
import { Router } from "@angular/router"
import { TranslateService } from "@ngx-translate/core"
import { AlertService, TemplateService, AppConnection,
         ClientRootComponent,
         MelRecents, RecentWorkbenchApp,
         openModalDlg,
         MessageBox,
         ReportView,
         MsgBoxButtons,
         MsgBoxResult,
         animatedDialog} from "mel-client"
import { Version } from "mel-common"
import { CreateAppOptions } from "mel-workbench-api"
import { NgbModal as Modal }  from '@ng-bootstrap/ng-bootstrap';

import { CreateAppDlgData } from "src/app/components/dialogs/create-app/data"
import { WorkbenchService } from "src/app/services/workbench-service"
import { MenuCommand, MenuCommands } from "../app-toolbar/app-toolbar.component"
import { CreateAppDialogComponent } from "../dialogs/create-app/create-app-comp"

import { createAppCommand, SelectAppComponent } from "../dialogs/select-app/select-app-comp"
import { ReportItem } from "mel-workbench-api"
import { noop } from "lodash"

const errorTitle = 'Message.Error'

@Component({
  selector: 'app-root',
  templateUrl: './app-root.comp.html',
  styleUrls: ['./app-root.comp.scss']
})
export class AppRootComponent extends ClientRootComponent implements AfterContentInit {
  readonly createAppPrefix = "App.Function.CreateApp."
  readonly createAppReportPrefix = this.createAppPrefix+'Report.'

  constructor(protected router: Router,
              protected modal : Modal,
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
        var progressController = animatedDialog (this.modal, {
          title : this.createAppPrefix+"Title",
          titleCtx : createOptions,
          label : ''})
        this.workbenchService.createApp(createOptions)
        .subscribe({
          next : createResult => {
            progressController.stepper?.next(0) // close the wait-dialog
            ReportView(this.modal, {
              title : createResult.success ? this.createAppReportPrefix+"Title" : errorTitle,
              message : this.createAppReportPrefix+(createResult.success?"Success" : "Failed"),
              context :createOptions,
              reportItems : createResult.success? [] : createResult.details.map( (detail : ReportItem) => {
                return {
                          annotation : detail.annotation,
                          message : detail.message,
                          result : detail.success}
                      }
              ),
              buttons : createResult.success ?  MsgBoxButtons.YesNo : MsgBoxButtons.GotIt,
              default : MsgBoxResult.Positive
            })
            .then( msgResult => {
              if (createResult.success && msgResult == MsgBoxResult.Positive){ // download the serverproject

              }
            })
          },
          error : error => {
            progressController.stepper?.next(0) // close the wait-dialog
            MessageBox(this.modal, {
              title: errorTitle,
              context : { AppName : createOptions.appName },
              message: this.createAppReportPrefix+"Failed",
              buttons: MsgBoxButtons.GotIt})
          },
        }) // createApp
      }).catch( noop)

    }).catch( noop )

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
                      title : errorTitle,
                      message : error,
                      buttons : MsgBoxButtons.GotIt
          })
          .then( result => { reject(error) }).catch( noop ),
        complete : () =>  {
          this.appService.getDatabases().subscribe({
            next : databaseNames => {
              const availableAppDatabases = (databaseNames as string[]).filter(name => !appDbNames.includes(name))
              if (availableAppDatabases?.length){
                entity.CompanyDbName = availableAppDatabases.join('; ')
                resolve(entity)
              }
              else {
                const msg = this.translate.instant('App.Message.NoDbAvailable')
                MessageBox(this.modal, {
                  title : errorTitle,
                  message : msg,
                  buttons : MsgBoxButtons.GotIt
                })
                .then( dc => reject(msg)).catch( noop )
              }
            },
            error : error => MessageBox(this.modal, {
              title : errorTitle,
              message : error,
              buttons : MsgBoxButtons.GotIt
              })
              .then( dc => reject(error) ).catch( noop ),
          })
        }
      })
    })

  }

  //#endregion
}

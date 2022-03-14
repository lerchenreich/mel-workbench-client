import { AfterContentInit, Component} from "@angular/core"
import { Router } from "@angular/router"
import { TranslateService } from "@ngx-translate/core"
import { noop } from "lodash"

import { MelDatabaseTypes, Version } from "mel-common"
import { AlertService, TemplateService, AppConnection,
         ClientRootComponent,
         MelRecents, RecentWorkbenchApp,
         openModalDlg,
         ReportView,
         MsgBoxButtons,
         MsgBoxResult,
         animatedDialog,
         MelCompanyService,
         ErrorMessage} from "mel-client"
import { CreateAppOptions, CreateServerProjectOptions} from "mel-workbench-api"
import { NgbModal as Modal }  from '@ng-bootstrap/ng-bootstrap';
import { ElectronService } from "ngx-electron"
import JSZip from "jszip"

import { lastValueFrom } from "rxjs"
import { CreateAppDlgData } from "../../components/dialogs/create-app/data"
import { WorkbenchService } from "../../services/workbench-service"
import { MenuCommand, MenuCommands } from "../app-toolbar/app-toolbar.component"
import { CreateAppDlgComponent } from "../dialogs/create-app/create-app-comp"

import { createAppCommand, SelectAppComponent } from "../dialogs/select-app/select-app-comp"

import { CreateServerComponent } from "../dialogs/create-server-project/create-server.comp"
import { CreateServerDlgData } from "../dialogs/create-server-project/data"


const appFunction = "App.Function."
const createAppPrefix = appFunction +"CreateApp."
const createAppReportPrefix = createAppPrefix+'Report.'

const createServerPrefix = appFunction +"CreateServer."
const createServerReportPrefix = createServerPrefix+'Report.'

@Component({
  selector: 'app-root',
  templateUrl: './app-root.comp.html'
  //styleUrls: ['./app-root.comp.scss'] //scrollbars????
})
export class AppRootComponent extends ClientRootComponent implements AfterContentInit {

  constructor(protected router: Router,
              protected modal : Modal,
              public    translate : TranslateService,
              alertService : AlertService,
              private workbenchService : WorkbenchService,
              private companyService : MelCompanyService,
              templateService : TemplateService,
              private eSvc : ElectronService
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
  async menuCommand(menuCommand : MenuCommand){
    switch(menuCommand.name){
      case MenuCommands.ChangeApp : if (menuCommand.param) this.changeApp(menuCommand.param); break
      case MenuCommands.CreateApp : await this.createApp(); break
      case MenuCommands.CreateServer : await this.createServerProject()
    }
  }

  private changeApp(appConnection : AppConnection){
    if (appConnection.url.length == 0)
      appConnection.url = this.workbenchService.hRef
    this.currAppConnection = appConnection
    MelRecents.lastRecent = new RecentWorkbenchApp(appConnection)
  }

  private async createApp() : Promise<void>{

    try{
      var dlgData = await this.prepareCreateAppDlgData()
      try{
        dlgData = await openModalDlg<CreateAppDlgComponent, any, CreateAppDlgData>(
          this.modal,
          CreateAppDlgComponent,
          dlgData
        )
      }
      catch(canceled) { noop; return; }

      const vData = dlgData as Required<CreateAppDlgData>
      var createOptions : CreateAppOptions = {
        appCode : vData.AppCode,
        appName : vData.AppName,
        version : new Version(vData.Version),
        company : {
          name    : vData.CompanyName,
          dbName  : vData.CompanyDbName
        }
      }

      var progressController = animatedDialog (this.modal, {
        title : createAppPrefix+"Title",
        titleCtx : createOptions,
        label : ''})

      try{
        var createResult = await lastValueFrom(this.workbenchService.createApp(createOptions))
      }
      catch(error){
        ErrorMessage(this.modal, createAppReportPrefix+"Failed", createOptions)
        return
      }
      finally{
        progressController.stepper?.next(0) // close the animated-dialog
      }
      try{
        if (createResult.success){
          if (await this.appService.changeApp(createOptions.appCode))
            this.changeApp({url : '', code : createOptions.appCode, name : createOptions.appName })
          else {
            ErrorMessage(this.modal, `Can't change to app with appCode "${createOptions.appCode}" `)
            return
          }
        }
        ReportView(this.modal, {
          title   : createAppReportPrefix+ (createResult.success ? "Title" : "ErrorTitle"),
          message : createAppReportPrefix+ (createResult.success ? "Success" : "Failed"),
          context :createOptions,
          reportItems : createResult.success? [] : createResult.reportItems,
          buttons : createResult.success ?  MsgBoxButtons.YesNo : MsgBoxButtons.GotIt,
          default : MsgBoxResult.Positive
        })
        .then( async msgResult => {
          if (createResult.success && msgResult == MsgBoxResult.Positive){ // create and download the serverproject
            this.createServerProject().then(noop).catch(noop)
          }
        })
        .catch( noop )
      }
      catch(error){
        progressController.stepper?.next(0) // close the wait-dialog
        ErrorMessage(this.modal, error as Error)
      }
     }
    catch(error){
      ErrorMessage(this.modal, error as Error)
    }

  }

  private async prepareCreateAppDlgData() : Promise<CreateAppDlgData>{
    return new Promise<CreateAppDlgData>( (resolve, reject) => {
      var appCodes : string[]
      var appDbNames : string[] = []
      var companyDbNames : string[] = []
      var entity = new CreateAppDlgData()

      this.workbenchService.getAppSetups().subscribe({
        next : appSetups => {
          appCodes   = appSetups.map(setup => setup.AppCode as string)
          appDbNames = appSetups.map(setup => setup.AppDbName as string)
        },
        error : error => reject(error),
        complete : async () =>  {
          // get all company-databasenames to exclude
          try{
            for(let appCode of appCodes){
              if (await this.workbenchService.changeApp(appCode))
                await this.companyService.findMany()
                .forEach(companies =>
                  companyDbNames.push(...companies.map(company =>
                    company.DbName as string)))
            }
          }
          catch(error){
            reject(error)
            return
          }
          this.workbenchService.getDatabases().subscribe({
            next : databaseNames => {
              entity.CompanyDbNames = databaseNames.filter(name => !appDbNames.includes(name) && !companyDbNames.includes(name))
              if (entity.CompanyDbNames.length){
                resolve(entity)
              }
              else {
                reject('App.Message.NoDbAvailable')
              }
            },
            error : error => reject(error)
          })
        }
      })
    })
  }

  private async createServerProject() : Promise<void> {
    var dlgData : Partial<CreateServerDlgData> = {
      Name : this.appCode.toLocaleLowerCase()+'-server',
      Description : `Express-Server for...`,
      DbConfigHost: '192.168.',
      DbConfigPort : 3307,
      ServerPort : 0,
      Keywords : "",
      Author : '',
      TargetDir : '',
      DbConfigPassword : "ChangeMe"
    }

    try{ // determin the database
      var melSetup = await lastValueFrom(this.appService.getAppSetup())
      dlgData.DbConfigDatabase = melSetup.AppDbName
    }
    catch( error ) { ErrorMessage(this.modal, error as Error ); return }
    try{ // options-Dialog
      dlgData =  await openModalDlg<CreateServerComponent, CreateServerDlgData, CreateServerDlgData>(
        this.modal,
        CreateServerComponent,
        dlgData
      )
    }
    catch(error){ noop; return } // dialog canceld

    var createOptions : CreateServerProjectOptions = {
      name        : dlgData.Name as string,
      version     : dlgData.Version as string,
      description : dlgData.Description,
      keywords    : dlgData.Keywords?.split(',').map( (key : string) => key.trim()) || [],
      author      : dlgData.Author || '',
      license     : dlgData.License || '',
      gitAccount  : dlgData.GitAccount || 'enter_gitaccount',
      serverPort  : dlgData.ServerPort as number,
      dbConfig: {
        host      : dlgData.DbConfigHost as string,
        port      : dlgData.DbConfigPort as number,
        username  : dlgData.DbConfigUsername as string,
        password  : dlgData.DbConfigPassword as string,
        database  : dlgData.DbConfigDatabase as string,
        ssl       : dlgData.DbConfigSsl as boolean,
        timeout   : dlgData.DbConfigTimeout as number * 1000
      },
      databaseType :dlgData.DatabaseType as MelDatabaseTypes
    }
    try{ // check the targetfolder
      var projectFolder= [dlgData.TargetDir, dlgData.Name]
      if (await this.eSvc.ipcRenderer.invoke("fs-exist", projectFolder)){
        var dirEnt = await this.eSvc.ipcRenderer.invoke('fs-dir', 'list', projectFolder) as any[]
        if (dirEnt.length > 0)
          throw createServerPrefix+'ProjectFolderNotEmpty'
      }
      else {
        await this.eSvc.ipcRenderer.invoke('fs-dir','mk', projectFolder)
      }
    }
    catch(error){ ErrorMessage(this.modal, error as Error); return }

    try{ // createServerProject
      const createResult = await lastValueFrom(this.workbenchService.createServerProject(createOptions))
      if (createResult.success && createResult.result){
        var serverZip = await JSZip.loadAsync(createResult.result, {base64 : true, createFolders : true})
        const projectZipFolder = serverZip.folder(createOptions.name)
        if (projectZipFolder) {
          //create the folderstructure
          for(let folder of projectZipFolder.filter( (path , file) => file.dir )) {
            await this.eSvc.ipcRenderer.invoke('fs-dir','mk', [dlgData.TargetDir, folder.name])
          }

          const dataPromises : Promise<string>[] = []
          const fileNames : string[] = []
          projectZipFolder.forEach( (path, zippedFile) => {
            if (!zippedFile.dir){
              fileNames.push(zippedFile.name) //contains the path
              dataPromises.push(zippedFile.async('string'))
            }
          });
          const zippedDatas = await Promise.all(dataPromises)
          for(let i in zippedDatas){
            const zippedData = zippedDatas[i]
            await this.eSvc.ipcRenderer.invoke('fs-write', [dlgData.TargetDir, fileNames[i]], zippedData, false)
          }
        }
      } // success

      ReportView(this.modal, {
        title   : createServerReportPrefix+ (createResult.success ? "Title" : "ErrorTitle"),
        message : createServerReportPrefix+ (createResult.success ? "Success" : "Failed"),
        context : Object.assign(dlgData, { appName : this.appName}),
        reportItems : createResult.success? [] : createResult.reportItems,
        buttons : MsgBoxButtons.GotIt,
        default : MsgBoxResult.Positive
      }).then( noop ).catch( noop )

      this.router.navigate(['object-designer'], {})
    }
    catch(error ) { ErrorMessage(this.modal, error as Error); }
  } //createServerProject()
}

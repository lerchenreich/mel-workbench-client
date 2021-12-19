
import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { isEmpty } from 'lodash'
import { StringKeyPair, NumberKeyPair, GetAppResult } from 'mel-common'

import * as Recent from './recents'
import * as D from './components/core/directives'

import { TranslateService } from '@ngx-translate/core'
import { AlertService } from './services/alert.service'
import { IconService } from './services/icon-service'
import { FieldTemplates, TemplateService } from './template.service'
import { AppService } from './services/app-service'

import { createAppCommand, SelectAppDialogComponent } from './components/dialogs/selectApp-dialog/selectApp-dialog.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit, AfterViewInit, AfterContentInit {
 
  allApps : StringKeyPair[] = [new StringKeyPair({key : createAppCommand, value : 'CreateApp' })]
  appName : string = 'No App selected' 

  constructor(  private router: Router,
                public translate: TranslateService, 
                protected appService : AppService,
                private modalService : NgbModal,      
                private alertService : AlertService, 
                private iconService : IconService,
                private templateService : TemplateService
                ){ 
    translate.setDefaultLang('en')
    translate.use('de')

  } 
  get currCompany() : NumberKeyPair | undefined { return Recent.currentCompany() }
  get appCode() : string { return Recent.currentApp()?.key || ''}
  get title() : string {    
    return `Mel-Workbench - App: ${this.appName}` 
  }

 
  get menuData() { 
    const companiesExist = Recent.hasCompanies()
    const recentExist = !isEmpty(Recent.otherApps()) 
    const appsExist = !isEmpty(this.allApps)
    return {
      data : { 
        apps        : appsExist ? this.allApps : [],
        recentApps  : recentExist ? Recent.otherApps() : [],
        companies   : companiesExist? Recent.otherCompanies() : []
      },
      display : {
        changeCompany : companiesExist ? 'inline' : 'none',
        recentApps: recentExist ? 'inline' : 'none',
        setup : 'inline'
      }
    }
  }

  @ViewChild(D.ViewInput)    viewInputTpl?    : D.ViewInput  
  @ViewChild(D.CardInput)    cardInputTpl?    : D.CardInput  
  @ViewChild(D.ListInput)    listInputTpl?    : D.ListInput  
  
  @ViewChild(D.ViewBoolean)  viewBooleanTpl?  : D.ViewBoolean 
  @ViewChild(D.CardBoolean)  cardBooleanTpl?  : D.CardBoolean 
  @ViewChild(D.ListBoolean)  listBooleanTpl?  : D.ListBoolean 
  @ViewChild(D.ViewEnum)     viewEnumTpl?     : D.ViewEnum
  @ViewChild(D.CardEnum)     cardEnumTpl?     : D.CardEnum
  @ViewChild(D.ListEnum)     listEnumTpl?     : D.ListEnum
 
  ngOnInit(): void {
    this.iconService.registerIcons()  

  }
  ngAfterViewInit() {
    this.templateService.clear()
    this.templateService.add(FieldTemplates.viewInput, (this.viewInputTpl as D.ViewInput).tpl)
    this.templateService.add(FieldTemplates.cardInput, (this.cardInputTpl as D.CardInput).tpl)
    this.templateService.add(FieldTemplates.listInput, (this.listInputTpl as D.ListInput).tpl)
    this.templateService.add(FieldTemplates.viewBoolean, (this.viewBooleanTpl as D.ViewBoolean).tpl)
    this.templateService.add(FieldTemplates.listBoolean, (this.listBooleanTpl as D.ListBoolean).tpl)
    this.templateService.add(FieldTemplates.cardBoolean, (this.cardBooleanTpl as D.CardBoolean).tpl)
    this.templateService.add(FieldTemplates.viewEnum, (this.viewEnumTpl as D.ViewEnum).tpl)
    this.templateService.add(FieldTemplates.cardEnum, (this.cardEnumTpl as D.CardEnum).tpl)
    this.templateService.add(FieldTemplates.listEnum, (this.listEnumTpl as D.ListEnum).tpl)
  }

  onServiceRunning() {
    this.appService.getAppDatabases().subscribe(apps => this.allApps = apps)              
  }
 
  waitForAppService(onDismiss : (reason : any) => void) : void {
    var modalRef = this.modalService.open(SelectAppDialogComponent, {centered : true})
    modalRef.result.then( appKeyPair => {
      if (appKeyPair.key === createAppCommand)
        this.router.navigate(['create-app'], {})
      else {
        Recent.changeApp(appKeyPair)
        this.appName = appKeyPair.value
        this.onServiceRunning()
      }
    })
    .catch(reason => onDismiss(reason))
  }

  changeAppTo(appKey : string) {
    const app = this.allApps.find(app => app.key === appKey)
    if (app){
      Recent.changeApp(app)
      this.appName = app.value
    }
  }

  private appServiceRunning(result : GetAppResult) : boolean{
    if (!isEmpty(result)) { // appservice alive
      if (this.appCode === result.app?.code){
        this.changeAppTo(result.app.code)
        this.onServiceRunning()
        return true
      }
    }
    return false
  }
  /**
   * Ping at first the masterservice. if the masterservice is not the appservice, ping the appService
   * If the appService is not running show the dialog "waitForAppservice", where the user can select another app
   */
  ngAfterContentInit(){
    const dismissMsg = 'No service available!'
    this.appService.pingMaster()
    .subscribe( {
      next : result => {
        if (!this.appServiceRunning(result)){          
          this.appService.getApp()
          .subscribe({
            next : result => {
              if (!this.appServiceRunning(result)) 
                this.waitForAppService(dismiss => this.alertService.alertWarning(dismissMsg))
            },
            error : error => this.waitForAppService(dismiss => this.alertService.alertWarning(dismissMsg))
          })
        }
      },
      error :  error => {
        console.error(error); 
        this.waitForAppService(dismiss => this.alertService.alertWarning(dismissMsg))
      }
    })
  }

  /*
  changeCompanyTo(companyId : number) {
    if (Recent.hasCompanies()) {
      Recent.changeCompany(new NumberKeyPair( {key: companyId, value : ""}) )
      this.router.navigate([''], {})
    }
    else this.router.navigate(['home'], {})
    
  }
  */
}


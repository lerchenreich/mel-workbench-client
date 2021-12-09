
import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { AlertService } from './services/alert.service'

import { IconService } from './services/icon-service'
import  * as D from './components/core/directives'
import { FieldTemplates, TemplateService } from './template.service'
import { MelSetup } from './models/mel-setup'
import { MelSetupService } from './services/melservices'
import { Router } from '@angular/router'
import { otherApps, changeApp, changeCompany, currentApp, currentCompany, hasCompanies, otherCompanies } from './recents'
import { AppService } from './services/app-service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { createAppCommand, SelectAppDialogComponent } from './components/dialogs/selectApp-dialog/selectApp-dialog.component'
import { KeyPair } from 'mel-common'
import { isEmpty } from 'lodash'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit, AfterViewInit, AfterContentInit {
 
  allApps     : KeyPair[]
  melSetup    : MelSetup

  constructor(  private router: Router,
                public translate: TranslateService, 
                protected appService : AppService,
                private modalService : NgbModal,
                private setupService : MelSetupService,             
                private alertService : AlertService, 
                private iconService : IconService,
                private templateService : TemplateService
                ){ 
    translate.setDefaultLang('en')
    translate.use('de')
  } 
  get currCompany() : KeyPair { return currentCompany() }
  get appCode() : string { return currentApp()?.key }
  get title() : string {    
    return `Mel-Workbench - App: ${this.melSetup?.AppName}` 
  }

 
  get menuData() { 
    const companiesExist = hasCompanies()
    const recentExist = !isEmpty(otherApps()) 
    const appsExist = !isEmpty(this.allApps)
    return {
      data : { 
        apps        : appsExist ? this.allApps : [],
        recentApps  : recentExist ? otherApps() : [],
        companies   : companiesExist? otherCompanies() : []
      },
      display : {
        changeCompany : companiesExist ? 'inline' : 'none',
        recentApps: recentExist ? 'inline' : 'none',
        setup : 'inline'
      }
    }
  }

  @ViewChild(D.ViewInput)    viewInputTpl    : D.ViewInput  
  @ViewChild(D.CardInput)    cardInputTpl    : D.CardInput  
  @ViewChild(D.ListInput)    listInputTpl    : D.ListInput  
  
  @ViewChild(D.ViewBoolean)  viewBooleanTpl  : D.ViewBoolean 
  @ViewChild(D.CardBoolean)  cardBooleanTpl  : D.CardBoolean 
  @ViewChild(D.ListBoolean)  listBooleanTpl  : D.ListBoolean 
  @ViewChild(D.ViewEnum)     viewEnumTpl     : D.ViewEnum
  @ViewChild(D.CardEnum)     cardEnumTpl     : D.CardEnum
  @ViewChild(D.ListEnum)     listEnumTpl     : D.ListEnum
 
  ngOnInit(): void {
    this.iconService.registerIcons()  

  }
  ngAfterViewInit() {
    this.templateService.clear()
    this.templateService.add(FieldTemplates.viewInput, this.viewInputTpl.tpl)
    this.templateService.add(FieldTemplates.cardInput, this.cardInputTpl.tpl)
    this.templateService.add(FieldTemplates.listInput, this.listInputTpl.tpl)
    this.templateService.add(FieldTemplates.viewBoolean, this.viewBooleanTpl.tpl)
    this.templateService.add(FieldTemplates.listBoolean, this.listBooleanTpl.tpl)
    this.templateService.add(FieldTemplates.cardBoolean, this.cardBooleanTpl.tpl)
    this.templateService.add(FieldTemplates.viewEnum, this.viewEnumTpl.tpl)
    this.templateService.add(FieldTemplates.cardEnum, this.cardEnumTpl.tpl)
    this.templateService.add(FieldTemplates.listEnum, this.listEnumTpl.tpl)
  }

  onServiceRunning() {
    this.getSetup()
    this.appService.getAppDatabases().subscribe(apps => this.allApps = apps)              

  }
  getSetup() : void {
    this.setupService.findLast()
    .subscribe( 
      appSetup => this.melSetup = appSetup,
      error =>  this.alertService.alertError(error),
      () => this.router.navigate(['create-server', {}]) 
    )
  }
  waitForAppService(onDismiss : (reason : any) => void) : void {
    var modalRef = this.modalService.open(SelectAppDialogComponent, {centered : true})
    modalRef.result.then( appKeyPair => {
      if (appKeyPair.key === createAppCommand)
        this.router.navigate(['create-app'], {})
      else {
        changeApp(appKeyPair)
        this.onServiceRunning()
      }
    })
    .catch(reason => onDismiss(reason))
  }

 
  changeAppTo(appKey : string) {
    changeApp(this.allApps.find(app => app.key === appKey))
    this.getSetup()
  }
  ngAfterContentInit(){
    this.appService.pingMaster()
    .subscribe( 
      pong => {
        if (this.appCode)
          this.onServiceRunning()
        else
          this.waitForAppService(dismiss => this.alertService.alertWarning('No service available!'))
      },
      error => this.waitForAppService(dismiss => this.alertService.alertWarning('No service available!'))
    )
  }

  
  changeCompanyTo(companyCode : string) {
    if (hasCompanies()) {
      changeCompany(new KeyPair( {key: companyCode, value : ""}) )
      this.router.navigate([''], {})
    }
    else this.router.navigate(['home'], {})
    
  }
}


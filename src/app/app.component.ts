
import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { isEmpty } from 'lodash'

import * as Recent from './recents'
import * as D from './components/core/directives'

import { TranslateService } from '@ngx-translate/core'
import { AlertService } from './services/alert.service'
import { IconService } from './services/icon-service'
import { FieldTemplates, TemplateService } from './template.service'
import { AppService } from './services/app-service'

//import { createAppCommand } from './components/dialogs/selectApp-dialog/selectApp-dialog.component'
import { ConnectDialogComponent } from './components/dialogs/connect-dialog/connect-dialog.component'
import { MelSetup } from './models/mel-setup'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit, AfterViewInit, AfterContentInit {
  readonly noRecentApp : Recent.AppDescr = { url : '', code:'', name :'"No app selected"'} 
  //readonly createAppDescr = new Recent.AppDescr('',  createAppCommand, 'CreateApp')
  private _allApps : Recent.AppDescr[] = []
  currApp  = Recent.lastRecentApp() || this.noRecentApp

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
  //get currCompany() : NumberString | undefined { return Recent.currentCompany() }
  set allApps(apps : Recent.AppDescr[]) {
    this._allApps = apps
  }
  get allApps() : Recent.AppDescr[] { return this._allApps }
  
  get appCode() : string { return this.currApp.code as string }
  get appUrl() : string { return this.currApp.url }
  get appName() : string { return this.currApp.name as string}
  get title() : string {    
    return `Mel-Workbench - App: ${this.appName}` 
  }

  get menuData() { 
    //const companiesExist = Recent.hasCompanies()
    const others = Recent.otherApps()
    //const appsExist = this.allApps.length > 1
    return {
      data : { 
        apps        : this.allApps,
        recentApps  : others,
        //companies   : companiesExist? Recent.otherCompanies() : []
      },
      display : {
        //changeCompany : companiesExist ? 'inline' : 'none',
        recentApps: isEmpty(others) ? 'none' : 'inline',
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
    this.templateService.add(FieldTemplates.viewInput,    (this.viewInputTpl    as D.ViewInput).tpl)
    this.templateService.add(FieldTemplates.cardInput,    (this.cardInputTpl    as D.CardInput).tpl)
    this.templateService.add(FieldTemplates.listInput,    (this.listInputTpl    as D.ListInput).tpl)
    this.templateService.add(FieldTemplates.viewBoolean,  (this.viewBooleanTpl  as D.ViewBoolean).tpl)
    this.templateService.add(FieldTemplates.listBoolean,  (this.listBooleanTpl  as D.ListBoolean).tpl)
    this.templateService.add(FieldTemplates.cardBoolean,  (this.cardBooleanTpl  as D.CardBoolean).tpl)
    this.templateService.add(FieldTemplates.viewEnum,     (this.viewEnumTpl     as D.ViewEnum).tpl)
    this.templateService.add(FieldTemplates.cardEnum,     (this.cardEnumTpl     as D.CardEnum).tpl)
    this.templateService.add(FieldTemplates.listEnum,     (this.listEnumTpl     as D.ListEnum).tpl)
  }
  ngAfterContentInit(){
    if (this.appService.hasEndpoint){
      const dismissMsg = 'No service available!'
      this.appService.getApps()
      .subscribe( {
        next : (setups : MelSetup[]) => {
          this.allApps = setups.map(setup => {
            const recentApp = Recent.findFirstAppByCode(setup.AppCode as string)
            return new Recent.AppDescr(recentApp?.url || '', setup.AppCode as string, setup.AppName as string)
          })
        },
        error :  error => {
          console.error(error); 
          this.alertService.alertError(error)
        }
      })
    }
    else {
      var modalRef = this.modalService.open(ConnectDialogComponent, {centered : true})
      modalRef.result.then( (appDescr : Recent.AppDescr) => {
        Recent.changeApp(appDescr)
      })
      .catch(reason => this.alertService.alertWarning(reason))
    }
  }

  
}


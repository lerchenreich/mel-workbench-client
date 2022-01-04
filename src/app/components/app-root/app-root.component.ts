import { AfterContentInit, Component } from "@angular/core"
import { Router } from "@angular/router"
import { NgbModal } from "@ng-bootstrap/ng-bootstrap"
import { TranslateService } from "@ngx-translate/core"
//import { CompNumberString } from "mel-common"
import { AlertService } from "mel-client"

import { TemplateService } from "mel-client"
import { ConnectDialogComponent } from "mel-client"

import { AppDescr, changeApp } from "mel-client"
import { AppService } from "mel-client"
import { ClientRootComponent } from "mel-client"

@Component({
  selector: 'app-root',
  templateUrl: './app-root.component.html',
  styleUrls: ['./app-root.component.scss']
})
export class AppRootComponent extends ClientRootComponent implements AfterContentInit {
  constructor( protected router: Router,
               alertService : AlertService,
               appService : AppService,
               protected modalService : NgbModal,      
               public    translate : TranslateService,
                templateService : TemplateService,               
             ){ 
    super(alertService, appService, templateService)
  } 
  //get currCompany() : NumberString | undefined { return Recent.currentCompany() }

  ngAfterContentInit(){
    if (!this.appService.hasEndpoint){
    
      var modalRef = this.modalService.open(ConnectDialogComponent, {centered : true})
      modalRef.result.then( (appDescr : AppDescr) => {
        changeApp(appDescr)
      })
      .catch(reason => this.alertService.alertWarning(reason))
    }
  }

  /*
  ngAfterContentInit(){
    if (!this.appService.hasEndpoint){
      var modalRef = this.modalService.open(ChangeCompanyDialogComponent, {centered : true})
      modalRef.result.then( (recentCompanies : RecentCompanies) => {
        this.melAfterCompanySelected(recentCompanies.lastRecent as CompNumberString)
      })
      .catch(reason => this.alertService.alertWarning(reason))
    }
  }
  melAfterCompanySelected(lastRecent : CompNumberString){
    // change to the lastRecent company
  }
  */
}
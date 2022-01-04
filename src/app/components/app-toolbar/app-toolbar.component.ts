import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'
import { MelSetup } from "mel-client";
import { AppDescr, findFirstAppByCode, otherApps } from "mel-client"
import { AlertService } from "mel-client"
import { AppService } from "mel-client"


@Component({
  selector: 'app-toolbar',
  templateUrl: './app-toolbar.component.html',
  styleUrls: ['./app-toolbar.component.css']
})
export class AppToolbarComponent implements OnInit {
  private _allApps : AppDescr[] = []

  constructor(public translate: TranslateService, 
              private alertService : AlertService,     
              private appService : AppService ) { 

  }
  set allApps(apps  : AppDescr[]) { this._allApps = apps }
  get allApps()     : AppDescr[]  { return this._allApps }

  ngOnInit(): void {
    if (this.appService.hasEndpoint){
      const dismissMsg = 'No service available!'
      this.appService.getApps()
      .subscribe( {
        next : (setups : MelSetup[]) => {
          this.allApps = setups.map(setup => {
            const recentApp = findFirstAppByCode(setup.AppCode as string)
            return new AppDescr(recentApp?.url || '', setup.AppCode as string, setup.AppName as string)
          })
        },
        error :  error => {
          console.error(error); 
          this.alertService.alertError(error)
        }
      })
    }
  }
  get menuData() { 
    //const companiesExist = Recent.hasCompanies()
    const others = otherApps()
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
}

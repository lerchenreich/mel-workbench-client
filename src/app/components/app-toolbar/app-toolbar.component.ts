import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'

import { MelSetup,AlertService, AppService, AppConnection, MelRecents } from "mel-client"

export declare type MenuCommand = { name : MenuCommands, param? : any}
export enum MenuCommands {
  ChangeApp = 'changeapp',
  CreateApp = 'createapp',
  CreateServer = 'createserver',
  CreateClient = 'createclient'
}
@Component({
  selector: 'app-toolbar',
  templateUrl: './app-toolbar.component.html'
})
export class AppToolbarComponent implements OnInit {
  readonly transPrefix = 'App.Menu.More'
  get CreateServer() : string { return this.transPrefix + "CreateServer" }
  get CreateClient() : string { return this.transPrefix + "CreateClient" }
  get RunSetup() : string { return this.transPrefix + "Setup" }
  get CreateApp() : string { return this.transPrefix + "CreateApp" }
  get AllApps() : string { return this.transPrefix + "AllApps" }


  constructor(public translate: TranslateService,
              private alertService : AlertService,
              private appService : AppService ) {
  }
  errorState : boolean = true
  appConnections : AppConnection[] = []

  @Output() menuCommand  = new EventEmitter<MenuCommand>()

  get menuData() {
    //const companiesExist = Recent.hasCompanies()
    const others = MelRecents.otherElements
    //const appsExist = this.allApps.length > 1
    return {
      data : {
        apps        : this.appConnections,
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
  ngOnInit(): void {
    if (this.appService.hasEndpoint){
      this.appService.getAppSetups()
      .subscribe( {
        next : (setups : MelSetup[]) => {
          this.appConnections = setups.map(setup => {
            const recentApp = MelRecents.elements.find(element => element.code === setup.AppCode as string)
            return { url : recentApp?.url || '', code : setup.AppCode as string, name : setup.AppName as string }
          })
        },
        error :  error => {
          this.errorState = true
          this.alertService.alertError(error)
        },
        complete: () => { this.errorState = false}
      })
    }
  }

  changeAppTo(appCode : string)  {
    this.menuCommand.emit({
      name : MenuCommands.ChangeApp,
      param : this.appConnections.find(con => con.code ==  appCode)
    })
  }
  createApp(){
    this.menuCommand.emit({name : MenuCommands.CreateApp})
  }
  createServer(){
    this.menuCommand.emit({name : MenuCommands.CreateServer})
  }
  createClient(){
    this.menuCommand.emit({name : MenuCommands.CreateClient})
  }
}

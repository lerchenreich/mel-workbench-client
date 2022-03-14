import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NgbActiveModal as ModalActive } from '@ng-bootstrap/ng-bootstrap';

import { isEmpty } from 'lodash'
import { StringString } from 'mel-common';

import { ClientConfig, CLIENT_CONFIG, AlertService, MelSetup, AppConnection, MelModal } from 'mel-client';
import { WorkbenchService } from 'src/app/services/workbench-service';

export const createAppCommand = "__createApp__"

/**
 * This page ist called, when
 * 1. no recent app exist (in case of first run or cookies deleted)
 * 2. no connection to the worchbench-server could be established or
 * 3. the user wants to change the app
 *
 *
 */
@Component({
  selector: 'select-app-dialog',
  templateUrl: './select-app-comp.html',

})
@UntilDestroy()
export class SelectAppComponent extends MelModal<any, AppConnection> implements OnInit {
  readonly createAppCommand = createAppCommand
  readonly transPrefix  = "App.Dialog.SelectApp."
  get Title()         { return this.transPrefix + "Title" }
  get NoServer()      { return this.transPrefix + "NoServer"}
  get UrlValid()      { return this.transPrefix + 'UrlValid' }
  get LabelEnterUrl() { return this.transPrefix + 'Url.Label'}
  get HintUrl()       { return this.transPrefix + 'Url.Hint'}
  get UrlInvalid()    { return this.transPrefix + 'Url.Invalid'}
  get SelectAppLabel(){ return this.transPrefix + 'SelectApp.Label'}
  get SelectAppHint() { return this.transPrefix + 'SelectApp.Hint'}
  get CreateAppOption(){return this.transPrefix + 'Command.CreateApp' }
  get HintSelect()     {return this.transPrefix + 'HintSelect'}



  constructor(modalAct : ModalActive,
              private workbenchService : WorkbenchService,
              private alertService : AlertService,
              public  translate : TranslateService,
              @Inject(CLIENT_CONFIG) public config : ClientConfig) {
    super(modalAct)
  }
  dlgErrorText : string = ''
  urlErrorText : string = ''
  connected : boolean = false
  useSsl : boolean = false
  get protocol() : string { return `http${this.useSsl?'s':''}://` }
  ipPort : string = ''
  get url() : string { return this.protocol + this.ipPort}
  urlOk : boolean = false

  selectedApp : StringString = { key : '', value : ''}
  selectOptions : StringString[] = []

  set dlgData(data : any){ }
  get enableOk() : boolean { return this.urlOk && this.connected }
  get enableConnect() : boolean { return this.urlOk && !this.connected }

  get returnValue(): AppConnection {
    if (this.selectedApp)
      return  (this.selectedApp.key === createAppCommand)?
          { url :'', code : createAppCommand, name : '' }
        : { url : this.url, code : this.selectedApp?.key, name : this.selectedApp.value }

    throw new Error("FATAL");

  }
  private setSelectOptions(apps : MelSetup[]){
    this.selectOptions = apps
      .filter(app => !isEmpty(app.AppCode) && !isEmpty(app.AppName) && !isEmpty(app.AppDbName) )
      .map(app => { return { key : app.AppCode as string, value : app.AppName as string} })
  }

  ngOnInit() {
    if (this.config.hasEndpoint){
      this.connect()
    }
  }

  onUrlChanged(){
    this.urlErrorText = ''
    this.urlOk = false
    const hostIndex = this.ipPort.lastIndexOf('://')
    if (hostIndex >= 0)
      this.ipPort = this.ipPort.substring(hostIndex+3)
    if (this.ipPort.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/) !== null){
      try {
        this.config.endPoint = this.url // validate the url
        this.connect()
        this.urlOk = true
        return
      }
      catch(err){
      }
    }
    this.urlErrorText = this.UrlInvalid
    this.urlOk = false
  }

  connect(){
    this.workbenchService.isWorkbench().subscribe({
      next  : isWorkbench  => { this.connected = isWorkbench },
      complete : () => {
        if (this.connected){
          this.workbenchService.unlock()
          this.urlErrorText = ''
          this.workbenchService.getAppSetups().subscribe({
            next : melSetups => this.setSelectOptions(melSetups),
            error: err => {
              this.connected = false
              this.alertService.alertError(err)
            },
            complete: () => {
              if (isEmpty(this.selectOptions))
                this.selectedApp = { key : createAppCommand, value : ''}
              else
                Object.assign(this.selectedApp, this.selectOptions[0])
                this.selectedApp.key = this.selectedApp.key
              }
          })
        }
        else this.urlErrorText = this.NoServer
      } // complete
    })
  }

  onSelectionChanged(){
    this.config.appCode = this.selectedApp.key as string
    this.selectedApp.value = this.selectOptions.find(option => option.key == this.selectedApp.key)?.value as string
  }

  createApp() {
    this.selectedApp = {
      key : createAppCommand,
      value : '',
    }
    this.okClicked()
  }
}

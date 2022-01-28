import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy } from '@ngneat/until-destroy';

import { isEmpty } from 'lodash'
import { StringString } from 'mel-common';

import { ClientConfig, CLIENT_CONFIG, AlertService, MelSetup, AppConnection, PageTypes, WorkbenchApp } from 'mel-client';
import { WorkbenchService } from 'src/app/services/workbench-service';
import { MelModal } from 'mel-client';
import { BsModalRef } from 'ngx-bootstrap/modal';

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
  templateUrl: './select-app-dialog.component.html',
  styleUrls: ['./select-app-dialog.component.css']
})
@UntilDestroy()
export class SelectAppDialogComponent extends MelModal<any, AppConnection> implements OnInit {
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
 
  readonly createAppCommand = createAppCommand 

  dlgErrorText : string = ''
  urlErrorText : string = ''
  connected : boolean = false
  url : string = ''

  selectedApp: StringString = { key : createAppCommand, value : '' }
  
  constructor(public  modalRef : BsModalRef, 
              private workbenchService : WorkbenchService, 
              private alertService : AlertService, 
              public  translate : TranslateService, 
              @Inject(CLIENT_CONFIG) public config : ClientConfig) {
    super(modalRef)
  }
 
  selectOptions : StringString[] = []
  
  override prepareReturnValue(): AppConnection {
    return  (this.selectedApp.key === createAppCommand)? { url :'', code : createAppCommand, name : ''} 
      : { url : this.url, code : this.selectedApp.key, name : this.selectedApp.value } 
  }
  private setSelectOptions(apps : MelSetup[]){
    this.selectOptions = apps
      .filter(app => !isEmpty(app.AppCode) && !isEmpty(app.AppName) && !isEmpty(app.AppDbName) )
      .map(app => { return { key : app.AppCode as string, value : app.AppName as string} }) 
  }
  //private get melSetups() : MelSetup[] { return this._melSetups }

  get disableOk() : boolean { return (this.dlgErrorText.length + this.urlErrorText.length) > 0}
  
  initDialogData(data: any): void {    
  }

  ngOnInit() {
    if (this.config.hasEndpoint){
      this.connect()
    }
  }
  
  onUrlChanged(){
    this.urlErrorText = ''
    if (!isEmpty(this.url)){
      try {
        this.config.endPoint = this.url // validate the url
        this.connect()
      }      
      catch(err){
        this.urlErrorText = this.UrlInvalid
      }
    }
  }

  connect(){
    this.workbenchService.isWorkbench().subscribe({
      next  : isWorkbench  => { this.connected = isWorkbench },
      complete : () => {
        if (this.connected){
          this.workbenchService.unlock()
          this.urlErrorText = ''
          this.workbenchService.getApps().subscribe({
            next : melSetups => this.setSelectOptions(melSetups),
            error: err => this.alertService.alertError(err),
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
    if (this.selectedApp.key === createAppCommand) {
      this.selectedApp.value = ''
    }
    else {
      this.config.appCode = this.selectedApp.key as string
      this.selectedApp.value = this.selectOptions.find(option => option.key == this.selectedApp.key)?.value as string
    }
  }

}

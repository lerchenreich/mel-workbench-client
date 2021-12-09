import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'
import { ClientConfig, CLIENT_CONFIG } from 'src/app/client.configs';
import { AppService } from 'src/app/services/app-service';
import { AppServiceObserver, MasterServiceObserver, ServiceStates, WaitingFor} from '../../serviceObserver';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AlertService } from 'src/app/services/alert.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KeyPair } from 'mel-common';

export const createAppCommand = "__createApp__"


/**
 * This page ist called, when no recent app exist (in case of first run or cookies deleted)
 * or no connection to the recent app could be established
 * In case of first run or no app-service exist yet, you have to start the master-service to create a new app
 * or finish generating your app-service
 * If an app-service exist, you have to start only this service
 */

@Component({
  selector: 'selectapp-dialog',
  templateUrl: './selectApp-dialog.component.html',
  styleUrls: ['./selectApp-dialog.component.css']
})
@UntilDestroy()
export class SelectAppDialogComponent implements OnInit {

  readonly transPrefix = "GettingStarted."
  readonly createCommand = createAppCommand
  
  private _waitingFor : WaitingFor = WaitingFor.None

  selectedAppCode : string
  masterState : ServiceStates = ServiceStates.None
  masterServiceObserver : MasterServiceObserver

  appState : ServiceStates = ServiceStates.None
  appServiceObserver : AppServiceObserver
  appKeyPairs : KeyPair[] = []

  originalAppCode : string

  constructor(public activeModal : NgbActiveModal, protected appService : AppService, public alertService : AlertService, public translate : TranslateService, @Inject(CLIENT_CONFIG) public config : ClientConfig) {
    this.originalAppCode = this.selectedAppCode = this.config.appCode
    this.masterServiceObserver = new MasterServiceObserver(appService)
    this.masterServiceObserver.serviceStateObs.subscribe( state => {
      this.masterState = state
      if (state === ServiceStates.Running){
        this.appService.getAppDatabases().subscribe( 
          keyValues => this.appKeyPairs = keyValues, 
          error => this.alertService.alertError(error),
          () => this.waitingFor = WaitingFor.None
        )
      }
    }) 
    this.appServiceObserver = new AppServiceObserver(appService)
    this.appServiceObserver.serviceStateObs.subscribe(state => {
      this.appState = state
      if (state === ServiceStates.Running){
        this.waitingFor = WaitingFor.None
      }
    })
  }

  set waitingFor(wf : WaitingFor)  {
    this._waitingFor = wf
    switch(wf){
      case WaitingFor.AppService : {
        this.masterServiceObserver.stop()
        this.appServiceObserver.start(5000)
        break
      }
      case WaitingFor.MasterSerive : {
        this.appServiceObserver.stop()
        this.masterServiceObserver.start(5000)
        break
      }
      case WaitingFor.None : { 
        this.masterServiceObserver.stop(); 
        this.appServiceObserver.stop()
      }
    }
  }
  get waitingFor() : WaitingFor { return this._waitingFor}

  get masterStateId() : string  { return this.transPrefix + "States.MasterService." + this.masterState }
  get appStateId() : string     { return this.transPrefix + "States.AppService." + this.appState }
  get releaseOk() : boolean {
    return this.selectedAppCode && 
    (this.appState == ServiceStates.Running ||
    (this.selectedAppCode === createAppCommand && this.masterState == ServiceStates.Running)) 
     
  }
  onSelectionChanged(){
    if (this.selectedAppCode !== createAppCommand){
      this.config.appCode = this.selectedAppCode
      this.waitingFor = WaitingFor.AppService
    }
  }
  cancelClicked() {
    this.waitingFor = WaitingFor.None
    this.config.appCode = this.originalAppCode
    this.activeModal.dismiss()
  }
  okClicked(){
    if (this.selectedAppCode === createAppCommand)
      this.activeModal.close(new KeyPair({key : this.selectedAppCode}))
    else 
      this.activeModal.close(this.appKeyPairs.find( pair => pair.key === this.selectedAppCode))
  }

  ngOnInit() {
    this.waitingFor = isEmpty(this.config.appCode) ? WaitingFor.MasterSerive : WaitingFor.AppService
  }
  ngOnDestroy(): void {
    this.appServiceObserver.stop()
    this.masterServiceObserver.stop()
  }
}

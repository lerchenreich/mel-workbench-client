import { Directive, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Observable, Subscription } from 'rxjs/Rx'
import { ClientConfig } from 'src/app/client.configs';
import { AppService } from 'src/app/services/app-service';

export enum WaitingFor { None="None", MasterSerive="MasterService", AppService="AppService" }

export enum ServiceStates {
  None = "", 
  Running = "Running", 
  Error = "Error"
}

abstract class ServiceObserver {
  state : ServiceStates = ServiceStates.None
  timer : Observable<number>
  timerSub : Subscription
  protected serviceStateEmitter = new EventEmitter<ServiceStates>()
  serviceStateObs = this.serviceStateEmitter.asObservable()

  constructor(protected appService : AppService) {
  }
  protected abstract ping() : Observable<string>

  protected pingService() : void {
    this.ping().subscribe( 
      appDatabases => {
        this.serviceStateEmitter.emit(ServiceStates.Running)
        this.stop()  
      },
      error => { 
        this.serviceStateEmitter.emit(ServiceStates.Error)
      }
    ) 
  }
  start(period : number){
    this.timer = interval(period)
    this.timerSub = this.timer.subscribe( next => this.pingService() )
    this.pingService()
  }
  stop() {
    if (this.timerSub && !this.timerSub.closed)
      this.timerSub.unsubscribe()
  }
}

export class MasterServiceObserver extends ServiceObserver {
  constructor(appService : AppService){
    super(appService)
  }
  protected ping() : Observable<string> {
    return this.appService.pingMaster()
  }
}

export class AppServiceObserver extends ServiceObserver {
  constructor(appService : AppService){
    super(appService)
  }
  protected ping() : Observable<string> {
    return this.appService.pingApp()
  }
}
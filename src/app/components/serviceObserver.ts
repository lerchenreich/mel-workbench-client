import { EventEmitter } from '@angular/core';
import { GetAppResult } from 'mel-common';
import { interval } from 'rxjs';
import { Observable, Subscription } from 'rxjs/Rx'
import { AppService } from 'src/app/services/app-service';


export declare type PingResult = { 
  appResult? : GetAppResult
  state : ServiceStates
}
export enum ServiceStates {
  None = "", 
  Running = "Running", 
  Error = "Error"
}

abstract class ServiceObserver {
  state : ServiceStates = ServiceStates.None
  timer? : Observable<number>
  timerSub? : Subscription
  protected serviceStateEmitter = new EventEmitter<PingResult>()
  serviceStateObs = this.serviceStateEmitter.asObservable()

  constructor(protected appService : AppService) {
  }
  protected abstract ping() : Observable<GetAppResult>

  protected pingService() : void {
    this.ping().subscribe({ 
      next : result => {
        this.serviceStateEmitter.emit({ appResult : result, state : ServiceStates.Running })
        this.stop()  
      },
      error : error => { 
        this.serviceStateEmitter.emit({ state : ServiceStates.Error})
      }
    }) 
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
  protected override ping() : Observable<GetAppResult> {
    return this.appService.pingMaster()
  }
}

export class AppServiceObserver extends ServiceObserver {
  constructor(appService : AppService){
    super(appService)
  }
  protected override ping() : Observable<GetAppResult> {
    return this.appService.getApp()
  }
}
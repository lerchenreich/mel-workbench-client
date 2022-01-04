import { EventEmitter } from '@angular/core';

import { interval, Observable, Observer, PartialObserver, Subscription } from 'rxjs';

import { AppService, MelSetup } from 'mel-client';


export declare type PingResult = { 
  melSetup : MelSetup
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
  protected abstract ping(obs : PartialObserver<any>) : void

  protected pingService() : void {
    this.ping({ 
      next : result => {
        this.serviceStateEmitter.emit({ melSetup : result, state : ServiceStates.Running })
        this.stop()  
      },
      error : error => { 
        this.serviceStateEmitter.emit({ melSetup : {}, state : ServiceStates.Error})
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
  protected override ping(obs : Observer<any>) : void {
    return this.appService.pingMaster(obs)
  }
}

export class AppServiceObserver extends ServiceObserver {
  constructor(appService : AppService){
    super(appService)
  }
  protected override ping(obs : Observer<MelSetup>) : void {
    return this.appService.pingApp(obs)
  }
}
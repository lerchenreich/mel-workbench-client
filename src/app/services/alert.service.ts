import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ErrorCategories, IMelError } from 'mel-common'


export type AlertTypes = 'danger' | 'warning' | 'info'

class MelError implements IMelError{ 
  message : string
  location : string
  category : ErrorCategories.None
  logId : bigint
  parent : MelError
  at : Date
  context : string

  constructor(init : Partial<IMelError>){
    Object.assign(this, init)
    if (this.parent) {
      this.parent = new MelError(this.parent)
    }
  }
   
  toConsole(includeStack : boolean = true, inlcudeContext : boolean = true) : void {
    console.error(this.toArray(includeStack, inlcudeContext).join('\n'))
  }
  toArray(includeStack : boolean = true, includeContext : boolean = true) : string[] {
    var arr : string[] = [`[${(this.at).toLocaleString()}] ${this.toString()}`]
    if (includeContext && this.context)
      arr.push(this.context)
    if (includeStack) 
      arr = arr.concat(this.getStack())
    return arr
  }

  getStack() : string[] {
    var stack : string[] = ['Stack:']
    if (this.parent)
      stack = this.parent.toStack([]) 
    return stack

  }
  private toStack(stack : string[]) : string[] {
    stack.push('- '+ this.toString())
    if (this.parent)
      this.parent.toStack(stack)
    return stack
  }

  toString() : string {
    return `Location: ${this.location}, Category: ${this.category} - "${this.message}"`
  }
}


export interface IAppAlert {
  type : AlertTypes
  message : string
  context? : string
  details? : string[]
}

@Injectable({
  providedIn: 'root'
})
export class AlertService implements OnDestroy{

  constructor() { 
    this.clear() 
  }
  
  _alerts: IAppAlert[] 
  get alerts() : IAppAlert[] { return this._alerts}
  //get hasAlerts() : boolean { return this._alerts.length > 0 }
  
  alertError(msgOrError : string | HttpErrorResponse, prettyMessage? : string){
    if (typeof msgOrError === 'string')
      this.alert('danger', msgOrError)
    else if (msgOrError instanceof  HttpErrorResponse ){
      if (msgOrError.status == 450)
        this.alert('danger', msgOrError.error, prettyMessage)
      else
        this.alert('danger', [msgOrError.statusText], prettyMessage) 
    }
  }
  alertWarning(msg : string , prettyMessage? : string){
    this.alert('warning', msg, prettyMessage)
  }
  alertInfo(msg : string, prettyMessage? : string){
    this.alert('info', msg, prettyMessage)
  }
  private alert(type : AlertTypes, msgOrError : string | Error | string[], prettyMessage? : string){
    if (Array.isArray(msgOrError)){
      this._alerts.push({ type : type, message : prettyMessage? prettyMessage : msgOrError[0], details : msgOrError })   
      return
    }
    if (typeof msgOrError === 'string'){
      this._alerts.push({ type : type, message : prettyMessage ? prettyMessage : msgOrError})
      return
    }
    if (typeof msgOrError === 'object'){
      this._alerts.push({ type : type, message : prettyMessage? prettyMessage : msgOrError["message"], details : [JSON.stringify(msgOrError)] })   
      return
    }
  }
  
  close(alert: IAppAlert) {
    this._alerts.splice(this._alerts.indexOf(alert), 1)
    if (this._alerts.length == 0)
      this.allClosed.next()
  }
  clear() {
    this._alerts = [];
  }

  private allClosed  = new Subject()
  allClosed$ = this.allClosed.asObservable()

  ngOnDestroy(){
    this.allClosed.complete()
  }
  snackbar(message : string){

  }

  
}

import { InjectionToken } from '@angular/core';
import { ROOT_PATH, MASTER_PATH } from 'mel-common'
import * as REST from './rest.config'


export class ClientConfig  {
  private readonly _rootEndpoint : string
  private readonly _restEndpoint : string
  private readonly _restMasterEndpoint : string 
  
  public appCode? : string
  private _companyId? : number 

  constructor( private _host: string, private _port : number, public annotation : string ){
    this._rootEndpoint = `http://${_host}:${_port}`
    this._restEndpoint = `${this._rootEndpoint}/${ROOT_PATH}/`
    this._restMasterEndpoint = this._restEndpoint + MASTER_PATH 
  } 
  
  set companyId(newId : number) { this._companyId = newId }
  
  get restCompanyEndpoint()   : string { return this._restEndpoint + this._companyId }
  get restAppEndpoint()       : string { return this._restEndpoint + this.appCode }
  get restMasterEndpoint()    : string { return this._restMasterEndpoint }
  
  get host() : string { return this._host }
  get port() : number { return this._port }

}

export const DEV_CONFIG : ClientConfig  = new ClientConfig(REST.devHost, REST.devPort, "[dev]" )
export const TEST_CONFIG : ClientConfig = new ClientConfig(REST.testHost, REST.testPort, "[test]")
export const PROD_CONFIG : ClientConfig = new ClientConfig(REST.prodHost, REST.prodPort, "")

export const CLIENT_CONFIG = new InjectionToken<ClientConfig>('client.config');


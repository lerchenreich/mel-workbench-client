import { InjectionToken } from '@angular/core';
import { ROOT_PATH, MASTER_PATH } from 'mel-common'
import * as REST from './rest.config'


export class ClientConfig  {
  constructor( private _host: string, private _port : number, public annotation : string ){
    this._rootEndpoint = `http://${_host}:${_port}`
    this._restEndpoint = `${this._rootEndpoint}/${ROOT_PATH}/`
    this.restMasterEndpoint = this._restEndpoint + MASTER_PATH 
  } 
  private readonly _rootEndpoint : string
  private readonly _restEndpoint : string
  readonly restMasterEndpoint    : string 
  
  private _appCode : string
  private _companyCode : string
  set appCode(newCode : string) { this._appCode = newCode }
  get appCode() : string { return this._appCode }
  set companyCode(newCode : string) { this._companyCode = newCode }
  
  get restCompanyEndpoint()   : string { return this._restEndpoint + this._companyCode }
  get restAppEndpoint()       : string { return this._restEndpoint + this._appCode }
   
  public get host() : string { return this._host }
  public get port() : number { return this._port }

}

export const DEV_CONFIG : ClientConfig  = new ClientConfig(REST.devHost, REST.devPort, "[dev]" )
export const TEST_CONFIG : ClientConfig = new ClientConfig(REST.testHost, REST.testPort, "[test]")
export const PROD_CONFIG : ClientConfig = new ClientConfig(REST.prodHost, REST.prodPort, "")

export const CLIENT_CONFIG = new InjectionToken<ClientConfig>('client.config');


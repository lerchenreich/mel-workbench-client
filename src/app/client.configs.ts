import { InjectionToken } from '@angular/core';
import { isEmpty } from 'lodash';
import { ROOT_PATH, MASTER_PATH } from 'mel-common'
export class ClientConfig  {
  private _hRef : string = ''
  private _restEndpoint : string = ''
  private _restMasterEndpoint : string = ''
  private _companyId : number = -1
  private _hasEndPoint : boolean = false
  
  constructor(public appCode : string, public annotation? : string){

  } 
  set endPoint(endPoint : string){
    this._hasEndPoint = false
    if (!isEmpty(endPoint)){
      const url = new URL(endPoint)
      this._hRef = url.href
      this._restEndpoint = `${this._hRef}${ROOT_PATH}/`
      this._restMasterEndpoint = `${this._restEndpoint}${MASTER_PATH}/`
      this._hasEndPoint = true 
    }
  }
  get hasEndpoint() : boolean { return this._hasEndPoint }
  get hRef() : string { return this._hRef }
  get restCompanyEndpoint()   : string { return this._restEndpoint + this._companyId + '/'}
  get restAppEndpoint()       : string { return this._restEndpoint + this.appCode + '/'}
  get restMasterEndpoint()    : string { return this._restMasterEndpoint }
  
  set companyId(newId : number) { this._companyId = newId }
}

/*
export const DEV_CONFIG : ClientConfig  = new ClientConfig(REST.devHost, REST.devPort, "[dev]" )
export const TEST_CONFIG : ClientConfig = new ClientConfig(REST.testHost, REST.testPort, "[test]")
export const PROD_CONFIG : ClientConfig = new ClientConfig(REST.prodHost, REST.prodPort, "")
*/
//#region app
//import manifest from '../../package.json'
//export const clientConfig = new ClientConfig(manifest.name)
//#endregion app
//#region dev
export const clientConfig = new ClientConfig('')// without appCode --> for all apps
//#endregion

export const CLIENT_CONFIG = new InjectionToken<ClientConfig>('client.config');


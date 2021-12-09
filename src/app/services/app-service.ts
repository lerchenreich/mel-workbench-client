import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ClientConfig, CLIENT_CONFIG} from '../client.configs';
import { AppMethods, CreateAppOptions, CreateCompanyOptions, GetTablesMetadataOptions, GetTablesOptions, 
  MasterMethods,  DbTableRelation,  UpdateMetadataOptions, CreateServerOptions, CreateClientOptions} from 'mel-common/api'
import { deepCopy } from 'mel-common/utils';
import { KeyPair } from 'mel-common/types'
import { TableMetadata } from 'mel-common/api'
@Injectable({
  providedIn: 'root'
})
export class AppService { 
  constructor( private httpClient : HttpClient, @Inject(CLIENT_CONFIG) protected config : ClientConfig) { 

  }
  public clone() : AppService { return new AppService(this.httpClient, this.config)}

  public pingMaster() : Observable<string>{
    try{
      var url = `${this.config.restMasterEndpoint}/${MasterMethods.Ping}`
    return this.httpClient.get<string>(url)
    }
    catch(e){
      console.error(e)
    }
  }
  public pingApp() : Observable<string>{
    var url = `${this.config.restAppEndpoint}/${MasterMethods.Ping}`
    return this.httpClient.get<string>(url)
  }

  public createApp(options : CreateAppOptions) : Observable<boolean> {
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.CreateApp}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<boolean>(url)
  }
  public createCompany(options : CreateCompanyOptions) : Observable<void> {
    var url = `${this.config.restAppEndpoint}/${AppMethods.CreateCompany}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<void>(url)
  }
  public createServer(options : CreateServerOptions) : Observable<string> {
    var url = `${this.config.restAppEndpoint}/${AppMethods.CreateServer}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<string>(url)
  }

  public createClient(options : CreateClientOptions) : Observable<ReadableStream> {
    var url = `${this.config.restAppEndpoint}/${AppMethods.CreateClient}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<ReadableStream>(url)
  }

  public getAppDatabases() : Observable<KeyPair[]> {
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.GetAppDatabases}`
    return this.httpClient.get<KeyPair[]>(url)
  }
  public getDatabases() : Observable<string[]>{
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.GetDatabases}`
      return this.httpClient.get<string[]>(url)  
  }
  public getMelTableNames(options? : GetTablesOptions) : Observable<string[]>{
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.GetTablenames}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<string[]>(url) 
  }
  public getMelTablesMetadata(options? : GetTablesMetadataOptions) : Observable<TableMetadata[]>{
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.GetTablesMetadata}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<TableMetadata[]>(url)
  }
  public getMelTableRelations(options? : any) : Observable<DbTableRelation[]>{
    var url = `${this.config.restMasterEndpoint}/${MasterMethods.GetTableRelations}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<DbTableRelation[]>(url)
  } 

  public getAppTableNames(options? : GetTablesOptions) : Observable<string[]>{
    var url = `${this.config.restAppEndpoint}/${MasterMethods.GetTablenames}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<string[]>(url) 
  }
  public getAppTablesMetadata(options? : GetTablesMetadataOptions) : Observable<TableMetadata[]>{
    var url = `${this.config.restAppEndpoint}/${MasterMethods.GetTablesMetadata}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<TableMetadata[]>(url)
  }
  public getAppTableRelations(options? : any) : Observable<DbTableRelation[]>{
    var url = `${this.config.restAppEndpoint}/${MasterMethods.GetTableRelations}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<DbTableRelation[]>(url)
  } 
 
  public updateMetadata(options? : UpdateMetadataOptions) : Observable<boolean>{
    var url = `${this.config.restAppEndpoint}/${AppMethods.UpdateMetadata}/${this.getOptionsQueryParam(options)}`
    return this.httpClient.get<boolean>(url)
  }
  

  protected getOptionsQueryParam(options? : any) : string {
      return options? "?options="+ btoa(JSON.stringify(deepCopy(options))) : ''
  }

}

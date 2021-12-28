import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ClientConfig, CLIENT_CONFIG} from '../client.configs';
import { getQueryParam } from './core/entityService';
import { AppMethods, CreateAppOptions, CreateCompanyOptions, GetTablesMetadataOptions, GetTablesOptions, 
         MasterMethods,  DbTableRelation,  UpdateMetadataOptions, CreateServerProjectOptions, CreateClientProjectOptions,
         TableMetadata} from 'mel-common'
import { BaseService } from './core/base-service';
import { MelSetup } from '../models/mel-setup';
@Injectable({
  providedIn: 'root'
})
export class AppService extends BaseService { 
  constructor( private httpClient : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) { 
    super(config)
  }

  public clone() : AppService { return new AppService(this.httpClient, this.config)}
  
  public pingMaster() : Observable<{}>{
    var url = `${this.config.restMasterEndpoint}${AppMethods.GetApp}`
    return this.httpClient.get<{}>(url)
  }
  public getApp() : Observable<MelSetup>{
    var url = `${this.config.restAppEndpoint}${AppMethods.GetApp}`
    return this.httpClient.get<MelSetup>(url)
  }

  public createApp(options : CreateAppOptions) : Observable<boolean> {
    var url = `${this.config.restMasterEndpoint}${MasterMethods.CreateApp}/${getQueryParam(options)}`
    return this.httpClient.get<boolean>(url)
  }
  public createCompany(options : CreateCompanyOptions) : Observable<void> {
    var url = `${this.config.restAppEndpoint}${AppMethods.CreateCompany}/${getQueryParam(options)}`
    return this.httpClient.get<void>(url)
  }
  public createServerProject(options : CreateServerProjectOptions) : Observable<string> {
    var url = `${this.config.restAppEndpoint}${MasterMethods.CreateServerProject}/${getQueryParam(options)}`
    return this.httpClient.get<string>(url)
  }

  public createClientProject(options : CreateClientProjectOptions) : Observable<ReadableStream> {
    var url = `${this.config.restAppEndpoint}${MasterMethods.CreateClientProject}/${getQueryParam(options)}`
    return this.httpClient.get<ReadableStream>(url)
  }
  public getApps() : Observable<MelSetup[]> {
    var url = `${this.config.restMasterEndpoint}${MasterMethods.GetApps}`
    return this.httpClient.get<MelSetup[]>(url)
  }
 
  public getDatabases() : Observable<string[]>{
    var url = `${this.config.restMasterEndpoint}${MasterMethods.GetDatabases}`
      return this.httpClient.get<string[]>(url)  
  }
  public getMelTableNames(options? : GetTablesOptions) : Observable<string[]>{
    var url = `${this.config.restMasterEndpoint}${MasterMethods.GetTablenames}/${getQueryParam(options)}`
    return this.httpClient.get<string[]>(url) 
  }
  public getMelTablesMetadata(options? : GetTablesMetadataOptions) : Observable<TableMetadata[]>{
    var url = `${this.config.restMasterEndpoint}${MasterMethods.GetTablesMetadata}/${getQueryParam(options)}`
    return this.httpClient.get<TableMetadata[]>(url)
  }
  public getMelTableRelations(options? : any) : Observable<DbTableRelation[]>{
    var url = `${this.config.restMasterEndpoint}${MasterMethods.GetTableRelations}/${getQueryParam(options)}`
    return this.httpClient.get<DbTableRelation[]>(url)
  } 

  public getAppTableNames(options? : GetTablesOptions) : Observable<string[]>{
    var url = `${this.config.restAppEndpoint}${MasterMethods.GetTablenames}/${getQueryParam(options)}`
    return this.httpClient.get<string[]>(url) 
  }
  public getAppTablesMetadata(options? : GetTablesMetadataOptions) : Observable<TableMetadata[]>{
    var url = `${this.config.restAppEndpoint}${MasterMethods.GetTablesMetadata}/${getQueryParam(options)}`
    return this.httpClient.get<TableMetadata[]>(url)
  }
  public getAppTableRelations(options? : any) : Observable<DbTableRelation[]>{
    var url = `${this.config.restAppEndpoint}/${MasterMethods.GetTableRelations}/${getQueryParam(options)}`
    return this.httpClient.get<DbTableRelation[]>(url)
  } 
 
  public updateMetadata(options? : UpdateMetadataOptions) : Observable<boolean>{
    var url = `${this.config.restAppEndpoint}${AppMethods.UpdateMetadata}/${getQueryParam(options)}`
    return this.httpClient.get<boolean>(url)
  }
  
}

import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { AppService, ClientConfig, CLIENT_CONFIG, getQueryParam } from "mel-client";
import { CreateAppOptions, FunctionResult, CreateClientProjectOptions, CreateServerProjectOptions, Methods } from "mel-workbench-api";
import { Observable, map, catchError, of } from "rxjs";
@Injectable({
  providedIn: 'root'
})
export class WorkbenchService extends AppService {
  constructor(httpClient: HttpClient, @Inject(CLIENT_CONFIG) config: ClientConfig){
    super(httpClient, config)
  }

  public isWorkbench() : Observable<boolean> {
    var url = `${this.config.restMasterEndpoint}${Methods.IsWorkbench}`
    return this.httpClient.get<{IsWorkbench : boolean}>(url)
    .pipe(
      catchError(err => { console.error(err); return of({IsWorkbench : false})}),
      map(obj => {
        return obj.IsWorkbench
      })
    )
  }
  public createApp(options : CreateAppOptions) : Observable<FunctionResult<void>>{
    var url = `${this.config.restMasterEndpoint}${Methods.CreateApp}/${getQueryParam(options)}`
    return this.httpClient.get<FunctionResult<void>>(url)
  }
  public createServerProject(options : CreateServerProjectOptions) : Observable<FunctionResult<string>>{
    var url = `${this.config.restMasterEndpoint}${Methods.CreateServerProject}/${getQueryParam(options)}`
    return this.httpClient.get<FunctionResult<string>>(url)
  }
  public createClientProject(options : CreateClientProjectOptions) : Observable<FunctionResult<string>>{
    var url = `${this.config.restMasterEndpoint}${Methods.CreateClientProject}/${getQueryParam(options)}`
    return this.httpClient.get<FunctionResult<string>>(url)
  }
}

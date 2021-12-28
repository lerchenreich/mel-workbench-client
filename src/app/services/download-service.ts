import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertService} from './alert.service'
import { Observable, of } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { ClientConfig, CLIENT_CONFIG} from '../client.configs';
import { BaseService } from './core/base-service';

export interface DownloadOptions {
  url : string,
  targetDir? : string,
  filepatternToUnzip? : string | RegExp
}

@Injectable({
  providedIn: 'root'
})
export class DownloadService extends BaseService {

  get apiUrl() : string { return this.config.restAppEndpoint }
  private alertService : AlertService

  constructor(private client : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) {     
    super(config)
    this.alertService = new AlertService()
  }

  
  errorHandler<T>( operation = 'operation' , result? : T){
    return (error:any): Observable<T> => {
      this.alertService.alertError(`DownloadService: ${operation} failed: ${error.message}`);
      return of(result as T);
    }
  }
  public download(options : DownloadOptions):Observable<Blob> {
      return this.client.get(`${this.apiUrl}download/?options=${encodeURIComponent(JSON.stringify(options))}`,{responseType : 'blob'})
                 .pipe( catchError(this.errorHandler<Blob>(`download`)) )
  }
 
}

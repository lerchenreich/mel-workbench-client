import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertService} from './alert.service'
import { Observable, of } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { ClientConfig, CLIENT_CONFIG} from '../client.configs';

export interface DownloadOptions {
  url : string,
  targetDir? : string,
  filepatternToUnzip? : string | RegExp
}

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  apiUrl : string;
  private alertService : AlertService

  constructor(private client : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) {     
    this.apiUrl = config.restAppEndpoint
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

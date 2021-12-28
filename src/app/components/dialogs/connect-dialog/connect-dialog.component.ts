import { Component, Inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'
import { MASTER_PATH } from 'mel-common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientConfig, CLIENT_CONFIG } from 'src/app/client.configs';
import { MelSetup } from 'src/app/models/mel-setup';
import { AppDescr } from 'src/app/recents';
import { AlertService } from 'src/app/services/alert.service';
import { AppService } from 'src/app/services/app-service';

@Component({
  selector: 'app-connect-dialog',
  templateUrl: './connect-dialog.component.html',
  styleUrls: ['./connect-dialog.component.css']
})
export class ConnectDialogComponent implements OnInit {
  transPrefix = 'ConnectDialog.'
  get Title()         { return this.transPrefix+'Title'}
  get LabelEnterUrl() { return this.transPrefix+'EnterUrl'}
  get HintUrl()       { return this.transPrefix+'HintUrl'}
  get UrlInvalid()    { return this.transPrefix+'UrlInvalid'}
  get UrlValid()      { return this.transPrefix+'UrlValid' }
  get AppInvalid()    { return this.transPrefix+'AppInvalid'}
  get AppCodeEmpty()  { return this.transPrefix+'AppCodeEmpty'}
  get NoApp()         { return this.transPrefix+'NoApp'}

  errorText : string = ''
  url : string = ''
  releaseOk : boolean = false
  appInfo : string = ''
  appDescr? : AppDescr
  
  constructor(public activeModal : NgbActiveModal, protected appService : AppService, 
    public alertService : AlertService, public translate : TranslateService, 
    @Inject(CLIENT_CONFIG) public config : ClientConfig) { }

  ngOnInit(): void {

  }
  /**
  *   Validate the url and connect to the appServer with the appCode, if not empty compare the both appCodes 
  *   
  *   In case of an empty appCode (dev-env) 
  */
  onUrlChanged(){
    this.errorText = ''
    this.releaseOk = false
    if (!isEmpty(this.url)){
      try {
        this.config.endPoint = this.url // validate the url
      }      
      catch(err){
        this.translate.get(this.UrlInvalid).subscribe(translated => this.errorText = translated) 
      }
      if (this.config.appCode.length){          // test if the server has the same appCode
        this.appService.getApp().subscribe({
          next : melSetup => this.releaseOk = (melSetup.AppCode === this.config.appCode),
          error: error => this.translate.get('App.RestService.NoConnection').subscribe(txt => this.errorText = txt),
          complete: () => { 
            if (!this.releaseOk)
              this.translate.get(this.AppInvalid, {code : this.config.appCode}).subscribe(txt => this.errorText = txt)}
        })
      }
      else {
        this.config.appCode = MASTER_PATH
        this.appService.getApps().subscribe({
          next : melSetups => {       // one of this apps should be hostet
            if (isEmpty(melSetups)) // the server is only a masterserver (no app)
              this.translate.get(this.NoApp).subscribe(txt => this.errorText = txt)
            else {
              forkJoin(melSetups.map(melSetup => { 
                this.config.appCode = melSetup.AppCode as string
                return this.appService.getApp().pipe(catchError( () => of({} as MelSetup)))
              }))
              .subscribe({
                next : melSetups => {
                  const melSetup = melSetups.find(melSetup => !isEmpty(melSetup))
                  if (melSetup){  
                    this.config.appCode = melSetup.AppCode as string
                    this.appDescr = new AppDescr(this.config.hRef, melSetup.AppCode as string, melSetup.AppName as string)
                    this.releaseOk = true
                  }
                },
                complete : () => { 
                  if (!this.releaseOk) 
                    this.translate.get(this.NoApp).subscribe(txt => this.errorText = txt)
                }
              })
            }
          },
          error: error => this.translate.get('App.RestService.NoConnection').subscribe(txt => this.errorText = txt)
        })
      }
    }
  }
  cancelClicked() {
    this.activeModal.dismiss()
  }
  okClicked(){
    this.activeModal.close(this.appDescr)
  }
}

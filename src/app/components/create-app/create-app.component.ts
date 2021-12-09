import { AfterViewInit, Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs'
import { FieldTypes, KeyPair, CreateAppOptions, notBlank, Version } from 'mel-common';
import { fillColumnMetadata } from 'src/app/metadata/entities';
import { AlertService } from 'src/app/services/alert.service';
import { AppService } from 'src/app/services/app-service';

import { CardData} from '../core/page-data';
import { FieldContext } from '../core/types';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalWaitComponent } from '../dialogs/modal-wait/modal-wait.component';
import { changeApp } from 'src/app/recents';
import { FieldMetadata } from '../../types';


class CreateAppEntity {
  appCode? : string // becomes databasename
  appName?     : string // name of the application
  companyName? : string 
  companyDatabaseName? : string // the datamodel of the application
}

@Component({
  selector: 'app-create-app',
  templateUrl: './create-app.component.html',
  styleUrls: ['./create-app.component.css']
})
@UntilDestroy()
export class CreateAppComponent implements AfterViewInit {
  
  appMap : Map<string,string> = new Map<string, string>()
  contextMap : Map<keyof CreateAppEntity, FieldContext<CreateAppEntity>>
  metaMap = new Map<keyof CreateAppEntity, FieldMetadata<CreateAppEntity>>()
  
  cardData : CardData<CreateAppEntity>
  
  entity : CreateAppEntity = {
    appCode : "newApp",
    appName : "My new Application",
    companyName : "Haselmaus Corporation",
    companyDatabaseName : ""
  }
  metadata : FieldMetadata<CreateAppEntity>[] = [
    { name : "appCode", type : FieldTypes.String, validators : [notBlank, this.validateAppCode.bind(this)]},
    { name : "appName", type : FieldTypes.String, validators : [notBlank]},
    { name : "companyName", type : FieldTypes.String, validators : [notBlank]},
    { name : "companyDatabaseName", type : FieldTypes.Enum, enumValues: [], validators : [notBlank] }
  ]
  constructor(protected appService : AppService, private modalService : NgbModal, private snackBar : MatSnackBar, protected alert : AlertService, 
              protected router : Router, public translate : TranslateService) {
  
    forkJoin([this.appService.getDatabases(),this.appService.getAppDatabases()])
    .subscribe(
      ([dbNames, keyValues]) => {
        keyValues.forEach(keyValue => this.appMap.set(keyValue.key, keyValue.value))
        const nonApps = dbNames.filter(name => !this.appMap.has(name)).map(name => name)
        this.metadata[3].enumValues = nonApps
        if (nonApps.length == 1)
          this.entity.companyDatabaseName = nonApps[0]
      },
      error => {this.alert.alertError(error)},
      () =>  {   
        this.contextMap = new Map<keyof CreateAppEntity, FieldContext<CreateAppEntity>>()
        this.metadata.forEach( md => this.metaMap.set(md.name, fillColumnMetadata(md)) )
        this.cardData = new CardData<CreateAppEntity>(this.entity, this.metaMap)
        this.metadata.forEach( md => this.contextMap.set(md.name, {data : this.cardData, meta : md}) )     
      }
    )
  }

  context(fieldName : keyof CreateAppEntity) : FieldContext<CreateAppEntity> {
    return this.contextMap.get(fieldName)
  }

  async validateAppCode(appCode: string, entity? : CreateAppEntity) : Promise<any>{
    const errorKey = 'CreateApp.Validation.AppCode.'
    appCode = appCode.toUpperCase() 
    return new Promise( (resolve, reject) => {
      if ((appCode as string).match(/[^(\w)|^(\d)|^$|^-]/g)) 
        reject(errorKey +'Match')
      else 
        if (Array.from(this.appMap.keys()).map(key => key.toUpperCase()).includes(appCode))
          reject(errorKey + 'Exist')
        else {
          resolve(appCode)
        }
    })
  }
 
  save() {
    this.cardData.validate()
    .then( valid => {
      if (valid){
        const options : CreateAppOptions = {
          dropExistingAppDatabase : true,
          appCode : this.cardData.validationRec.appCode,
          appName : this.cardData.validationRec.appName,
          version : new Version(1,0,0),
          company : { 
            name : this.cardData.validationRec.companyName,
            dbName : this.cardData.validationRec.companyDatabaseName,
           
          },
        }
        var modalRef = this.modalService.open(ModalWaitComponent, {centered : true})
        modalRef.componentInstance.title = 'CreateApp.Title'
        modalRef.componentInstance.action = 'CreateApp.WaitFor'
        modalRef.componentInstance.actionContext = options
        this.appService.createApp(options)
        .subscribe( 
          ok => {
            this.translate.get(`CreateApp.Success`, options)
            .subscribe( translated => this.snackBar.open(translated,undefined,{duration: 2500, horizontalPosition : 'center'} ))
          }, 
          error => {
            modalRef.close()
            this.translate.get(`CreateApp.Failed`, options)
            .subscribe( translated => this.alert.alertError(error, translated) )
          },
          () => {
            // set the app
            changeApp(new KeyPair( { key : options.appCode, value : options.appName} ))
            modalRef.close()  
            this.router.navigate(['object-designer'], {}) 
          }
        )}
    })
    .catch(error => {
      this.alert.alertError(error)
    })
  }

 
  ngAfterViewInit() {
    const htmlCollection = document.getElementsByClassName('mat-card-header-text')
    if (htmlCollection?.length)
      htmlCollection[0].remove()
  }

}

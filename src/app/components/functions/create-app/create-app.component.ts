/*
import { AfterViewInit, Component} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs'

import { FieldTypes, notBlank, Version, MelFieldClasses, EntityLiteral } from 'mel-common' 
import { fillColumnMetadata , AlertService , AppService, CardData, FieldContext, 
         ModalWaitComponent , FieldMetadata , MelSetup } from 'mel-client';
import { CreateAppOptions } from 'mel-workbench-api';


class CreateAppEntity extends EntityLiteral {
  appCode? : string // becomes databasename
  appName?     : string // name of the application
  companyName? : string 
  companyDatabaseName? : string // the datamodel of the application
}
declare type CreateAppContextMap = Map<keyof CreateAppEntity, FieldContext<CreateAppEntity>>
@Component({
  selector: 'app-create-app',
  templateUrl: './create-app.component.html',
  styleUrls: ['./create-app.component.css']
})
@UntilDestroy()
export class CreateAppComponent implements AfterViewInit {
  
  appMap     : Map<string,MelSetup> = new Map<string, MelSetup>()
  contextMap : CreateAppContextMap = new Map<keyof CreateAppEntity, FieldContext<CreateAppEntity>>()
  metaMap = new Map<string, FieldMetadata<CreateAppEntity>>()
  
  cardData? : CardData<CreateAppEntity>
  
  entity : CreateAppEntity = {
    appCode : "newApp",
    appName : "My new Application",
    companyName : "Haselmaus Corporation",
    companyDatabaseName : ""
  }
  metadata : FieldMetadata<CreateAppEntity>[] = [
    { name : "appCode", type : FieldTypes.String, class : MelFieldClasses.None, validators : [notBlank, this.validateAppCode.bind(this)]},
    { name : "appName", type : FieldTypes.String, class : MelFieldClasses.None, validators : [notBlank]},
    { name : "companyName", type : FieldTypes.String, class : MelFieldClasses.None, validators : [notBlank]},
    { name : "companyDatabaseName", type : FieldTypes.Enum, enumValues: [], class : MelFieldClasses.None, validators : [notBlank] }
  ]
  constructor(protected appService : AppService, private modalService : NgbModal, private snackBar : MatSnackBar, protected alert : AlertService, 
              protected router : Router, public translate : TranslateService) {
  
    forkJoin([this.appService.getDatabases(),this.appService.getApps()])
    .subscribe(
      ([dbNames, melSetups]) => {
        melSetups.forEach(setup => this.appMap.set(setup.AppCode as string, setup))
        const nonApps = dbNames.filter(name => !this.appMap.has(name)).map(name => name)
        this.metadata[3].enumValues = nonApps
        if (nonApps.length == 1)
          this.entity.companyDatabaseName = nonApps[0]
      },
      error => {this.alert.alertError(error)},
      () =>  {   
        this.metadata.forEach( md => this.metaMap.set(md.name as string, fillColumnMetadata(md)) )
        this.cardData = new CardData<CreateAppEntity>(this.entity, this.metaMap)
        this.metadata.forEach( md => this.contextMap.set(md.name as string, {data : this.cardData, meta : md}) )     
      }
    )
  }

  context(fieldName : string) : FieldContext<CreateAppEntity> | undefined{
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
 
  async save() {
    try{
      if (this.cardData && await this.cardData.validate()){
        const vRec = this.cardData?.assertVRec
        const options : CreateAppOptions= {
          dropExistingAppDatabase : true,
          appCode : vRec.appCode as string,
          appName : vRec.appName as string,
          version : new Version(1,0,0),
          company : { 
            name    : vRec.companyName as string,
            dbName  : vRec.companyDatabaseName as string,
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
            modalRef.close()  
            this.router.navigate(['object-designer'], {}) 
          })
      }
    }
    catch(error){
      this.alert.alertError(error as string)
    }
  }

 
  ngAfterViewInit() {
    const htmlCollection = document.getElementsByClassName('mat-card-header-text')
    if (htmlCollection?.length)
      htmlCollection[0].remove()
  }

}
*/
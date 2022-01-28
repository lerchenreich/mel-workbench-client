import { Component, OnInit, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AppService, EntityPage, FieldContext, PageTypes, CardData } from 'mel-client';
import { CreateAppDlgData } from 'src/app/models/createapp-dialog';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { IMelModal } from 'mel-client';
import { map, Observable, take } from 'rxjs';

@Component({
  selector: 'app-create-app-dialog',
  templateUrl: './create-app-dialog.component.html',
  styleUrls: ['./create-app-dialog.component.css']
})
export class CreateAppDialogComponent extends EntityPage<CreateAppDlgData> implements OnInit, IMelModal<CreateAppDlgData, CreateAppDlgData> {
  readonly transPrefix  = "App.Dialog.CreateApp."
  readonly noDbAvailable = this.transPrefix+'NoDbAvailable'

  constructor(protected modalRef:BsModalRef, protected appService:AppService, translate:TranslateService) {
    super(CreateAppDlgData.name, translate)
  }  
  get title() { return this.caption }
  get pageType(): PageTypes { return PageTypes.ModalDialog }
  
  // IMelModal implementation
  initDialogData(data: Partial<CreateAppDlgData>): void {
  }
  returnValue? : CreateAppDlgData
  dismissClicked() {
    this.returnValue = undefined
    this.modalRef.hide()
  }
  okClicked() {
    this.returnValue = this.cardData?.assertVRec as CreateAppDlgData
    this.modalRef.hide()
  }


  cardData? : CardData<CreateAppDlgData> 
  get isDirty() : boolean { return this.cardData ? this.cardData.isDirty : false }
  get isValid() : boolean { return !!this.cardData?.isValid }

  appCodes : string[] = []
  appDbNames : string[] = []
  availableAppDatabases : string[] = []
 
  ngOnInit(): void {
    const data = this.cardData as unknown as CreateAppDlgData
    this.appService.getApps().subscribe({
      next : appSetups => {
        this.appCodes   = appSetups.map(setup => setup.AppCode as string)
        this.appDbNames = appSetups.map(setup => setup.AppDbName as string)
      }, 
      error : error => this.alertError(error),
      complete : () =>  {
        this.appService.getDatabases().subscribe({
          next : databaseNames =>  
            this.availableAppDatabases = (databaseNames as string[]).filter(name => !this.appDbNames.includes(name)),
          error : error => this.alertError(error),
          complete : () => { 
            if (this.availableAppDatabases?.length > 0){
              const entity = Reflect.construct(CreateAppDlgData,[])
              entity.CompanyDbName = entity.CompanyName = this.availableAppDatabases[0]
              this.cardData = new CardData(entity, this.fieldsMdMap)
            }
            else 
              this.alertInfo(this.translate.instant(this.noDbAvailable))
          }
        })
      }
    })
  }

  context(fieldName : string) : FieldContext<CreateAppDlgData>{
    return {
      meta  : this.getFieldMd(fieldName),
      data : this.cardData,
      editable : true
      //touchedObs : { next : field => this.Rec.triggerColumn(field.name, field.validationRec)}, 
      //changedObs : { next : value => {if (this.shouldSave) this.saveData() } }
    }
  }    
 
  alertError(error : any){
    console.error(error)
  }
  alertInfo(info : string){
    console.info(info)
  }
 
}

export function openModalWithEntity<T extends IMelModal<E,R>, E, R>(
        modal : BsModalService,
        content : string | TemplateRef<any> | (new (...args : any[])=>T),                                                
        options?: ModalOptions<T>) : Observable<R> {
            
  var inputData : Partial<E> | undefined = undefined
  if (options){
    if (options.initialState){
      inputData = Object.assign({}, options.initialState) as Partial<E>
      delete options.initialState
    }
    options.backdrop = 'static'                                                    
  }
  else 
    options = { backdrop : 'static' }

  var dlgRef = modal.show(content, options)
  if (inputData)
    dlgRef.content?.initDialogData(inputData)
  const contentObserver = dlgRef.onHide?.pipe( take(1), map( dc => {dlgRef.content as T}) ) as unknown as Observable<T>
  return new Observable<R>( (subscriber) => {
    contentObserver.subscribe({ next : content => {
      if (content.returnValue)
        subscriber.next(content.returnValue)
      else 
        subscriber.error(dlgRef)
      subscriber.complete()
    }})
  })
}
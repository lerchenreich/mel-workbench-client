import { Observable, PartialObserver} from 'rxjs'
import { map} from 'rxjs/operators'
import { Injector, Directive, EventEmitter, AfterViewInit, OnDestroy, Input, ProviderToken } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateService } from '@ngx-translate/core'

import { DeleteResult, EntityService, UpdateResult } from '../../services/core/entityService'
import { FieldConditions, ClientFilterCondition } from '../../services/core/client-filter-condition'
import { FilterDialogComponent, IFilterDialogData } from '../dialogs/filter-dialog/filter-dialog.component'
import { SortOrder } from 'mel-common'
import { ClientFilters } from 'src/app/services/core/client-filters'
import { AlertService } from 'src/app/services/alert.service'
import { CLIENT_MODUL_NAME, getModulProviderToken } from 'src/app/core'
import { HttpErrorResponse } from '@angular/common/http'
import { DialogButtons, MessageDialogComponent, MessageResults } from '../dialogs/message-dialog/message-dialog.component'
import { EntityMetadata} from 'src/app/metadata/entities'
import { PageModes, PageTypes } from './types'
import { FieldsMdMap, FieldMetadata, EntityLiteral, EntityListLiteral } from '../../types'
export class Permissions {
  private i : boolean = false
  private m : boolean = false
  private d : boolean = false
  get insert() : boolean { return this.i }
  get modify() : boolean { return this.m }
  get delete() : boolean { return this.d }

  constructor(public permissionString : string){
    this.i = permissionString.includes('i')
    this.m = permissionString.includes('m')
    this.d = permissionString.includes('d')
  }
}
export interface IPagemodeChanged { newMode : PageModes, prevMode? :PageModes}
/**
 * Baseclass for all pages 
 * Derivied Classes --> ListPage
 *                      --> ListRouted
 *                          --> all routed entityspecific lists
 *                      --> ListPart
 *                          --> all entityspecific lists as a part of a card
 *                  --> Card 
 *                          --> all routed entityspecific cards 
 *                  --> CardPart
 *                          --> all entityspecific cards as as part of a card
 * The derivied classes must:
 *    - implement the abstract methods,
 *    - set the entity-name by the entity-Property
 *    - set the permissions by the permissions-property
 *    - set the pagetype    by the pageType-property 
 *    the derivied classes could:
 *    - set a viewfilter (initial filters an sort-order)
 *    - lock the page by the lock-property to prevent modifications

 * Initialization:
 *  The constructor is provided by an injector, the translateservice, a mat-dialog and a snackbar-service.
 *  When the entityname is set (in the constructor or later from an @Input), the metadata is got, the databaseservice for 
 *  this entity is created and the triggers are subribed depending on the permissions
 *  At last the abstract method afterDatabaseServiceCreated() is called, where the derivied classes can start to use the service
 * 
 * Datahandling:
 *  When the data arrives from the database by the entitservice, each record is stored in a datasource-row
 *  - in a pretty and editable format (inputRec) and 
 *  - as a copy of the original entitydata for validation (validRec).
 *  The datasource contains an array of datasource-rows
 *  A "Card" has exactly one entry, a "List" can have zero datasource-rows.  
 *  The datasource-row is the interface between entityservice an the page-input-data
 *  
 *  When a new record should be added, an empty validRec will be initialized by defaults and formatted into the inputRec
 *  The datasource-row get the "new"-state 
 *  A row must be inserted, if the new-state in the datasource-row is set.
 *  A row must be updatet, if one of the fields is dirty  
 * 
 * Change-detection:
 *  When an editable field is left, the input-value is stored into the validRec. If the validRec-Field is different from the entityservice-record,
 *  the fieldvalue has changed and the field becomes "dirty".
 * 
 * Validation: 
 *  When an editable field becomes dirty, this field will be validated and an errormessage is shown
 *  Because of the possible dependencies between the field-values, all fields must be validated, when a row is to be inserted or updated
 *  The row can only been saved, when it is valid. In a List, you can't edit another row until the current row is invalid (and not saved).
 * 
 * Fieldtrigger:
 * After a sucessfull fieldvalidation a frieldtrigger can be called to provide other small businesslogic
 * 
 * */
@Directive()
export abstract class Page<Entity extends EntityLiteral> implements  AfterViewInit, OnDestroy {
 
  protected abstract retrieveData() : void
  protected abstract deleteData() : void
  protected abstract saveData() : void
  protected abstract shouldSave() : boolean

  abstract onNew() : void
  abstract get title() : string
    
  public alertService : AlertService
  private _pageType? : PageTypes
  private _entityName? : string
  protected _entityMetadata? : EntityMetadata
  protected _recService? : EntityService<EntityLiteral>
  
  actionkeyEmitterMap : Map<string, EventEmitter<KeyboardEvent>> // toDo: implemetieren oder wegwerfen
  pagemodeChanged = new EventEmitter<IPagemodeChanged>()
 
  constructor(protected injector : Injector, private _translate : TranslateService, 
              protected dialog : MatDialog, protected snackBar: MatSnackBar ){
    const token = getModulProviderToken('AlertService', CLIENT_MODUL_NAME) as ProviderToken<any>
    this.alertService = injector.get(token) 
    this.alertService.allClosed$.subscribe({
      next : x => this.resetPageMode()
    })
    this.accessRights = ''
    this.actionkeyEmitterMap = new Map<string, EventEmitter<KeyboardEvent>>() 
  }
  get hasRecService() : boolean { return this._recService !== undefined }
  protected get assertRecService() : EntityService<EntityLiteral> { if (this._recService) return this._recService; throw new Error('_recservice undefined!')}
  get translate() : TranslateService { return this._translate }

  set pageType(t : PageTypes) { this._pageType = t }
  get isCard()        : boolean  { return this._pageType === PageTypes.CardPart || this._pageType === PageTypes.Card;}
  get isList()        : boolean  { return this._pageType === PageTypes.ListPart || this._pageType === PageTypes.List }
  get isPart()        : boolean  { return this._pageType === PageTypes.CardPart || this._pageType === PageTypes.ListPart;}
  get isListPart()    : boolean  { return this._pageType === PageTypes.ListPart }
  get isRoutedList()  : boolean  { return this._pageType === PageTypes.List }

  get listRoute() : string { return `/${this.entitySingularName?.toLowerCase()}-list` }
  get cardRoute() : string { return `/${this.entitySingularName?.toLowerCase()}-card` }

  protected get caption() : string {   return this.isCard? this.entityMetadata?.captionSingular||'' : this.entityMetadata?.captionPlural ||''}
  protected afterDeleteEntity(){}
  protected afterModifyEntity(){}
  protected afterInsertEntity(){}
  protected afterRenameEntity(){}

  get entityName():string | undefined { return this._entityName }
  set entityName(funcName : string|undefined){
    if (!this.entityName && funcName){
      this._entityName = funcName
      this._entityMetadata = EntityMetadata.assertGet(funcName)
      this._recService = EntityService.create(this.injector, this._entityName)
    }
  }
  get entityMetadata()    : EntityMetadata|undefined { return this._entityMetadata }
  get entitySingularName(): string { return this._entityMetadata?.name || ''}
  get entityPluralName()  : string     { return this._entityMetadata?.pluralName || ''}
  get primaryKeys()       : string[]   { return this._entityMetadata?.primaryKeys || []}
  get fieldsMdMap()       : FieldsMdMap |undefined { return this._entityMetadata?.fieldsMdMap }
  get assertFieldsMdMap() : FieldsMdMap { if (this.fieldsMdMap) return this.fieldsMdMap; throw new Error('fieldsMap undefined!')}
  assertGetFieldMd(key : string) : FieldMetadata<Entity>{
    const fieldMd = this.fieldsMdMap?.get(key)
    if (fieldMd) 
      return fieldMd
    throw new Error(`Metadata for field "${key}" not found`)
  }

  protected viewFilters? : ClientFilters<Entity>
  
  private _permissions? : Permissions
  set accessRights(accessString : string){ 
    this._permissions = new Permissions(accessString) 
  }
  @Input() 
  set permissions(perm : Permissions | undefined ) { this._permissions = perm}
  get permissions() : Permissions | undefined{ return this._permissions}
  public locked : boolean = false

  get insertPermission() : boolean { return this._permissions?.insert || false } 
  get modifyPermission() : boolean { return this._permissions?.modify || false }
  get deletePermission() : boolean { return this._permissions?.delete || false }
  get insertAllowed() : boolean { return !this.locked && this.insertPermission }
  get modifyAllowed() : boolean { return !this.locked && this.modifyPermission }
  get deleteAllowed() : boolean { return !this.locked && this.deletePermission }
  get insertDelayed() : boolean { return true }
  get canInsert() : boolean { return this.insertAllowed  && !this.isErrorMode && !this.isInsertMode}

 
  protected mode : PageModes = PageModes.None
  get isViewMode():boolean    { return this.mode === PageModes.View }
  get isEditMode():boolean    { return this.mode === PageModes.Edit }
  get isInsertMode():boolean  { return this.mode === PageModes.Insert }
  get isErrorMode():boolean   { return this.mode === PageModes.Error }

 

  /**
   * Angular Hooks
   */
 
  ngAfterViewInit() {
    const htmlCollection = document.getElementsByClassName('mat-card-header-text')
    if (htmlCollection?.length)
      htmlCollection[0].remove()
  }
  ngOnDestroy() {
    this.assertRecService?.unsubscribe()
  }

 
  protected setViewMode() { 
    if (!this.isViewMode){
      const pagemodeChanged : IPagemodeChanged = { newMode : PageModes.View, prevMode : this.mode }
      this.mode = pagemodeChanged.newMode
      this.pagemodeChanged.emit(pagemodeChanged)
    }
  }
  protected setEditMode(): boolean { 
    if (this.modifyAllowed){
      const pagemodeChanged : IPagemodeChanged = { newMode : PageModes.Edit, prevMode : this.mode }
      this.mode = pagemodeChanged.newMode
      this.pagemodeChanged.emit(pagemodeChanged)
    }
    else 
      this.setViewMode()
    return this.isEditMode;
  }
  protected setErrorMode() { 
    if (!this.isErrorMode) {
      const pagemodeChanged : IPagemodeChanged = { newMode : PageModes.Error, prevMode : this.mode }
      this.mode = pagemodeChanged.newMode
      this.pagemodeChanged.emit(pagemodeChanged)
    }
  }
  protected setInsertMode():boolean { 
    if (this.canInsert){
      const pagemodeChanged : IPagemodeChanged = { newMode : PageModes.Insert, prevMode : this.mode }
      this.mode = pagemodeChanged.newMode
      this.pagemodeChanged.emit(pagemodeChanged)
    }
    return this.isInsertMode
  }
  protected resetPageMode():boolean { 
    if (this.mode !== PageModes.None) {
      const pagemodeChanged : IPagemodeChanged = { newMode : PageModes.None, prevMode : this.mode }
      this.mode = pagemodeChanged.newMode
      this.pagemodeChanged.emit(pagemodeChanged)
    }
    return true
  }
  
  deleteDlg(messageKey : string, params : Object, observer : PartialObserver<boolean>) {
    const matDlgConfig : MatDialogConfig = {
      data : {
                title : 'Message.DeleteTitle',
                message : this.translate.instant('Message.'+messageKey, params),
                buttons : DialogButtons.YesNo,
                default : MessageResults.NoCancel
      },
      hasBackdrop : true,
      disableClose : true
    }
    this.dialog
      .open(MessageDialogComponent, matDlgConfig)
      .afterClosed()
      .pipe( map( (answer:MessageResults) => answer == MessageResults.YesOk))
      .subscribe(observer)  
  }
  // Log message with the MessageService 
  alertWarning(text : string){ this.alertService.alertWarning(text) }
  alertInfo(infoText : string) {
    this.alertService.alertInfo(infoText)
  }
  alertError(error : string | HttpErrorResponse) {
    this.alertService.alertError(error)
    this.setErrorMode()
  }
      
  protected handleServerError(error : HttpErrorResponse| Error) : void {
    var message : string 
    if (error instanceof HttpErrorResponse) {
      if (error.status < 500 || !error.error)
        message = error.statusText
      else {
        if (typeof error.error === 'string')
          message = error.error
        else {
          message = (typeof error.error === 'object')?
            error.error.name === 'MelError' ? error.error.message : JSON.stringify(error.error) :
            message = 'Unknown Error'
        }
      }
    }
    else {
      if (error instanceof Error){
        this.translate.get(error.message).subscribe( msg => this.alertError(msg))
        return 
      }
      else 
        message = 'FATAL! unexpected error: ' + JSON.stringify(error)  
    }
    this.alertError(message)
  }

  fieldCaption(fieldName : string){
    return this.assertGetFieldMd(fieldName).display?.caption
  }


  snack(message : string){
    this.snackBar.open(message,undefined,{duration: 2500, horizontalPosition : 'center'} )
  }

  //#region Toolbar actions 
  /**
   * Add a new record
   * @param event 
   */
  public add(event? : Event) : void {
    if (this.canInsert){
      this.onNew()
      this.setInsertMode()
      if (event) event.cancelBubble = true
    }
  }
    
  /**
   * Save a record
   * Menuaction call
   * @param event 
   */
  public save(event? : Event) : void {
    if (this.modifyAllowed) {
      if (event) 
        event.cancelBubble = true
      if (this.shouldSave() )
        this.saveData()
    }
    else 
      if (!this.modifyPermission) 
        this.snack('You have no permission to modify this table')
  }
  /**
   * delete a record
   * Menuaction call
   * @param event 
   */
  remove(event? : Event){
    if (event) event.cancelBubble = true
    if (this.deleteAllowed)
      this.deleteData()
    else 
      if (!this.deletePermission) 
        this.snack('You have no permission to delete from this table')

  }
  //#region Actions

  afterFilterChanged() {  
    if (!this.assertRecService) 
      return 
    this.retrieveData()
  }
  /**
   * 
   * @param event 
   */
  runFilterDialog(event:any){
    var filterData : IFilterDialogData = {
      entityName : this.entitySingularName,
      filters : this.getNormalFilters(false) // not locked filters
    }
    this.dialog
    .open(FilterDialogComponent, {disableClose : true, autoFocus : false, hasBackdrop : true, data : filterData})
    .afterClosed()
    .subscribe( (fieldFilters : FieldConditions<Object>) => {
      if (fieldFilters){
        this.setNormalFilters(fieldFilters)
        this.afterFilterChanged()
      }
    });
    event.stopPropagation()
  }

  runFlowFilterDialog(event:any){
    var filterData : IFilterDialogData= {
      entityName : this.entitySingularName,
      filters : this.getFlowFilters(),
      useFlowfilters : true
    }
    this.dialog
    .open(FilterDialogComponent, {disableClose : true, autoFocus : false, hasBackdrop : true, data : filterData})
    .afterClosed()
    .subscribe( (flowFilters : FieldConditions<Object>) => {
      if (flowFilters){
        this.setFlowFilters(flowFilters)
        this.afterFilterChanged()
      }
    });
    event.stopPropagation()
  }

  removeFilters(event:any){
    this.resetNormalFilters()
    this.afterFilterChanged()
    event.stopPropagation()
  }
  removeFlowFilters(event:any){
    this.resetFlowFilters()
    this.afterFilterChanged()
    event.stopPropagation()
  }

  //#region databaseservice-functions
   // data
  public copyData(from : EntityService<EntityLiteral>) : EntityService<EntityLiteral> { return this.assertRecService.copyData(from)}
  public copyDataset(from : EntityService<EntityLiteral>) : EntityService<EntityLiteral> {return this.assertRecService.copyDataset(from) }
  public copy(from : EntityService<EntityLiteral>) : EntityService<EntityLiteral> { return this.assertRecService.copy(from) }
  public get rec()  : EntityLiteral { return this.assertRecService?.data }   
  public get xRec() : EntityLiteral { return this.assertRecService?.xData }
  public get recordSet() : EntityLiteral[] { return this.assertRecService?.dataSet || []}
  public setRecordSet(set : EntityLiteral[]) { this.assertRecService.dataSet = set}
  public get primaryKeyFields() : EntityLiteral { return this.assertRecService.primaryKeyFields}
  // filter
  public get hasFilters() : boolean { return this.assertRecService.hasFilters }
  public get hasFlowFilters() : boolean { return this.assertRecService.hasFlowFilters }
  public get hasActiveFlowFilters() : boolean { return this.assertRecService.hasActiveFlowFilters }
  public get hasUnlockedFilters() : boolean { return this.assertRecService.hasUnlockedFilters }
  public get fiendlyFilters() : string { return this.assertRecService.friendlyFilters }
  public setRange(fieldName:string, range? : any) : EntityService<EntityLiteral>{ return this.assertRecService.setRange(fieldName, range) }
  public setFilter(fieldName: string, condition: ClientFilterCondition | string) : EntityService<EntityLiteral>{ return this.assertRecService.setFilter(fieldName, condition) }
  public setFilters(fieldConditions : FieldConditions<Entity>):EntityService<EntityLiteral>{return this.assertRecService.setFilters(fieldConditions) }
  public setNormalFilters(fieldConditions : FieldConditions<Entity>):EntityService<EntityLiteral>{return this.assertRecService.setNormalFilters(fieldConditions) }
  public setFlowFilters(fieldConditions : FieldConditions<Entity>):EntityService<EntityLiteral>{return this.assertRecService.setFlowFilters(fieldConditions)}
  public mergeFilters(filters : ClientFilters<EntityLiteral>, overwrite : boolean = false):EntityService<EntityLiteral>{return this.assertRecService.mergeFilters(filters, overwrite)}
  public setParameter(param : string | string[] | undefined):EntityService<EntityLiteral>{return this.assertRecService.setParameter(param)}
  public addParameter(param : string | string[] | undefined):EntityService<EntityLiteral>{return this.assertRecService.addParameter(param) }

  public resetAll() :EntityService<EntityLiteral>{ return this.assertRecService.resetAll() }
  public lockFilters(toLock : string | string[])  : EntityService<EntityLiteral> { return this.assertRecService.lockFilters(toLock) }
  public copyFilters(from : EntityService<EntityLiteral>) : EntityService<EntityLiteral> { return this.assertRecService.copyFilters(from) }
  public copyNormalFilters(from : EntityService<EntityLiteral>, includeLocked : boolean = true) : EntityService<EntityLiteral> {return this.assertRecService.copyNormalFilters(from, includeLocked) }
  public copyFlowFilters(from : EntityService<EntityLiteral>, includeLocked : boolean = true) : EntityService<EntityLiteral> { return this.assertRecService.copyFlowFilters(from, includeLocked) }
  public getNormalFilters(includeLocked : boolean = true) : ClientFilters<EntityLiteral>{ return this.assertRecService.getNormalFilters(includeLocked) }
  public getFlowFilters() : ClientFilters<EntityLiteral>{ return this.assertRecService.getFlowFilters() }
  public resetNormalFilters() : EntityService<EntityLiteral>{ return this.assertRecService.resetNormalFilters() }
  public resetFlowFilters() : EntityService<EntityLiteral>{ return this.assertRecService.resetFlowFilters() }
  public resetFilters()  :EntityService<EntityLiteral>{ return this.assertRecService.resetFilters() }
  public clearFilters()  :EntityService<EntityLiteral>{ return this.assertRecService.clearFilters() }
  // database  
  public select(fieldNames :string[]) : EntityService<EntityLiteral> { return this.assertRecService.select(fieldNames) }
  public setOrder(order : SortOrder<Entity> | undefined ) : EntityService<EntityLiteral>{ return this.assertRecService.setOrder(order) }
  public setCalcFields(calcFieldNames : string[]) : EntityService<EntityLiteral>{ return this.assertRecService.setCalcFields(calcFieldNames) }
  public take(n : number ) :EntityService<EntityLiteral> {return this.assertRecService.take(n) }
  public skip( n : number) :EntityService<EntityLiteral> { return this.assertRecService.skip( n )}
  // operations
  public count(observer?:PartialObserver<number>)           : Observable<number> { return this.assertRecService.count(observer) }
  public get(observers? : PartialObserver<EntityLiteral>[] )       : Observable<EntityLiteral> { return this.assertRecService.get(observers) }
  public findFirst(observers? : PartialObserver<EntityLiteral>[])  : Observable<EntityLiteral> { return this.assertRecService.findFirst(observers) }
  public findLast(observers? : PartialObserver<EntityLiteral>[])   : Observable<EntityLiteral> { return this.assertRecService.findLast(observers) }
  public findMany(observers? : PartialObserver<EntityLiteral[]>[]) : Observable<EntityLiteral[]> { return this.assertRecService.findMany(observers) }
  public calcFields(fieldsToCalculate : string[], observer? : PartialObserver<EntityLiteral>) : Observable<EntityLiteral>{ return this.assertRecService.calcFields(fieldsToCalculate, observer) }
  public insert(observer? : PartialObserver<EntityLiteral>)          : Observable<EntityLiteral>{ return this.assertRecService.insert(observer) }
  public rename(observer? : PartialObserver<UpdateResult>)    : Observable<UpdateResult> { return this.assertRecService.rename(observer) }
  public update(observer?: PartialObserver<EntityLiteral>)    : Observable<EntityLiteral> { return this.assertRecService.update(observer) }
  public updateMany(observer?: PartialObserver<UpdateResult>) : Observable<UpdateResult> { return this.assertRecService.updateMany(observer) }
  public delete(observer?:PartialObserver<DeleteResult>)      : Observable<DeleteResult> { return this.assertRecService.delete(observer) }
  public deleteMany(observer?: PartialObserver<DeleteResult>) : Observable<DeleteResult>{ return this.assertRecService.deleteMany(observer) }

//#endregion record-functions

}
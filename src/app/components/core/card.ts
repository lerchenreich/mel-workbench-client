import { Router } from '@angular/router'
import { Injector, Directive, EventEmitter, OnInit, AfterViewInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { isEmpty } from 'lodash'

import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateService } from '@ngx-translate/core'
import { Page} from './page'
import { fromEvent, NextObserver, PartialObserver } from 'rxjs'
import { DeleteResult, UpdateResult } from 'src/app/services/core/entityService'
import { filter } from 'rxjs/operators'
import { untilDestroyed } from '@ngneat/until-destroy'
import { DialogButtons, IMessageDialogData, MessageDialogComponent, MessageResults } from '../dialogs/message-dialog/message-dialog.component'
import { CardData} from './page-data'
import { FieldContext, PageTypes } from './types'
import { CardFieldComponent } from '../controls/fields/cardfield/cardfield.component'

/**
 * Basisklasse für alle gerouteten Cards (ausgeprägte entität)
 * Abgeleitete Klassen  ->  alle {entityname}Card
 *                     
 */
@Directive()
export abstract class Card<Entity> extends Page<Entity> implements AfterViewInit{
  readonly capturedActionKeys : string[] = ['F6', 'F8','Enter', 'Delete']
  
  param : Partial<Entity> = {}

  constructor(private entityFunc : Function,
              private router: Router, 
              injector : Injector,
              translateService : TranslateService,
              dialog : MatDialog, 
              snackbar : MatSnackBar){
    super(injector, translateService, dialog, snackbar)
    this.pageType = PageTypes.Card
    this.entityName = entityFunc.name
    this.router.onSameUrlNavigation = "reload"
      //broadcast the defined actionkeys to the parts of the card
    this.capturedActionKeys.forEach(key => this.actionkeyEmitterMap.set(key, new EventEmitter<KeyboardEvent>(true)))
    fromEvent(window, 'keydown')//,  {capture : true, once : false})
    .pipe(
      untilDestroyed(this),
      filter((event: KeyboardEvent) => this.capturedActionKeys.includes(event.code))
    )
    .subscribe( (event: KeyboardEvent) => {
      if (event.code == 'Enter' || event.code == 'Delete')
        this.actionkeyEmitterMap.get(event.code).emit(event)   
    })
  }

  cardData : CardData<Entity>  
  
  get friendlyParam() : string { return isEmpty(this.param)? '' : Object.values(this.param).join('.') }
  get title() : string { return `${this.caption} ${this.friendlyParam}`}
     
  get selfRoute() : string { return `/${this.entitySingularName.toLowerCase()}-card`}
  get routePrevious() : string[] {return [this.listRoute] }  
  get routeToAddEntity() : string[] { return [this.cardRoute,'']}
  
  protected editableColIndices : number[]
  protected isDirty() : boolean { return this.cardData ? this.cardData.isDirty : false }
  protected isValid() : boolean { return this.cardData.isValid }
  protected shouldSave() : boolean { return this.cardData.isDirtyAndValid() }
  get firstEditableColIndex() : number { return this.editableColIndices.length? this.editableColIndices[0] : -1}
  get lastEditableColIndex() : number { return this.editableColIndices.length? this.editableColIndices[this.editableColIndices.length-1] : -1 }

 
  context(fieldName : keyof Entity) : FieldContext<Entity>{
    return {
      meta  : this.columnsMap.get(fieldName),
      data : this.cardData,
      editable : this.modifyAllowed,
      touchedObs : { next : (field : CardFieldComponent) => this._recService.triggerColumn(field.name as keyof Entity, field.validationRec)}, 
      changedObs : { next : (value : string | boolean) => {if (this.shouldSave()) this.saveData() } }
    }
  }
  //todo?
  setFocusToFirstInvalidCell(row : CardData<any>) {
    const cell = row.firstInvalid
    if (cell) { 
      //cell.validate()
     // this.simulateMouse('click', this.getCellAt(row.index, cell.columnIndex))
    } 
  }
  
  ngAfterViewInit() : void {   
    super.ngAfterViewInit()
  }

  
  navigateToPrevious(){
      if (!this.isErrorMode)
        this.router.navigate(this.routePrevious);
  }    
    //#region abstract member implementations
  onNew(){
    this._recService.initData(true)
  }

  protected retrieveData(){
    this.findFirst([this.findObserver])
  }
  protected deleteData() {
    const pkFields = this.getPrimaryKeyFields()
    if (!pkFields) {
      this.alertWarning('Invalid primary-key!')
      return
    }
    this.deleteDlg('DeleteOne',  {context : Object.values(pkFields).toString()}, { next : (yes : boolean) => {
      if (yes){
        this.delete(this.deleteObserver)
      }
    }})
  }
 
  /**
   * Save implementation
   */
  protected saveData(){
    // get the data from cardData
    var row = {} as Entity
    Array.from(this.cardData.fieldComponents).forEach(field => {
      const value = this.cardData.validationRec[field.name] 
      const md = field.ctx.meta    
      row[field.name] = md.javaToApiType? md.javaToApiType(value) : value
    });
    Object.assign(this.rec, row) // merge the new values into the rec
    
    var validationErrors = this._recService.validatePrimaryKeys()
    if (validationErrors.length == 0)
      this._saveRec()
    else {
      validationErrors.forEach((error, i) => {
        var msg = ''
        Object.entries(error.constraints).forEach( message => msg += `${i+1}. ${message[1]}  `) 
        this.alertError(msg)
      }) 
    }
  }
  
  protected _saveRec(){
    if (this.isInsertMode){
      this.insert(this.saveObserver)
    }
    else {
      if (this._recService.primaryKeyChanged){
        var dlgData : IMessageDialogData = {
          title   : 'Message.RenameTitle',
          message : this.translate.instant('RenameOne', { context : this.entitySingularName} ),
          buttons : DialogButtons.YesNo,
          default : MessageResults.NoCancel
        }
        var msgResult : MessageResults;
        const dialogRef = this.dialog.open(MessageDialogComponent,{data : dlgData})
        
        dialogRef.afterClosed()
          .subscribe( answer  => msgResult = answer as MessageResults,
                      error   => this.handleServerError(error),
                      ()      => {  if ( msgResult == MessageResults.YesOk )
                                      this.rename(this.renameObserver) //rename and update         
                                  })
      }
      else
        this.update(this.saveObserver)
    }
  }
 
  protected findObserver : PartialObserver<Entity> = {
    next : entity =>  this.cardData = new CardData(entity, this.columnsMap),
    error : error  => { 
      this.add()
      this.alertError(error)
    },
    complete : () => {
      this.setEditMode() 
      this.cardData = this.cardData
    }
  }
  private deleteResult : DeleteResult
  protected deleteObserver : PartialObserver<DeleteResult> = {
    next : deleteresult => this.deleteResult = deleteresult,
    error :  error => this.handleServerError(error),
    complete : () => {   
      var key = 'Message.'
      var message : string
      switch (this.deleteResult.affected){
        case 0 : message = this.translate.instant(key+'NoneDeleted'); break
        case 1 : message = this.translate.instant(key+'OneDeleted', {singularName : this.entityMetadata.captionSingular}); break
        default: message =`FATAL! ${this.deleteResult.affected} records deleted`; this.alertError(message); break
      }        
      this.snack(message)
      this.navigateToPrevious()
    }
  }
   
  protected saveObserver : PartialObserver<Entity> = {
    error : error => this.handleServerError(error),
    complete : () => { 
      if (this.isInsertMode) {
        const param = Object.values(this.getPrimaryKeyFields()) as string[]
        this.router.navigate([this.cardRoute].concat(param))
      }
      else
        this.cardData.clearDirty() }
  } 

  protected renameObserver : PartialObserver<UpdateResult> = {
    error : error => this.handleServerError(error),
    complete : () => {
        this.snack(this.translate.instant(this.isErrorMode?"NoneRenamed":"OneRenamed"))                                   
        this.navigateToPrevious();
    }
  } 
}
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
import { EntityLiteral, FieldMetadata } from 'src/app/types'

/**
 * Basisklasse für alle gerouteten Cards (ausgeprägte entität)
 * Abgeleitete Klassen  ->  alle {entityname}Card
 *                     
 */
@Directive()
export abstract class Card<Entity extends EntityLiteral> extends Page<Entity> implements AfterViewInit{
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
      filter((event) => this.capturedActionKeys.includes((event as KeyboardEvent).code))
    )
    .subscribe( (event) => {
      const code = (event as KeyboardEvent).code
      if (code == 'Enter' || code == 'Delete')
        this.actionkeyEmitterMap.get(code)?.emit(event as KeyboardEvent)   
    })
  }

  cardData? : CardData<Entity>  
  
  get friendlyParam() : string { return isEmpty(this.param)? '' : Object.values(this.param).join('.') }
  get title() : string { return `${this.caption} ${this.friendlyParam}`}
     
  get selfRoute() : string { return `/${this.entitySingularName.toLowerCase()}-card`}
  get routePrevious() : string[] {return [this.listRoute] }  
  get routeToAddEntity() : string[] { return [this.cardRoute,'']}
  
  protected editableColIndices : number[] = []
  protected isDirty() : boolean { return this.cardData ? this.cardData.isDirty : false }
  protected isValid() : boolean { return !!this.cardData?.isValid }
  protected shouldSave() : boolean { return !!this.cardData?.isDirtyAndValid() }
  get firstEditableColIndex() : number { return this.editableColIndices.length? this.editableColIndices[0] : -1}
  get lastEditableColIndex() : number { return this.editableColIndices.length? this.editableColIndices[this.editableColIndices.length-1] : -1 }

  context(fieldName : string) : FieldContext<Entity>{
    return {
      meta  : this.assertGetFieldMd(fieldName),
      data : this.cardData,
      editable : this.modifyAllowed,
      touchedObs : { next : field => this.assertRecService.triggerColumn(field.name, field.validationRec)}, 
      changedObs : { next : value => {if (this.shouldSave()) this.saveData() } }
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
    this.assertRecService.initData(true)
  }

  protected retrieveData(){
    this.findFirst([this.findObserver])
  }
  protected deleteData() {
    const pkFields = this.primaryKeyFields
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
    if (this.cardData) {      // get the data from cardData
      var row = {} as EntityLiteral
      Array.from(this.cardData.fieldComponents).forEach(field => {
        const value = this.cardData?.assertVRec[field.name] 
        const md = field.ctx.meta as FieldMetadata<Entity> 
        row[field.name] = md.javaToApiType? md.javaToApiType(value) : value
      });
      Object.assign(this.rec, row) // merge the new values into the rec
      
      var validationErrors = this.assertRecService.validatePrimaryKeys()
      if (validationErrors.length == 0)
        this._saveRec()
      else {
        validationErrors.forEach((error, i) => {
          var msg = ''
          Object.entries(error.constraints as {[type : string]:string}).forEach( ([type, message]) => msg += `${i+1}. ${type}: ${message}`) 
          this.alertError(msg)
        }) 
      }
    }
  }
  
  protected _saveRec(){
    if (this.isInsertMode){
      this.insert(this.saveObserver)
    }
    else {
      if (this.assertRecService.primaryKeyChanged){
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
 
  protected findObserver : PartialObserver<EntityLiteral> = {
    next : entity =>  this.cardData = new CardData(entity, this.assertFieldsMdMap),
    error : error  => { 
      this.add()
      this.alertError(error)
    },
    complete : () => {
      this.setEditMode() 
      this.cardData = this.cardData
    }
  }
  private deleteResult? : DeleteResult
  protected deleteObserver : PartialObserver<DeleteResult> = {
    next : result => this.deleteResult = result,
    error :  error => this.handleServerError(error),
    complete : () => {   
      var key = 'Message.'
      var message : string
      switch (this.deleteResult?.affected){
        case 0 : message = this.translate.instant(key+'NoneDeleted'); break
        case 1 : message = this.translate.instant(key+'OneDeleted', {singularName : this.entityMetadata?.captionSingular}); break
        default: message =`FATAL! ${this.deleteResult?.affected} records deleted`; this.alertError(message); break
      }        
      this.snack(message)
      this.navigateToPrevious()
    }
  }
   
  protected saveObserver : PartialObserver<EntityLiteral> = {
    error : error => this.handleServerError(error),
    complete : () => { 
      if (this.isInsertMode) {
        const param = Object.values(this.primaryKeyFields) as string[]
        this.router.navigate([this.cardRoute].concat(param))
      }
      else
        this.cardData?.clearDirty() }
  } 

  protected renameObserver : PartialObserver<UpdateResult> = {
    error : error => this.handleServerError(error),
    complete : () => {
        this.snack(this.translate.instant(this.isErrorMode?"NoneRenamed":"OneRenamed"))                                   
        this.navigateToPrevious();
    }
  } 
}
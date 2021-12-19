import { Injector, ViewChild, ElementRef, Directive, AfterViewInit, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table'
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'
import { forkJoin, Observable} from 'rxjs'
import { Options as SliderOptions, ChangeContext as SliderContext} from '@angular-slider/ngx-slider'
import { TranslateService } from '@ngx-translate/core';
import { untilDestroyed } from '@ngneat/until-destroy';
 
import { FieldTypes, MelFieldClasses, SortOrder } from 'mel-common'

import { DeleteResult, EntityService } from 'src/app/services/core/entityService';
import { ListRow, PageData } from './page-data';
import { IPagemodeChanged, Page } from './page';
import { ListComponent } from '../controls/mel-list/mel-list.component';
import { ListFieldComponent } from '../controls/fields/listfield/listfield.component';
import { ListContext, SaveRequestEvent } from './types';
import { EntityListLiteral, EntityLiteral, FieldMetadata } from '../../types';
import { EntityMetadata } from 'src/app/metadata/entities';
import { isEmpty } from 'lodash';


function log(text:string){console.log(text)}
function logInfo(text:string){console.info(text)}
function logError(text:string){console.error(text)}

/**
 * The List-Component shows a list of an entity. 
 * Derivied classes --> "ListPartComponent" of an unknown Entity 
 *                  --> "ListRoutedComponent" of a known Entity
 * You can link this list to another entity, filter and sort it.
 * You can control the columns which are shown in the @column-decorator of the entity-definition
 * 
 * Usage: With modify-permission you can click in a tablecell to edit this cell (if tablefield is editable)
 *        with click outside the cell, you leave this cell and the cell change to viewmode
 *        "Tab"-Key         selects the next editable column in the row. At the end of the row, the first editable field
 *                          of the next row is selected or a new row ist inserted, if it was the last row.
 *        "Shift-Tab"-Key   selects the previous column in the row until the first editable column is selected
 *        "Arrow-Down"-Key  selects the same column in the row below, if exist (the row will be saved before)
 *        "Arrow-Up"-Key    selects the same column in the row above, if exist (the row will be saved before)
 *        "Enter"-Key       selects the first editable column in the next row and inserts a new row, if it was the last row
 *        Menu "Save"       saves the current row
 *        Menu "New"        saves the current row and adds a new row
 *        Menu "Delete"     removes the current row
 *          
 * Initialisation:
 *    The constructor is provided by an injector, the translateservice, a dialog and a snackbar which provides the Page-constructor
 * 
 * Validation:  After loading the datasource from database, the fields are not validated and we assume, that all fields are valid.
 *              After a row was inserted and initalized, all fields are validated and the first invalid fieldindex is part of the status. 
 *              While editing a cell and leaving the edit mode of the cell, the value will be valiated and the list is to be notified about the result. 
 *              If the cell was valid 
 *                and the cell is the first invalid index in the status, the row becomes valid (for a short time) 
 *                after that, the next invalid column is searched and becomes the first invalid index of the status. if not found, the row stays valid
 *              If the cell was invalid 
 *                a message is displayed in the field,
 *                the row becomes invalid if it was valid. The smaller indexvalue is stored in the status  
 *              
 * 
 * Saving:      If the dataset is to be saved, the valid-status and the primary key is checked 
 *           
 * Errorhandling: If an (sql-)error occurs, the error is displayed and all other rows are blocked from editing until the user closes the errormessage
 */



@Directive()
export abstract class ListPage<Entity extends EntityLiteral> extends Page<Entity> implements OnInit, AfterViewInit {
  constructor(injector : Injector, translate: TranslateService, dialog : MatDialog, snackBar : MatSnackBar) {
    super(injector, translate, dialog, snackBar)
  }
  readonly rowHeight = 24
  readonly showTickValuesThreshold = this.rowHeight + 6

  public dataSource  = new MatTableDataSource<ListRow<Entity>>()
  protected pageSize : number = 20
  public locked : boolean = true
  public sortOrder? : SortOrder<Entity>
  protected totalRecCount = 0  // the total number of records within the filters
  public currPageNo : number = -1
  public get fieldMd() : FieldMetadata<Entity>[] { return this.listContext.metadata || []}
  public set fieldMd(md) { this.listContext.metadata = md }
 
  get title() : string {
    return this.hasUnlockedFilters ? this.caption + ' - ' + this._recService?.friendlyFilters : this.caption
  }
  public get listHeight() : string { return `${this.pageSize*(this.rowHeight+1)}px`}
  public get nothingSelected() : boolean { 
    return this.listComponent? this.listComponent.rowSelection.isEmpty() : true
  }
  public get hasInvalidRow() : boolean{
    return !!this.listComponent?.firstInvalidRow
  }
  listContext : ListContext<Entity> = {}
   
  @ViewChild('melList') listComponent? : ListComponent
  get assertListComponent() : ListComponent { 
    if (this.listComponent) return this.listComponent
    throw new Error('listComponent is undefined!')
  }
  protected shouldSave() : boolean {
    //if (!this.listComponent) return false
    return !!this.listComponent?.isDirty && !!this.listComponent.firstInvalidRow 
  }
    /**
   * Get the fieldnames to display and their metadata 
   * the fieldnames are listed in an array (displayColumns), which first element is the statusfield
   * the metadata are stored in a map (columnOptionsMap) and an array (columnOptions) correspondig with the displayColumns 
   * The fieldcaptions an enumvalues are translated and stored the caption of the metadata
   */
  ngOnInit() : void {      
    this.listContext = {
      permissions : this.permissions,
      touchedObs : { 
        next : (field : ListFieldComponent) => this.assertRecService.triggerColumn(field.name, field.validationRec)
      }, 
      sortObs    :  { 
        next : newSortorder => {
          this.sortOrder = newSortorder
          this.refresh()
        }},
      saveObs    : { next : saveReq =>  this.tryUpdate(saveReq) },
      addRowObs  : { next : rowIndex => this.addRowAt(rowIndex) },
    }
    // Status-column
    this.fieldMd = [{name : PageData.statusColumn, editable : false, type : FieldTypes.String, class : MelFieldClasses.None} ]
    this.addDisplayedColumns()
  }
  ngAfterViewInit(){
    //console.info(`${this.constructor.name}.AfterViewInit`)
    super.ngAfterViewInit()
   
    this.pagemodeChanged.subscribe( (pageModeInfo : IPagemodeChanged) => {
      this.assertListComponent.parentPagemode = pageModeInfo.newMode 
    })
  }

  //#region paging
  @ViewChild('pageSlider', { read: ElementRef }) 
  pageSliderRef?: ElementRef<HTMLDivElement>
  
  get pageSliderElement(): HTMLDivElement | null { return this.pageSliderRef?.nativeElement || null}
  
  public set pageCeil(ceil :number){
    ceil = Math.max(1, ceil)
    const newSliderOptions = Object.assign( {}, this.sliderOptions)
    newSliderOptions.ceil = ceil
    newSliderOptions.showTicksValues = !newSliderOptions.vertical && Math.round(ceil/(newSliderOptions.tickStep||1)) <= this.showTickValuesThreshold
    this.sliderOptions = newSliderOptions
    if (this.pageSliderElement) {
      var style = this.pageSliderElement.style
      style.display = ceil > 1 ? 'flex' : 'none'
      style.height = `${this.pageSize * this.rowHeight}px`
    }
  }
  sliderOptions : SliderOptions = {
    floor : 1,              //readonly
    ceil  : 20,
    step  : 1,              //readonly
    minRange : 1,
    showTicks: false,
    noSwitching: true,      //readonly
    showSelectionBar: true,  //readonly
    //showTicksValues: true,
    tickStep: 10,
    vertical : true,
    rightToLeft: true,
    // tickValueStep: 10 // hides ticksvalues !!!
  }  
  onSliderChangeEnd(ctx: SliderContext){
    this.refresh()
  }
  //#endregion paging
 
  
  //#region Abstract Page-methods implementations
  /**
   * get the data from database
   */
  protected retrieveData() {  
    if (this.locked)
      return
    this.count( { 
        next : cnt => this.totalRecCount = cnt,
        error : err => this.alertError(err),
        complete: () => { 
          this.currPageNo = 1; 
          this.refresh()}
      }
    )
  }
  /**
   * Saves all dirty records
   * Implements the abstrct page-method to save the content of the list
   * @param event 
   */
  saveData() {
    const listComp = this.assertListComponent 
    const row = listComp.firstInvalidRow
    if (row) {
      listComp.setFocusToFirstInvalidCell(row)
    }
    else 
      listComp.dirtyRows.forEach(row => this.tryUpdate({pageData : row as PageData<EntityLiteral, ListFieldComponent>}))
  }
 
  /**
   *
   * Removes the selected rows
   * Implements the abstract page-method to remove content
   * @param event 
   */
  protected deleteData() {
    const listComp = this.assertListComponent 
    var rowIndicesToDelete = listComp.selectedRowIndices.filter( i => !this.dataSource.data[i].isNew )
    var count = rowIndicesToDelete.length
    var messageKey, params
    switch( count ){
      case 0 :  if ( listComp.selectedRowIndices.length > 0)
                  this.refresh()
                return
      case 1 : { 
        messageKey = 'DeleteOne'
        Object.assign(this.rec, this.recordSet[rowIndicesToDelete[0]])
        const pkFields = this.primaryKeyFields
        if (!isEmpty(pkFields)) {
          params = {context : Object.values(pkFields).toString()}
        }
        else {
          this.alertService.alertWarning('Invalid primary-key!')
          return
        }
        break
      }
      default : 
        messageKey = 'DeleteMore' 
        params = {count : count}
        break
    }
    this.deleteDlg(messageKey, params, { next : (yes : boolean) => {
      if (yes)
        this.deleteSelected(rowIndicesToDelete)
    }})
  }

  public deleteSelected(rowIndicesToDelete : number[]) {
    var delete$ : Observable<DeleteResult>[] = []
    var count = 0
    var clone : EntityService<EntityLiteral> 
    rowIndicesToDelete.forEach( selIdx => {
      clone = EntityService.createFrom(this.assertRecService)
      Object.assign(clone.data, this.recordSet[selIdx])
      delete$.push(clone.delete())
    })
    forkJoin(delete$)  // wait until all rows are deleted
    .subscribe({
      next : deleted => deleted.forEach(res => count += res.affected||0),
      error :  error => this.handleServerError(error),
      complete : () => {   
        this.totalRecCount -= count     
        var translate$ : Observable<string>
        var key = 'Message.'
        switch (count){
          case 0 : translate$ = this.translate.get(key+'NoneDeleted'); break
          case 1 : translate$ = this.translate.get(key+'OneDeleted', {singularName : this.entityMetadata?.captionSingular}); break
          default: translate$ = this.translate.get(key+'MoreDeleted', {count : count, pluralName : this.entityMetadata?.captionPlural}); break
        }      
        this.assertListComponent.selectedRowIndices = []  
        translate$.subscribe( message => this.snack(message) )
        this.refresh()
      }
    })
  }



  addDisplayedColumns(){
    const rec = this.assertRecService
    const toAdd = this.isRoutedList ? rec.entityMetadata.displayedFields.default : rec.entityMetadata.displayedFields.part
    if (toAdd && toAdd.length){
      for (let name of toAdd) {
        this.fieldMd.push(Object.assign(this.assertGetFieldMd(name as string), {name : name as string}))
      }
    }
    else { // select ALL without _timestamp 
      this.assertFieldsMdMap.forEach( (colMeta, key) => {
        if (key !== 'timestamp'){ 
          this.fieldMd.push(Object.assign(colMeta, {name : key as string}))
        }
      })
    }
  }

  //#endregion Abstract Page-methods implementations  
 
  refresh(){
    this.assertListComponent.rowSelection.clear()
    this.setEditMode()
    if (this.sortOrder) 
      this.setOrder(this.sortOrder)
    this.skip( (this.currPageNo-1) * this.pageSize)
    this.take(this.pageSize)
     this.findMany([{ 
      error : err => logError("List-Error: " + err),
      complete : () => {
        this.pageCeil = Math.round(this.totalRecCount / this.pageSize)
        this.dataSource.data = this.recordSet.map( 
          (entity : EntityLiteral, index : number) => {
            var row = new ListRow(entity, this.assertFieldsMdMap, index)
            return row
          }
        )
        this.dataSource.connect()
      }
    }])  
  }

 
  /**
   * Adds a new row below the first selected or at the end of the list
   * Called when menu.add was clicked or F3-pressed 
   */
  onNew(){
    if (this.isInsertMode)
      return
    this.addRowAt(this.assertListComponent.getNewRowIndex())
  }

  protected addRowAt(rowIndex : number){
    const rec = this.assertRecService
    this.assertListComponent.rowSelection.clear()
    rec.initData(true)
    rec.setPrimarykeysFromFilter() 
    rec.afterInit()
    .pipe(untilDestroyed(this))
    .subscribe(
      entity => {
        const datasourceRow = new ListRow(entity, this.assertFieldsMdMap, rowIndex) 
        datasourceRow.prepared = true
        var data = this.dataSource.data 
        this.recordSet.splice(rowIndex, 0, entity)
        // rename indices below

        for(var i = rowIndex; i<data.length; i++) 
          data[i].incrementIndex() 
        data.splice(rowIndex, 0, datasourceRow) // insert new row below
        this.dataSource.data = data   //...and trigger the changedetector
      }
    )
  }


  /**
   * tries to insert a record with the given rowIndex or row
   * we insert only, if the primary key is defined. the other validations are suppressed?
   * @param datasourceRow 
   */
  tryInsert(saveRequest : SaveRequestEvent) : boolean {
    const rowIndex = saveRequest.pageData.index
    try{
      const xRecordset = this.recordSet[rowIndex]
      var row = {} as EntityLiteral
      this.fieldMd.forEach(
        (colMeta, i) => {
          if (colMeta.name !== ListRow.statusColumn){
            const value = saveRequest.pageData[colMeta.name as string]
            row[colMeta.name as string] = colMeta.javaToApiType? colMeta.javaToApiType(value) : value
          }
      })
      
      Object.assign(this.rec, xRecordset, row) 
      const pkfields = this.primaryKeyFields //check if primary keys are defined
      if (isEmpty(pkfields))  
        return false
      
      this.insert()
      .subscribe({
        next : inserted => {
          saveRequest.pageData.clearDirty()
          this.setEditMode()
        },
        error: error => { throw error },
        complete: () => { 
          //determin the pageIndex of the new record
          var rec2 = EntityService.create(this.injector, this.entityName as string) as EntityService<EntityLiteral>
          rec2.copyFilters(this.assertRecService) // including filters and order
          for(let [key, value] of Object.entries(pkfields)) 
            rec2.setFilter(key, `<=${value}`)
          forkJoin([this.count(), rec2.count()])
            .subscribe({
              next : ([countAll, countUntil]) => {
                this.totalRecCount = countAll
                this.currPageNo = Math.floor(countUntil / this.pageSize)+1
              },
              error: error => { 
                if (saveRequest.afterSavedObserver?.error)
                  saveRequest.afterSavedObserver.error(error)
                else  
                  throw error 
              },
              complete: () => {
                if (saveRequest.afterSavedObserver) 
                  saveRequest.afterSavedObserver.complete()
            //    this.datasource.disconnect()
            //    this.refresh()
              }
            })
          // this.scollToIndex = undefined  
        }
      })
    }
    catch(error){
      this.handleServerError(error as Error);
      return false
    }
    return true
  }

  tryUpdate(saveRequest : SaveRequestEvent) :boolean{
    if (saveRequest.pageData.isNew) 
      return this.tryInsert(saveRequest)
    
    try{
      var row = {} as EntityLiteral
      const xRec = this.recordSet[saveRequest.pageData.index]
      this.fieldMd.forEach( (colMeta, i) => {
        if (colMeta.name !== ListRow.statusColumn){
          const value = saveRequest.pageData[colMeta.name as string]
          row[colMeta.name as string] = colMeta.javaToApiType? colMeta.javaToApiType(value) : value
        }
      })
      Object.assign(this.rec, xRec, row) // merge the new values with xValues into the rec

      this.update()
      .subscribe( 
        updatedRow => { // Update the recordset       
          const pk  = {} as EntityLiteral // find the row to update by primarykey
          for(let key of (this.entityMetadata as EntityMetadata).primaryKeys) pk[key as string] = updatedRow[key]
          const rowIndex = this.recordSet.findIndex( 
            row => Object.entries(pk).every( ([key,value]) => row[key] === value )
          )
          if (rowIndex >= 0) 
          saveRequest.pageData.clearDirty()
        },
        error => {  
          if (saveRequest.afterSavedObserver?.error)
            saveRequest.afterSavedObserver.error(error) 
          else throw error 
        },
        () => { 
          if (saveRequest.afterSavedObserver) 
            saveRequest.afterSavedObserver.complete() 
        }
      )
     //this.scollToIndex = undefined  
    }
    catch(error){
      this.handleServerError(error as Error)
      return false
    }
    return true
  }

}

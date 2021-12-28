import { Component, EventEmitter } from '@angular/core';
import { OnDestroy, AfterViewInit, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { fromEvent, NextObserver} from 'rxjs'
import { delay} from 'rxjs/operators';
import * as $ from 'jquery'
  
import { SortOrder } from 'mel-common'
import { ListFieldComponent, NavigationKeys, ShortcutKeys} from '../fields/listfield/listfield.component';
import { ListRow } from '../../core/page-data';
import { Sort } from '@angular/material/sort';
import { Permissions } from '../../core/page';
import { FieldContext, FieldNavigationEvent, ListContext, PageModes, SaveRequestEvent} from 'src/app/components/core/types';
import { EntityLiteral, FieldMetadata } from '../../../types';
import { Field } from '../fields/field';

function log(text:string){console.log(text)}
function logInfo(text:string){console.info(text)}
function logError(text:string){console.error(text)}

const colorDirty = 'Yellow'
const colorSelected = 'LightYellow'
const colorMouseOver = 'LightGray'
const colorEven = 'WhiteSmoke'
/**
 * Usage: With modify-permission you can click in a tablecell to edit this cell (if tablefield is editable)
 *        with click outside the cell, you leave this cell and the cell change to viewmode
 *        "Tab"-Key         selects the next editable column in the row. At the end of the row, the first editable field
 *                          of the next row is selected or a new row ist inserted, if it was the last row.
 *        "Shift-Tab"-Key   selects the previous column in the row until the first editable column is selected
 *        "Arrow-Down"-Key  selects the same column in the row below, if exist (the row will be saved before)
 *        "Arrow-Up"-Key    selects the same column in the row above, if exist (the row will be saved before)
 *        "Enter"-Key       selects the first editable column in the next row and inserts a new row, if it was the last row
 *          
 * Inputs: context : ListContext
 *    - datasource  : A MatTableDatasource of DatasourceRow
 *    - permissions : insert-, modify-, delete-permissions
 *    - metadata    : Columnsmetadata of the eentity (IColumnMetadata<Entity>[])
      - fieldTriggerObserver : Observes the valid fieldchanges to trigger the fieldtrigger
      - sortObserver : Observes the sort-requests
      - saveObserver : Observes the saverequests
      - addRowObserver : Observes the requests to add a row

 * Initialisation:
 *    The constructor is provided with the alertService to display messages
 *    
 * For each tablecell the mel-cell-component is used. A cell get its column-metadata, the permission and its columnindex
 * To receive notifications from the cell a notificationhandler (onCellNotify) is used. The cell notifies about
 * - key-navigation : the following Keys are supported: Arrow-Up, Arrow-Down, TAB, Shift-TAB, Enter
 * - dirty          : the datasource-row will be dirty
 *                    toDo: If the cell knows his datasourcerow it can set itselt the row dirty
 * - modeChange     : arrives when the cell-mode (view, edit) changes. It is used to save the row
 * - autocompleted  : A field can be autocompleted by the cell-component without changing the datasource, because no userinput
 *                    happened. Here we can update the datasource with the autocompleted value
 *                    toDo: If the cell knows his datasourcerow it cat set itself the value
 * - validation     : to do
 * 
 * Validation:  When data is loaded we assume, that all fields in the datasource are valid. 
 *              For new rows which are initialized with default-values, we assume the same. So the default values must be consistent valid.           
 *              After editing a cell (leaving the edit mode of the cell), the cell-value will be validated. 
 *              If the cell was invalid a message is displayed in the field. 
 *              If the cell becomes valid, the message becomes empty
 *              Only a valid row can be saved
 * 
 */

@Component({
  selector: 'mel-list',
  templateUrl: './mel-list.component.html',
  styleUrls: ['../../core/list.component.css']
})
@UntilDestroy()
export class ListComponent implements AfterViewInit, OnDestroy {
  private _listContext? : ListContext<EntityLiteral>
  private _permissions? : Permissions 
  private mouseOverIndex? : number
  private _parentPageMode : PageModes = PageModes.None
  
  fieldNames      : string[] = []
  editableFieldIndices : number[] = []
  private defaultFieldcontext : FieldContext<EntityLiteral> 
  
  onSortAction   = new EventEmitter<SortOrder<EntityLiteral>>()
  saveRowRequest = new EventEmitter<SaveRequestEvent>()
  addRowRequest  = new EventEmitter<number>()
  rowInitialized = new EventEmitter<ListFieldComponent>()
 
  constructor() { 
    this.rowSelection = new SelectionModel<ListRow<any>>(true, [], true) 
    this.selectedRowIndices = []
    this.rowSelection.changed
      .pipe(untilDestroyed(this))
      .subscribe(selection => { 
        this.selectedRowIndices = selection.source.selected.map(row => row.index)
      })
    //When a row was added (currRowIndex), we wait until the row is initialized 
    //and simulate on the first editable field a mouseclick to set focus  
    this.rowInitialized.pipe( untilDestroyed(this), delay(0) ) //suppress the "ExpressionChangedAfterItHasBeenCheckedError" 
    .subscribe( field => {
      this.simulateMouse('click', this.getCellAt(field.rowIndex, this.firstEditableColIndex))
      field.data.prepared = false
      field.data.setNew()
    })
    // this fieldcontext will be assigned to the input data and metadata
    this.defaultFieldcontext = {
      
      editable            : true,
      assistObs           : { next : field => { console.info(`Assist requested for field ${field.name}`)} },
      initializationObs   : { next : field => {
          if (field.colIndex == this.lastEditableColIndex)
          this.rowInitialized.next(field)
        }},
      navigationObs       : { next : fieldNav => this.onCellKeyNavigation(fieldNav) },
      shortcutObs         : this.shortcutObserver,
      rowChangedObs        : { 
        next : event => {
          if (event.row.isDirtyAndValid())
            this.saveRowRequest.next({ pageData : event.row })
        }}
    }
  }
 
  get tableElement() : HTMLTableElement | null  { return this.tableRef? this.tableRef.nativeElement : null }
  get permissions() : Permissions { return this._permissions as Permissions}
  set parentPagemode(mode : PageModes){ this._parentPageMode = mode }
  get fieldMetadata() :  FieldMetadata<EntityLiteral>[] { return this._listContext?.metadata || [] }
  get isErrorMode() : boolean { return this._parentPageMode == PageModes.Error }
  get isInsertMode(): boolean { return this._parentPageMode == PageModes.Insert }
  
  get firstEditableColIndex() : number { return this.editableFieldIndices.length? this.editableFieldIndices[0] : -1}
  get lastEditableColIndex() : number { return this.editableFieldIndices.length? this.editableFieldIndices[this.editableFieldIndices.length-1] : -1 }

  @Input() set context(ctx : ListContext<EntityLiteral>){
    this._listContext = ctx
    if (!this._permissions && ctx.permissions) 
      this.permissions = ctx.permissions
    this.fieldNames = this.fieldMetadata.map( meta => meta.name as string )
    if (ctx.touchedObs) 
      this.defaultFieldcontext.touchedObs = ctx.touchedObs as NextObserver<Field>
    if (ctx.addRowObs) 
      this.addRowRequest.pipe(untilDestroyed(this)).subscribe(ctx.addRowObs)
    if(ctx.saveObs)
      this.saveRowRequest.pipe(untilDestroyed(this)).subscribe(ctx.saveObs)
  }  

  @Input() dataSource? : MatTableDataSource<ListRow<EntityLiteral>>
  get assertDataSource() :  MatTableDataSource<ListRow<EntityLiteral>> { if (this.dataSource) return this.dataSource; throw new Error('dataSource undefined!')}
  @Input() 
  set permissions(p : Permissions) {
    this._permissions = p;
    (this._listContext as ListContext<EntityLiteral>).permissions = p
    this.defaultFieldcontext.editable =  this.permissions.modify
  }
  
  @ViewChild('melTable', { read: ElementRef }) tableRef: ElementRef<HTMLTableElement>|null = null
  
  fieldContext(row : ListRow<any>, meta : FieldMetadata<any>) : FieldContext<any>{
    this.defaultFieldcontext.editable &&= (meta.editable === undefined)? true : meta.editable
    return  Object.assign({ data : row, meta : meta }, this.defaultFieldcontext)
  }


 // #region row
 rowSelection : SelectionModel<ListRow<EntityLiteral>> 
 selectedRowIndices : number[]   
 
 public get firstInvalidRowIndex()  : number | undefined          { return this.dataSource?.data.findIndex(row => !row.isValid) }
 public get firstInvalidRow()       : ListRow<EntityLiteral>|undefined{ return this.dataSource?.data.find(row => !row.isValid) }
 public get dirtyRows()             : ListRow<EntityLiteral>[]  { return this.dataSource?.data.filter( row => row.isDirty ) ||[] }
 public get isDirty()               : boolean                     { return this.dataSource?.data.some( row => row.isDirty ) || false }
 isRowDirty(i : number){ 
   return (this.dataSource?.data[i])? this.dataSource.data[i].isDirty : false
 }
 
 public getNewRowIndex() : number {
   if (this.rowSelection.hasValue()){
     this.rowSelection.sort( (a,b) => a.compare(b))
     return this.rowSelection.selected[0].index + (this.shiftPressed?0:1)
   }
   return this.dataSource?.data.length || 0
 }

 setFocusToFirstInvalidCell(row : ListRow<any>) {
   const cell = row.firstInvalid
   if (cell) { 
     //cell.validate()
     this.simulateMouse('click', this.getCellAt(row.index, cell.colIndex))
   } 
 }
 
 //#endregion row

  //#region Angular hooks
  ngAfterViewInit() {
    //console.info(`${this.constructor.name}.AfterViewInit, Permisssions: "${this.permissions.permissionString}"`)
    
    var style
    // correct the style of the slider-bubbles
    var bubbles = document.getElementsByClassName('ng5-slider-bubble')
    for (let i=0; i<bubbles.length; i++){
      style = (bubbles[i] as HTMLElement).style
      style.fontSize = "10px"
      style.lineHeight = "1.2"
      style.marginBottom = "4px"
    } 
    this.editableFieldIndices = this.fieldMetadata.map( (col,i) => col.editable ? i : -1 ).filter(i => i>=0 )
    
    // capture mouseclicks in the list to prevent default behavior, if the page is in error-mode   
    fromEvent(this.tableElement as HTMLElement, 'click', {capture : true, once : false})
    .pipe(untilDestroyed(this))
    .subscribe( {
      next : (event : Event) => {
        if (this.isErrorMode) {
          var element = (event.target as HTMLElement)
          while (element.tagName !== 'TR'){
            if (!element.parentElement || element.parentElement.tagName === 'TABLE') 
             return // clicked above a row
            element = element.parentElement
          }
          // check, if the row is dirty. if not, prevent defaultbehavior
          const clickedRow = Number(element.id)
          if (!this.isRowDirty(clickedRow))
           event.preventDefault()
        }
      }
    })
  }
  /*
  ngAfterViewChecked(){
    if (this.scollToIndex)     document.getElementById(this.scollToIndex)?.scrollIntoView({block:'start', behavior:'auto'})
  }
  */
  ngOnDestroy(): void {
    this.dataSource?.disconnect()
  }
  //#endregion
  
  /**
   * called, when the user clicks on the sort-arrow in the listheader
   * @param sort : Sort
   */
  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return;
    }
    var sortOrder : SortOrder<any> = {}
    sortOrder[sort.active] = sort.direction === 'asc' ? "ASC" : "DESC"
    this.onSortAction.next(sortOrder)
  }
  

 
  //#region DOM-eventhandler
  shiftPressed : boolean = false
  ctrlPressed  : boolean = false
  @HostListener('keyup', ['$event']) 
  onKeyUp(event : KeyboardEvent) {
    this.shiftPressed = event.shiftKey
    this.ctrlPressed  = event.ctrlKey
  }
  @HostListener('keydown', ['$event']) 
  onKeyDown(event : KeyboardEvent) {
    this.shiftPressed = event.shiftKey
    this.ctrlPressed  = event.ctrlKey
  }
  //#endregion DOM-eventhandler


  shortcutObserver : NextObserver<FieldNavigationEvent> = {
    next : (fieldShortcut) => {
      const key = fieldShortcut.keyboardEvent.key as ShortcutKeys
      const field = fieldShortcut.field
      switch(key) {
        case 'F8' : if (field.rowIndex > 0) {
          const ds = this.dataSource as MatTableDataSource<ListRow<EntityLiteral>>
          var value = ds.data[field.rowIndex-1][field.name]  
          ds.data[field.rowIndex][field.name] = value   
        } 
        break
        default : return
      }
      fieldShortcut.keyboardEvent.cancelBubble = true
      fieldShortcut.keyboardEvent.preventDefault()
    }    
  }

  async onCellKeyNavigation(fieldNav: FieldNavigationEvent) {
    if (!this.permissions.modify) {
      console.error(`ListComponent.onCellKeyNavigation() reached even permissions are !modify.`)
      return
    }
    const key = fieldNav.keyboardEvent.key as NavigationKeys
    const field = fieldNav.field
    var nextRowIndex : number = field.rowIndex
    var nextColIndex : number = field.colIndex
    const component = this as ListComponent
    
    function onError() {
      const firstInvalid = field.data.firstInvalid as ListFieldComponent
      notConsumed()
      if (firstInvalid){
        nextColIndex = firstInvalid.colIndex
        simulate()
      }
    }
    function notConsumed(){
      fieldNav.keyboardEvent.cancelBubble = true
      fieldNav.keyboardEvent.preventDefault()
    }
    function simulate() : boolean {
      if ((field.rowIndex === nextRowIndex) && (field.colIndex === nextColIndex))
        return false
      component.simulateMouse('click', component.getCellAt(nextRowIndex, nextColIndex))    
      return true
    }    
    function gotoNext() : boolean {
      while (++nextColIndex < component.fieldMetadata.length) // go to the next editable field
        if (component.fieldMetadata[nextColIndex].editable) break
      if (nextColIndex < component.fieldMetadata.length){
        simulate()
        return true
      }
      --nextColIndex  // cursor on the last field (not editable) 
      return false
    }
    function gotoPrev() : void {
      while (--nextColIndex >= 0)  // go to the previous editable field
        if (component.fieldMetadata[nextColIndex].editable) break
      if (nextColIndex < 0)         //restore the columnindex. we don't go to the end of the List
        nextColIndex = field.colIndex
      if (nextColIndex !== field.colIndex)
        simulate()
    }
    async function carriageReturn() : Promise<void> {
      function CRLF() {
        if ( (nextRowIndex + 1) == component.dataSource?.data.length) // end of datasource?
          component.addRowRequest.next(nextRowIndex+1) // add a new Record to the datasource and recordset
        else { 
          nextRowIndex++
          nextColIndex = -1
          gotoNext()
        }
      }
      if (component.isErrorMode) 
        return  
      if (field.data.isDirty) {
        if (await field.data.validate()) {
          component.saveRowRequest.next( { 
            pageData : field.data, 
            afterSavedObserver : {
              error   : err => onError(),
              complete : CRLF 
            }
          })  
        }
      }
      else  CRLF()
    }
    async function onArrow(onComplete: () => void){
      if (component.isErrorMode) 
        return 
      if ( field.data.isDirty ) {
        if(await field.data.validate()) {
          component.saveRowRequest.next({ 
            pageData : field.data, 
            afterSavedObserver : {
              error : (err) => onError(),
              complete : () => onComplete()
            }
          })
        }
        else onError()
      } 
      else onComplete()
    }
    // ----------------------------
    switch (key){
      case "ArrowDown"  : onArrow( () => {
          if ( (nextRowIndex+1) < this.assertDataSource.data.length || 0){
            nextRowIndex++ 
            simulate()
          }
        }) 
        break
      case "ArrowUp" : onArrow( () => {
          if ( (nextRowIndex-1) >= 0) {
            nextRowIndex--
            simulate()
          }
        })
        break
      case "Enter"      : 
        await carriageReturn() 
        break
      case "Tab"        : 
        if (fieldNav.keyboardEvent.shiftKey)
          gotoPrev()
        else 
          if (!gotoNext()) 
            await carriageReturn() 
        break
        
    } //switch

  }
    /**
    * Helpers
    */
  private simulateMouse(clickEvent : string, element:HTMLTableCellElement){
    var evt = new MouseEvent(clickEvent, {
      bubbles : true, cancelable : true, view : window
    })
    element?.dispatchEvent(evt)
  }
  private getCellAt(rowIndex : number, columnIndex : number) : HTMLTableCellElement {
    var row = $(this.tableElement as HTMLTableElement).find("tr")[rowIndex+1]
    var cell = $(row).find("td")[columnIndex]
    return cell
  }

  /**
   * Handles the click-event on a row. 
   * if all cells are in VIEWmode and an editable field was clicked, this handler is called AFTER the editable has switched to editmode. 
   * if a field is in EDITmode, this clickhandler is called BEFORE the editable-clickhandler
   * @param row 
   */
  onRowClick(row : ListRow<any>, rowIndex : number): void {
   // info(`--> onRowClick(index: ${rowIndex}) [EditMode: ${this.isEditMode}] [IsDirty: ${this.isRowDirty(rowIndex)}] [Keys: ${this.shiftPressed?'Shift':''}  ${this.ctrlPressed?'Ctrl':''}]`)
    if (this.isInsertMode){
      this.rowSelection.clear()
      this.rowSelection.select(row)
      return
    }
    if (this.shiftPressed && !this.ctrlPressed){
      if (this.rowSelection.hasValue()){ // select all between selected an rowIndex 
        var firstIndex, lastIndex
        if (this.rowSelection.isMultipleSelection()){
          this.rowSelection.sort( (a,b) => a.compare(b))
          firstIndex = this.rowSelection.selected[0].index
          lastIndex = this.rowSelection.selected[this.rowSelection.selected.length-1].index
        }
        else {
          firstIndex = lastIndex = this.rowSelection.selected[0].index
        }
        if ( firstIndex > rowIndex) // select above the first selected
          this.rowSelection.select(...this.assertDataSource.data.slice(rowIndex, firstIndex))
        else {
          if (lastIndex < rowIndex) // select below the last selected
            this.rowSelection.select(...this.assertDataSource.data.slice(lastIndex+1, rowIndex+1))
          else { // row to select is between the first and the last selected 
              // i think we ignore this
          }
        }
      }
      else { // nothing selected, we select all until the rowIndex
        this.rowSelection.select(...this.assertDataSource.data.slice(0, rowIndex+1))
      }
    }
    else {
      if (!this.shiftPressed && this.ctrlPressed){
        if (this.rowSelection.isSelected(row))
          this.rowSelection.deselect(row)
        else 
          this.rowSelection.select(row)
      }
     
      else {
        if (!this.shiftPressed && !this.ctrlPressed){
          this.rowSelection.clear()
          this.rowSelection.select(row)
        }
      }
    }
  }
 /**
   * Handels the hover-event and saves then mouseoverindex for the backgroundcolor
   * @param index 
   */
  onMouseover(index : number):void {
    this.mouseOverIndex = this.rowSelection.hasValue() ? -1 : index
  }
  

  /**
   * handels the key-events "ArrorDown", "ArrowUp", "Tab", Shift+Tab and "Enter" in editmode
   * @param key     the name of the keyboard-key 
   * @param currColIndex  the current columnIndex
   */
  getBackgroundColor(index : number){
    if (this.rowSelection.hasValue() && this.selectedRowIndices.includes(index)) 
      return colorSelected
    return this.mouseOverIndex == index? colorMouseOver : ((index & 1) == 0 ? colorEven : '')
  }


}

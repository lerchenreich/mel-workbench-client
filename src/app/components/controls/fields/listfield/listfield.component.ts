
import { Component, HostListener, ElementRef, EventEmitter, Input, TemplateRef, OnInit, AfterViewInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { filter, switchMapTo, take} from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { FieldTypes } from 'mel-common';
import { TranslateService } from '@ngx-translate/core';

import { Field} from '../field';
import { FieldTemplates, TemplateService } from 'src/app/template.service';
import { FieldContext, FieldNavigationEvent, RowChangedEvent} from 'src/app/components/core/types';
import { ListRow } from '../../../core/page-data';
import { EntityLiteral } from 'src/app/types';


export type NavigationKeys = 'Tab'|'ShiftTab'|'ArrowUp'|'ArrowDown'|'Enter' 
export type ShortcutKeys = 'F8'
export enum FieldModes  {'view', 'edit'}

@Component({
  selector: 'mel-list-field',
  template: `<ng-container *ngTemplateOutlet="currentTemplate;context:ctx"></ng-container>
  <span class="melError" [style.opacity]="errorText.length">{{errorText}}</span>`
})
@UntilDestroy()
export class ListFieldComponent extends Field implements OnInit, AfterViewInit {
  constructor(host: ElementRef,  
              translate : TranslateService, 
              templateService : TemplateService){  
    super(host, translate)
    this.editInput    = templateService.assertGet(FieldTemplates.listInput)
    this.editEnum     = templateService.assertGet(FieldTemplates.listEnum)
    this.editBoolean  = templateService.assertGet(FieldTemplates.listBoolean)
    this.viewBoolean  = templateService.assertGet(FieldTemplates.viewBoolean)
    this.viewEnum     = templateService.assertGet(FieldTemplates.viewEnum)
    this.viewInput    = templateService.assertGet(FieldTemplates.viewInput)
  }
  
  private editInput     : TemplateRef<any>
  private editBoolean   : TemplateRef<any>
  private editEnum      : TemplateRef<any>
  private viewBoolean   : TemplateRef<any>
  private viewInput     : TemplateRef<any>
  private viewEnum      : TemplateRef<any>

  private tdElement : HTMLElement | null = null
  private trElement : HTMLElement | null = null
  private editMode = new Subject()
  private editMode$ = this.editMode.asObservable() 
  private _mode: FieldModes = FieldModes.view 
  private _type? : FieldTypes

  initializationEmitter = new EventEmitter<ListFieldComponent>()
  navigationEmitter     = new EventEmitter<FieldNavigationEvent>()
  rowChangedEmitter     = new EventEmitter<RowChangedEvent>()

  public get rowIndex(): number { return this.data.index }
  protected get mode() { return this._mode }
  protected set mode(value : FieldModes ) {
    if (value !== this._mode){ 
      console.log(`${this.toString()} --> ${this.prettyMode(value)}`)
      this._mode = value
    }
  }
  get currentTemplate() : TemplateRef<any> {
    if (this.mode === FieldModes.view || !this.editable){
      switch(this._type) {
        case FieldTypes.Boolean  : return this.viewBoolean
        case FieldTypes.Enum     : return this.viewEnum
        default : return this.viewInput
      }
    }
    switch(this._type) {
      case FieldTypes.Boolean  : return this.editBoolean
      case FieldTypes.Enum     : return this.editEnum
      default : return this.editInput
    }
  }
  get inputValue() : string | boolean { 
    var inputElement 
    if (this._type == FieldTypes.Enum){
      const matSelect = $(this.assertRootElement).find('mat-select').get(0)
      inputElement = matSelect?.attributes.getNamedItem('ng-reflect-model') as unknown as HTMLInputElement
    } 
    else 
      inputElement = $(this.assertRootElement).find('input').get(0) as HTMLInputElement
    if (inputElement == undefined){
      throw new Error(`InputElement for ${this.toString()} is undefined`)
    }
    return inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value
  }
  /**
   * Listen to the TabKey- and Delete-Event and notify about after validation
   * @param event : KeyboardEvent
   */
  @HostListener('keydown', ['$event']) 
  onKeyDown(event : KeyboardEvent) {
    if (!event.defaultPrevented) {
      switch(event.key){
        case 'Tab':
          //this.inputvalueToPageData(this.inputValue)  
          this.navigationEmitter.next( { field : this, keyboardEvent : event})      
          event.preventDefault()
          break
        case 'Delete' : 
          if ((this.mode === FieldModes.edit) && (this._type != FieldTypes.Enum))
            event.cancelBubble = true
          break
      } 
    }
  }   /**
   * Listen to the ArrowUp-, ArrowDown- and Enter-Key-events and notify about after validation
   * Prevents default behaviour
   * @param event : KeyboardEvent
   */
  @HostListener('keyup', ['$event']) 
  onKeyUp(event : KeyboardEvent) {
    if (!event.defaultPrevented) {
      var consumed : boolean = true
      switch(event.key) {
        case 'ArrowUp'  :
        case 'ArrowDown': // note: the break is only for Enums 
          if (this._type === FieldTypes.Enum){
            consumed = false
            break 
          }
        case 'Enter'    :           
          //if (!this.afterInputChanged(this.inputValue))
          this.navigationEmitter.next({ field : this, keyboardEvent : event})    
          break
        case 'F8'       : this.shortcutEmitter.next({ field : this, keyboardEvent : event})
                          break
        default         : consumed = false
      } 
      if (consumed) { 
        event.preventDefault()
        event.cancelBubble = true
      }
    }
  }

  @Input() colIndex : number = -1         

  protected addContext(ctx : FieldContext<any>){
    super.addContext(ctx)
    if (ctx.initializationObs)
      this.initializationEmitter.pipe(untilDestroyed(this)).subscribe(ctx.initializationObs)
    if (ctx.navigationObs)
      this.navigationEmitter.pipe(untilDestroyed(this)).subscribe(ctx.navigationObs)
    if (ctx.rowChangedObs)
      this.rowChangedEmitter.pipe(untilDestroyed(this)).subscribe(ctx.rowChangedObs)
    
    this._type = ctx.meta?.type
    
    if (this._type == FieldTypes.Boolean)
      this.ctx.changedObs = { 
        next : async value => { 
          value = this.inputvalueToPageData(value)
          if(this.isDirty && await this.validate().catch(e => {})) 
              this.changedEmitter.next(value) 
        } 
      }
  }

  /**
   * Call the mode-handlers
   */
  ngOnInit(): void {
    //console.info(`${this.constructor.name}.OnInit.Field(${this.name})`)
    super.ngOnInit()
    this.tdElement = this.assertRootElement.parentElement
    while(this.tdElement && this.tdElement.nodeName != 'TD') 
      this.tdElement = this.tdElement.parentElement
    if (this.tdElement){
      this.trElement = this.tdElement.parentElement
      while(this.trElement && this.trElement.nodeName != 'TR') 
        this.trElement = this.trElement.parentElement
    }
    if (!this.trElement || !this.tdElement)
      throw new Error('tdElement of trElement undefined')
  }

  ngAfterViewInit() {
    //console.info(`${this.constructor.name}.AfterViewInit.Field(${this.name})`)
    if (this.editable){ 
      this.viewModeHandler()
      this.editModeHandler()
    }
    this.data.addFieldComponent(this)
    if (this.data.prepared)
      this.initializationEmitter.next(this)
  }

  /**
   * Listen for a td-click-event and switch to editmode if the field is editable
   */
//  private phases = ['none','capture', 'atTarget', 'bubbling'] 
      
  private viewModeHandler() {
    //listen to the <td>-click-event, because if the input-element is empty it's difficult to hit upon the element
    fromEvent(this.tdElement as HTMLElement, 'click') 
    .pipe( 
      //delay(1),
      untilDestroyed(this) )
    .subscribe( (event : Event) => {
      if (event.defaultPrevented) 
        return
      if (this.editable){
        this.mode = FieldModes.edit             // change to editmode
        this.editMode.next()    // and emit 
      }
    })
  }
  
 /**
   * Subscribe the editMode-event and map it to a click outside
   */
  private editModeHandler() {

    function targetRowId(child : HTMLElement) : number { 
      var parent = child as HTMLElement | null
      if (parent){
        do {
          if (parent.tagName === 'TABLE') break
          if (parent.tagName === 'TR')
            return Number(parent.id)
          parent = parent.parentElement
        } while (parent)
      }
      return -1
    }
    function targetColId(child : HTMLElement) : number { 
      var parent = child as HTMLElement | null
      if (parent){
        do {
          if (parent.tagName === 'TR') break
          if (parent.tagName === 'TD')
            return Number(parent.id)
          parent = parent.parentElement
        } while (parent)
      }
      return -1
    }
     
    // we capture the clicks, to avoid getting bubbling events, we need for the viewmodehandler
    const clickOutside$ = fromEvent(document, 'click', {capture : true, once : false}).pipe(
      //take(1),
      take(1),
      filter( event => { 
        if (event.defaultPrevented) 
          return false  
        const target = event.target as HTMLElement

        var outside =  !this.host.nativeElement.parentElement.contains(target)  // outside the cell AND
  //      console.log(`Click in row ${targetRowId(target)}, col ${targetColId(target)} is ${outside?'out':'in'}side of ${this.toString()}`)
            outside &&= (target.parentElement?.localName !== 'mat-option')                // not the select-clicks in the mat-select options
        return outside
      }),
    )
    const clickOutsideCheckbox$ = fromEvent(document, 'click', {capture : true, once : false}).pipe(
      filter( event => { 
        if (event.defaultPrevented) 
          return false  
        const target = event.target as HTMLElement
        var outside =  !this.host.nativeElement.parentElement.contains(target)  // outside the cell AND
        //console.log(`Click in row ${targetRowId(target)}, col ${targetColId(target)} is ${outside?'out':'in'}side of ${this.toString()}`)
        return outside
      }),
    )    
  
    this.editMode$.pipe(
      switchMapTo(this._type == FieldTypes.Boolean ? clickOutsideCheckbox$ :  clickOutside$),
      untilDestroyed(this)
    )
    .subscribe( async (event : Event) => { 
      const value = this.inputvalueToPageData(this.inputValue)
      if (this.wasTouched || this.isDirty){
        if (await this.validate().catch(error =>  event.preventDefault())){
          if (this.wasTouched)
              this.touchedEmitter.next(this)
          if (this.isDirty &&  (this._type !== FieldTypes.Boolean)) // the checkbox fires the change after a click
            this.changedEmitter.next(value)
        }
        else {
          event.preventDefault()
          return
        }
      }
      //if clicked outside the row, we notify the list-component
      const newRowId = targetRowId(event.target as HTMLElement) 
      if ( newRowId !== this.rowIndex){
        this.rowChangedEmitter.next({
          newRowIndex : newRowId, 
          row :this.ctx.data as ListRow<any>, 
        })
        if (newRowId < 0)  //click outside the table
          event.preventDefault()
      }
      this.mode = FieldModes.view // and switch to viewMode
    }) 
  }

  // Helpers
  toString() : string {
    return `ListField (row:${(this.trElement  as HTMLElement).id}, col:${(this.tdElement as HTMLElement).id} Mode: ${this.prettyMode(this.mode)})`
  }
  prettyMode(mode : FieldModes) : string { return (mode==FieldModes.view?"view":"edit")+'mode'} 
  /** 
   * @param other 
   * Compares the component with another by comparing row- and columnindex
  */
  public equals(other : ListFieldComponent) : boolean{
    return (other.rowIndex == this.rowIndex) && (other.name === this.name)
  }
  /**
   * Determins, if an other component is in the same row
   * @param other 
   */
  public sameRow(other : ListFieldComponent) : boolean{
    return (other.rowIndex == this.rowIndex) 
  }

}

import { Component, Input, Output, HostBinding, ElementRef, Optional, Self, EventEmitter, Directive, OnDestroy } from '@angular/core';
import { MatDialog} from '@angular/material/dialog';
import { ControlValueAccessor, FormControl, FormGroup, NgControl } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y'
import *  as moment from 'moment'
import 'moment/locale/de';
import { isDate } from 'lodash' 

import { LookupDialogComponent} from '../../dialogs/lookup-dialog/lookup-dialog.component';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { LookupDialogData, ILookupDialogResult } from 'src/app/components/core/types';

/**
 * Lookupcontrol which provide a lookupfunctionallity an assist-button
 * Contains a mat-input-control, a button for looking up and select in a related table of the input
 * and a button for a custom assist-function
 * @attribute placeholder see matInput
 * @attribute required    see matInput
 * @attribute disabled    see input
 * @attribute [(ngModel)] see angular material
 * @attribute lookupFor   a string that describe for which "table.fieldname" we want to lookup for 
 * @attribute (assist)    an eventhandler who handles the assist-button-click
 * @attribute (change)    an eventhandler who handles the changes in the input-field
  */
@Directive()
abstract class LookupControl<T> implements MatFormFieldControl<T>, ControlValueAccessor, OnDestroy {
  abstract toValue(val : T) : T
  static nextId = 0
  input : FormControl = new FormControl('')
  stateChanges  : Subject<void> = new Subject<void>()
  focused       : boolean = false
  errorState    : boolean = false
  controlType   : string = 'lookup'
  autofilled    : boolean = true
  private _lookupForColumn : string[] //a splitter containing EntityName and ColumnName to lookup for
 
  inputElement : HTMLInputElement = undefined
  lookupButton : HTMLButtonElement = undefined
  assistButton : HTMLButtonElement = undefined
  
  constructor(private focusMonitor: FocusMonitor, 
              private elRef: ElementRef<HTMLElement>,
              private lookupDialog : MatDialog,
              public ngControl: NgControl
              ){ 
    //super()    
    if (this.ngControl !== null) this.ngControl.valueAccessor = this
    focusMonitor.monitor(elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }
  @HostBinding() id: string = `${this.controlType}${LookupControl.nextId++}`;
  @HostBinding('class.floating') get shouldLabelFloat() { return this.focused || !this.empty }
  @HostBinding('attr.aria-describedby') describedBy = '';

  @Input() 
  set value(val : T | null) { 
    this.input.setValue(this.toValue(val)) 
    this.stateChanges.next()
  }
  get value() : T | null { 
    return this.input.value
  }
  
  private _placeholder : string
  @Input('placeholder')
  set placeholder(ph) { 
    this._placeholder = ph ; 
    this.stateChanges.next()
  }
  get placeholder() { return this._placeholder }

  @Input()
  get lookupFor() : string { return this._lookupForColumn.join('.') }
  set lookupFor(lookupForColumn : string) {
    if ( lookupForColumn && (lookupForColumn.lastIndexOf('.') > 0) && ( !this._lookupForColumn || this._lookupForColumn.join('.') !== this.lookupFor) ){
      this._lookupForColumn = lookupForColumn.split('.', 2)
      this.stateChanges.next();
    }
  } 
  
  _required : boolean
  @Input() 
  get required() : boolean { return this._required }
  set required(req) { 
    this._required = coerceBooleanProperty(req) 
    this.stateChanges.next()
  }
  _disabled : boolean = false
  @Input()
  get disabled() : boolean { return this._disabled }
  set disabled( val ) {
    this._disabled = coerceBooleanProperty(val)
    if (this._disabled) this.input.disable(); else this.input.enable()
    //if(this.lookupButton) this.lookupButton.disabled = this.disabled
    //if(this.assistButton) this.assistButton.disabled = this.disabled 
    this.stateChanges.next()
  }
  get empty() : boolean { return this.input.value.length == 0 }
  
  setDescribedByIds(ids: string[]) {
    this.elRef.nativeElement.setAttribute('aria-describedby', ids.join(' '));
  }
  @Output() assist = new EventEmitter()

  ngAfterViewInit() {
    this.lookupButton = this.elRef.nativeElement.querySelector(`button#lookupButton`)
    if (this._lookupForColumn !== undefined)
      this.lookupButton.setAttribute('style', 'display:block') 
    this.assistButton = this.elRef.nativeElement.querySelector('button#assistButton')
    this.assistButton.setAttribute('style', `display:${this.assist.observers.length >0 ? 'block' : 'none'}`)
    this.inputElement = this.elRef.nativeElement.querySelector('input') 
  
  }
  onContainerClick(event: MouseEvent): void {
    if ((event.target as Element).tagName.toLowerCase() != 'input') {
      this.inputElement.focus();
    }
  }

  propagateChange = (_: any) => {}
  propagateTouched = () => {}

  //begin Implementation of ControlValueAccessor
  registerOnChange(fn : (val : T) => void) : void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn : () => void) : void {
    this.propagateTouched = fn
  }

  writeValue(value : T ){
    this.value =  value 
    this.propagateChange(value)
  }
  //end Implementation of ControlValueAccessor
  
 /**
   * called by manually changes
   * @param event 
   */
  onChange(event:any){
    event.stopPropagation(); //setter "value" emits to the parent
    var val = this.toValue(event.target.value)
    if (val !== this.input.value)
      this.input.setValue(val)
    this.propagateChange(val)
    this.stateChanges.next()
  //  this.change.emit(val) 
  }
  
  onLookup() {
      var lookupData : LookupDialogData = {
        lookupFor : { entity : this._lookupForColumn[0],  fieldName : this._lookupForColumn[1] },
        currValue : this.value
      }
      const dialogRef = this.lookupDialog.open(LookupDialogComponent, {data : lookupData});
      dialogRef.afterClosed().subscribe( lookupResult  => {
        const result = lookupResult as ILookupDialogResult
        if ( result.ok && (this.value !== result.selectedRow[result.key])){
          this.value = result.selectedRow[result.key]
        }
      });
  }
 
  assistButtonClicked(){
    this.assist.emit(this.value)
  }

  ngOnDestroy(){
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elRef.nativeElement);
  }
}


@Component({
  selector: 'code-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide:MatFormFieldControl, useExisting: CodeControlComponent }],
})
export class CodeControlComponent extends LookupControl<string> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm,elRef,lookupDialog,ngControl)  
  }            

  //get empty() : boolean { return this.value.length  === 0}
  toValue(val : string | null ) : string {
    return val? val.toUpperCase():''
  }
}

/**
 * Text-Input Control with lookup- and Assist-functionality
 */
@Component({
  selector: 'text-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide:MatFormFieldControl, useExisting: TextControlComponent }],
})
export class TextControlComponent extends LookupControl<string> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm,elRef,lookupDialog, ngControl)
   
  }            
  //get empty() : boolean { return this.value.length  === 0}
  
  toValue(val : string | null) : string {
    return val? val:''
  }
}
/**
 * Integer-Input-control with lookup- and assist-fuctionallity
 */

@Component({
  selector: 'int-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: IntegerControlComponent}],
})
export class IntegerControlComponent extends LookupControl<number> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm, elRef, lookupDialog, ngControl)  
  }            
  //get empty() : boolean { return true }
  toValue(val : number | null) : number {
    var number : number = Number(val)
    return number === NaN ? 0 : Math.trunc(number) 
  }
}
/**
 * decimal-Input-control with lookup- and assist-fuctionallity
 */

@Component({
  selector: 'dec-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: DecimalControlComponent}],
})
export class DecimalControlComponent extends LookupControl<number> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm, elRef, lookupDialog, ngControl) 
  
  }            
  //get empty(): boolean { return this.control.value === NaN }
  
  toValue(val : number | null) : number {
    var number : number = Number(val)
    return number === NaN ? 0 : Math.round(number/this.precision)*this.precision
  }

  _precision : number = 0.01
  @Input()
  get precision() : number { return this._precision}
  set precision(prec:number) { 
    prec = Math.abs(prec); 
    prec = prec < 0.000000000001? 0.000000000001 : this._precision = prec } 
}

@Component({
  selector: 'date-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: DateControlComponent}],
})
export class DateControlComponent extends LookupControl<Date> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm, elRef, lookupDialog, ngControl)   
  }            
  //get empty(): boolean { return !isDate(this.control.value) }
  
  toValue(val : string | Date | null) : Date {
    if (isDate(val))
      return val as Date
    if (typeof val === 'string'){
      var d = moment(val,'DD.MM.YYYY', 'de', false)
      if (d.isValid()) 
        return d.toDate()//.format('l')
    }
  }
}
@Component({
  selector: 'datetime-input',
  templateUrl: './lookup-control.component.html',
  styleUrls: ['./lookup-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: DateTimeControlComponent}],
})
export class DateTimeControlComponent extends LookupControl<Date> { 
  constructor(fm: FocusMonitor, 
              elRef: ElementRef<HTMLElement>,
              lookupDialog : MatDialog,
              @Optional() @Self() public ngControl: NgControl,
              ){ 
      super(fm, elRef, lookupDialog, ngControl)  
    }            
  //get empty(): boolean { return !isDate(this.control.value) }
    
  toValue(val : string | Date | null) : Date {
    return moment(val).toDate()  
  }
}


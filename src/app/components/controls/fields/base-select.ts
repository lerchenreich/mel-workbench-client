import { Directive, ElementRef, EventEmitter, HostBinding, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { untilDestroyed } from '@ngneat/until-destroy';
import { NextObserver } from 'rxjs';
import { FieldMetadata } from '../../../types';

import { MelElement } from './element';

@Directive()
export class BaseSelectComponent extends MelElement {
 
  constructor(host: ElementRef) {
    super(host)
  }
  static nextId : number = 1
  controlType  = 'mel-select'

  enumValues : string[]
  dispEnumValues : string[]
  
  protected inputChange = new EventEmitter()
  
  @HostBinding() id: string = `${this.controlType}${BaseSelectComponent.nextId++}`
  @Input() value : any
  @Input() set options( meta : FieldMetadata<any>){
    this.enumValues = meta.enumValues
    this.dispEnumValues = meta.display.enumValues? meta.display.enumValues : meta.enumValues  
  }
  @Input() set changedObs( obs : NextObserver<string>){
    if(obs )
      this.inputChange.pipe(untilDestroyed(this)).subscribe(obs) 
  }
   
  onSelectionChange(event : MatSelectChange) {
    this.inputChange.next(event.value)
  }
  
}

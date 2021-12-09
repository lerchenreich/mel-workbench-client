import { Directive, ElementRef, EventEmitter, HostBinding, Input, OnInit} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { untilDestroyed } from '@ngneat/until-destroy';
import { NextObserver } from 'rxjs';
import { MelElement } from './element';

@Directive()
export class BaseCheckboxComponent extends MelElement implements OnInit {
 
  constructor(host: ElementRef) { 
    super(host)
  } 
  static nextId : number = 1
  controlType  = 'mel-checkbox'
  protected inputElement : HTMLInputElement
  protected inputChange = new EventEmitter<any>()
  
  @Input() value : any
  @Input() editable : boolean
  @Input() set changedObs(obs : NextObserver<string|boolean>){
    if(obs)
      this.inputChange.pipe(untilDestroyed(this)).subscribe(obs) 
  }
  @HostBinding() id: string = `${this.controlType}${BaseCheckboxComponent.nextId++}`
  
  ngOnInit(){
    this.inputElement = this.host.nativeElement.querySelector('input')
  }
  
  onChange(event : MatCheckboxChange) {
    this.inputChange.next(event.checked)
  }

}
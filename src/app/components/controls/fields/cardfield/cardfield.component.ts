import { Component, Input, HostBinding, ElementRef,TemplateRef, OnInit, AfterViewInit } from '@angular/core';

import { Field } from '../field';
import { TranslateService } from '@ngx-translate/core';
import { FieldTypes } from 'mel-common';
import { FieldTemplates, TemplateService } from 'src/app/template.service';
import { FieldContext } from 'src/app/components/core/types';
import { NextObserver } from 'rxjs';
var $ = require('jquery')
@Component({
  selector: 'mel-card-field',
  template: `<ng-container *ngTemplateOutlet="currentTemplate;context:ctx">
  </ng-container>
  <mat-hint class="melHint" [style.margin-bottom]="'2em'" [style.opacity]="hint.length">{{hint}}</mat-hint>
  
  <span class="melError" [style.margin-bottom]="'1em'"  [style.opacity]="errorText.length">{{errorText}}</span>`,
})
export class CardFieldComponent extends Field<any> implements OnInit, AfterViewInit {

  constructor(host: ElementRef<HTMLElement>, 
              public translate : TranslateService, 
              protected templateService : TemplateService){ 
    super(host, translate)  
    this.cardInput = templateService.get(FieldTemplates.cardInput)
    this.cardBoolean = templateService.get(FieldTemplates.cardBoolean)
    this.cardEnum = templateService.get(FieldTemplates.cardEnum)
  }
  controlType   : string = 'cardField'
  cardInput     : TemplateRef<any>
  cardBoolean   : TemplateRef<any>
  cardEnum      : TemplateRef<any>

  protected inputElement : HTMLInputElement = undefined

  @HostBinding() id: string = `${this.controlType}${Field.nextId++}`;
 
  //todo: durch directive ersetzen
  @Input() outlineClass : string = 'form-outline' 
  get controlTypeClass() : string { return 'form-control'} //form-control[-lg|-sm]
  
  @Input()
  set caption(c : string) { this.ctx.caption = c}
  get caption() : string { return this.ctx.caption }
  
  @Input()
  set hint(h : string) { this.ctx.hint = h}
  get hint() : string { return this.ctx.hint || ''}
  
  @Input()
  set assistObs(obs : NextObserver<Field<any>>) { this.ctx.assistObs = obs}

  ngOnInit() {
    super.ngOnInit()
    this.inputElement = $(this.rootElement).find('input')?.get(0)
  }

  ngAfterViewInit() {

  }
  get currentTemplate() : TemplateRef<any> {
    switch(this.ctx.meta.type) {
      case FieldTypes.Boolean  : return this.cardBoolean
      case FieldTypes.Enum     : return this.cardEnum
      default : return this.cardInput
    }
  }
 
  protected addContext(ctx : FieldContext<any>){
    super.addContext(ctx)
    this.ctx.changedObs =  {
      next : async (value) => {
        if (value !== undefined){
          value = this.inputvalueToPageData(value)
          if (this.wasTouched || this.isDirty){
            if (await this.validate().catch(e=>{})){ 
              if (this.wasTouched)
                this.touchedEmitter.next(this)
              if (this.isDirty)
                this.changedEmitter.next(value)
            }
          }
        }
      }
    }
    this.ctx.caption = this.caption || ctx.meta.display.caption
  }

}

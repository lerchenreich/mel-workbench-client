import { Injectable, TemplateRef } from '@angular/core';

export enum FieldTemplates {  
  viewInput,    cardInput,    listInput, 
  viewBoolean,  cardBoolean,  listBoolean, 
  viewEnum,     cardEnum,     listEnum
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  templates = new Map<FieldTemplates, TemplateRef<any>>()
  constructor() { }
  clear() {
    this.templates.clear()
  }
  add(name : FieldTemplates, ref : TemplateRef<any>){
    this.templates.set(name, ref)
  }
  get(name : FieldTemplates) { return this.templates.get(name)}
}

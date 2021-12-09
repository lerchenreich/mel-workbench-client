import { EventEmitter, ElementRef, Input, OnInit, Directive} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';

import * as $ from 'jquery'

import { InputSubType } from '../../../types';
import { FieldContext, FieldShortcutEvent } from '../../core/types';

/**
 * Inputs and validation of all fields
 */
@Directive()
@UntilDestroy()
export class Field<Entity> implements OnInit {
  constructor(protected host: ElementRef, 
    public translate : TranslateService){  
  }
  static nextId = 0
  
  protected rootElement : HTMLElement
  protected valid : boolean = true
  protected touched : boolean = false
  public ctx : FieldContext<Entity> = {
    editable : true
  }
  // the errortext to be displayed
  private _errorText  : string = ''
  public get errorText() : string { 
    return this._errorText.slice(1) 
  }

  assistEmitter     = new EventEmitter<Field<Entity>>()
  shortcutEmitter   = new EventEmitter<FieldShortcutEvent>()
  touchedEmitter    = new EventEmitter<Field<Entity>>()
  changedEmitter    = new EventEmitter<string|boolean>()

  public get name() : string { return this.ctx.meta.name as string}
  public get data() : Entity { return this.ctx.data as unknown as Entity}
  public get isValid() : boolean { return this.valid }
  public get isDirty() : boolean { return this.ctx.data.isFieldDirty(this.name as keyof Entity) }
  public get wasTouched() : boolean { return this.touched }
  public get validationRec() : Entity { return this.ctx.data.validationRec }

  @Input() set context(ctx : FieldContext<Entity>) { // from MelListComponent
    this.ctx.value = ctx.data[ctx.meta.name as string]
    this.ctx.editable = !!ctx.meta.editable && (this.ctx.editable === undefined?true: this.ctx.editable)
    if (!this.ctx.meta){          // only at the first input
      this.addContext(ctx)
    }
  }
  // Inputs whcih overwrites the context
  @Input() 
  set editable(b : boolean) { this.ctx.editable = (b==undefined?true:b) && (this.ctx.meta? this.ctx.meta.editable : true) } 
  get editable() : boolean  { return this.ctx.editable }
 
  @Input() 
  set subType(s : InputSubType) { this.ctx.subType = s }
  get subType() { return this.ctx.subType }

  
  @Input()
  set lookupFor(lookupFor : string) {
    if ( lookupFor.lastIndexOf('.') > 0  ){
      [this.ctx.lookupFor.entity, this.ctx.lookupFor.fieldName] = lookupFor.split('.', 2)
    }
  } 
  
  private addErrorText(text:string){
    this._errorText += `;${text}`
  }
 
  private clearError() {
    this._errorText = ''
  }
  protected addContext(ctx : FieldContext<any>){
    if (ctx.assistObs)
      this.assistEmitter.pipe(untilDestroyed(this)).subscribe(ctx.assistObs)
    if (ctx.shortcutObs)
      this.shortcutEmitter.pipe(untilDestroyed(this)).subscribe(ctx.shortcutObs)
    if (ctx.changedObs) 
      this.changedEmitter.pipe(untilDestroyed(this)).subscribe(ctx.changedObs)
    if (ctx.touchedObs) 
      this.touchedEmitter.pipe(untilDestroyed(this)).subscribe(ctx.touchedObs)

    this.ctx.meta = ctx.meta
    this.ctx.data = ctx.data
    this.ctx.subType = this.subType || ctx.meta.display.subType
    
    this.ctx.data.addFieldComponent(this)
}

  ngOnInit() : void {
    this.rootElement = this.host.nativeElement
  }
  
  /**
   * takes the inputvalue complete it and put it into then PageData-Object
   * set the touchedflag to true
   * @param value the value to be checked
   * 
   */
  inputvalueToPageData(value : boolean | string) : string {
    if (value !== undefined) {
      const meta = this.ctx.meta
      // first we have to autocomplete, to validate the correct values (wysiwyg)
      if (typeof value === 'string'){
        if (meta.autocomplete) 
          value = meta.autocomplete(value)
      }
      else 
        value = value ? '1' : '0' // boolean
      this.touched = this.ctx.data[meta.name as string] !== value
      this.ctx.data[meta.name as string] = value
      const parsedValue = meta.parse? meta.parse(value) : value
      this.validationRec[meta.name as string] = parsedValue
    }
    return value as string
  }


  /**
   * Validates the value in the validation-record and sets the errortexts of the field 
   * return : true if valid
  */
  public async validate(silent : boolean = false) : Promise<boolean> {
    const rejectHandler = reason => ({ status: 'rejected', reason })
    const resolveHandler = value => ({ status: 'fulfilled', value })
    function allSettled (promises : Promise<any>[]) {
      const convertedPromises = promises.map(p => Promise.resolve(p).then(resolveHandler, rejectHandler));
      return Promise.all(convertedPromises);
    }
    const meta = this.ctx.meta
    const vRec = this.validationRec
    this.valid = true
    this.clearError()

    return new Promise<boolean>( (resolve, reject) => {
      if (meta.validators){
        try{
          allSettled(meta.validators.map(validator => validator(vRec[meta.name], vRec)))
          .then( results => {
            results.forEach(result => {
              if(result.status == 'rejected'){
                if (!silent){
                  var reason = (result as {status:string, reason:any}).reason
                  if (typeof reason === 'string')
                    this.translate.get(reason).subscribe(translation => this.addErrorText(translation))
                  else {
                    if (typeof reason === 'object'){
                      if (reason.key && reason.ctx)
                        this.translate.get(reason.key, reason.ctx).subscribe( translation => this.addErrorText(translation))
                      else if (reason.message)
                        this.addErrorText(reason.message)
                      this.addErrorText(JSON.stringify(reason))
                    }
                  }
                }
                this.valid = false
              }
            }) // forEach
            resolve(this.isValid) 
          }) // then
        }
        catch( error ) { reject(error)}
      } 
      else 
        resolve(true)
    })
  }

}

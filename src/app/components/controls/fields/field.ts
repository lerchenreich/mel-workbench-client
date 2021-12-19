import { EventEmitter, ElementRef, Input, OnInit, Directive} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';

import * as $ from 'jquery'

import { EntityLiteral, FieldMetadata, InputSubType, ObjectLiteral } from '../../../types';
import { PageData } from '../../core/page-data';
import { FieldContext, FieldShortcutEvent, LookupFor } from '../../core/types';

/**
 * Inputs and validation of all fields
 */
@Directive()
@UntilDestroy()
export class Field implements OnInit {
  constructor(protected host: ElementRef, 
    public translate : TranslateService){  
  }
  static nextId = 0
  
  protected rootElement? : HTMLElement
  protected get assertRootElement() : HTMLElement { 
    if (this.rootElement) 
      return this.rootElement; 
    throw new Error('rootElement is undefined')
  }
  protected valid : boolean = true
  protected touched : boolean = false
  public ctx : FieldContext<EntityLiteral> = {
    editable : true
  }
  // the errortext to be displayed
  private _errorText  : string = ''
  public get errorText() : string { 
    return this._errorText.slice(1) 
  }

  assistEmitter     = new EventEmitter<Field>()
  shortcutEmitter   = new EventEmitter<FieldShortcutEvent>()
  touchedEmitter    = new EventEmitter<Field>()
  changedEmitter    = new EventEmitter<string|boolean>()

  public get name() : string { return this.ctx.meta?.name as string}
  public get data() : PageData<EntityLiteral, Field> { return this.ctx.data as PageData<EntityLiteral, Field>}
  public get isValid() : boolean { return this.valid }
  public get isDirty() : boolean { return !!this.ctx.data?.isFieldDirty(this.name) }
  public get wasTouched() : boolean { return this.touched }
  public get validationRec() : EntityLiteral { if (this.ctx.data) return this.ctx.data.assertVRec; throw new Error('ctx.data is undefined!')}

  @Input() set context(ctx : FieldContext<EntityLiteral>) { // from MelListComponent
    if (ctx.data && ctx.meta){
      this.ctx.value = ctx.data[ctx.meta.name as string]
      this.ctx.editable = !!ctx.meta.editable && (this.ctx.editable === undefined?true: this.ctx.editable)
    }
    if (!this.ctx.meta){          // only at the first input
      this.addContext(ctx)
    }
  }
  // Inputs which overwrite the context
  @Input() 
  set editable(b : boolean) { this.ctx.editable = (b==undefined?true:b) && (this.ctx.meta? this.ctx.meta.editable : true) } 
  get editable() : boolean  { return this.ctx.editable || false}
 
  @Input() 
  set subType(s : InputSubType) { this.ctx.subType = s }
  get subType() : InputSubType { return this.ctx.subType || "none" }

  
  @Input()
  set lookupFor(lookupFor : string) {
    if ( lookupFor.lastIndexOf('.') > 0  ){
      if (!this.ctx.lookupFor)
        this.ctx.lookupFor = { entity : '', fieldName : ''};
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
    this.ctx.subType = this.subType || ctx.meta?.display?.subType
    
    this.ctx.data?.addFieldComponent(this)
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
      const meta = this.ctx.meta as FieldMetadata<EntityLiteral>
      // first we have to autocomplete, to validate the correct values (wysiwyg)
      if (typeof value === 'string'){
        if (meta.autocomplete) 
          value = meta.autocomplete(value)
      }
      else 
        value = value ? '1' : '0' // boolean
      const ctxData = this.ctx.data as PageData<EntityLiteral, Field>
      this.touched = ctxData[meta.name as string] !== value
      ctxData[meta.name as string] = value
      const parsedValue = meta.parse? meta.parse(value) : value  as any;
      ctxData.assertVRec[meta.name as string] = parsedValue
    }
    return value as string
  }


  /**
   * Validates the value in the validation-record and sets the errortexts of the field 
   * return : true if valid
  */
  public async validate(silent : boolean = false) : Promise<boolean> {

    const rejectHandler = (reason : any) => ({ status : 'rejected', reason : reason})
    const resolveHandler = (value : any) => ({ status : 'resolved', value : value })
    function allSettled (promises : Promise<any>[]) {
      const convertedPromises = promises.map(p => Promise.resolve(p).then(resolveHandler, rejectHandler));
      return Promise.all(convertedPromises);
    }
    const meta = this.ctx.meta
    const vRec = this.validationRec
    this.valid = true
    this.clearError()

    return new Promise<boolean>( (resolve, reject) => {
      if (meta?.validators){
        try{
          allSettled(meta.validators.map(validator => validator(vRec[meta.name as string], vRec)))
          .then( results => {
            results.forEach(result => {
              if(result.status == 'rejected'){
                if (!silent){
                  var reason = (result as {status:string, reason : any}).reason
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

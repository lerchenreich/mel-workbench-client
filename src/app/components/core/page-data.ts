import { CardFieldComponent } from '../controls/fields/cardfield/cardfield.component'
import { ListFieldComponent } from '../controls/fields/listfield/listfield.component'
import { Field }              from '../controls/fields/field'
import { EntityLiteral, FieldsMdMap, ObjectLiteral } from '../../types'



/**
 * Baseclass of Page-Data as an interface between the user-in- and outputs and the entityservice
 * It contains the data 
 * - to be displayed as object-properties (datasource)            (pretty format, string)
 * - a validation-record for validation-tasks           (vRec)    (java-type )
 * - a recordreference to the entityservice             (xRec)    (java-type )
 * - a status-column to display the status "new" and "dirty"
 * and the field-componenent corresponding to the datafields
 * A datafield is dirty, when the value of the validation-record is different to the xRec
 */
export abstract class PageData<Entity extends EntityLiteral, FieldComponent extends Field> extends ObjectLiteral {
  private _prepared : boolean = false
  private _new : boolean = false
  
  constructor(entity : Entity, fieldMd : FieldsMdMap){
    super()
    //this.xRecRef = entity
    for(let [key, value] of Object.entries(entity)) {
      const md = fieldMd.get(key)
      if (md)
        this[key] = (value === undefined? md.default||'' : md.format? md.format(value) : value)
    }
    this.validationRec = entity
  }

  abstract get fieldComponents() : Iterable<FieldComponent>
  abstract addFieldComponent(item : FieldComponent) : PageData<Entity, FieldComponent>

  public static readonly statusColumn = "__status__" 
  public get __status__() : string { return (this.isNew ? '*' : '') + (this.isDirty ? '*' : '') }

  // This record is only used for validation
  protected _vRec? : EntityLiteral
  public get assertVRec(): EntityLiteral { if (this._vRec) return this._vRec; throw new Error('_vRec is undefined')}  
  protected _xRecRef? : EntityLiteral
  protected get assertXRecRef(): EntityLiteral { if (this._xRecRef) return this._xRecRef; throw new Error('_XRecRef is undefined')}  
  get validationRec() : EntityLiteral|undefined { return this._vRec }
  set validationRec(rec : EntityLiteral|undefined) { 
    this._vRec = Object.assign({}, rec)
    this._xRecRef = rec
  }
  
  isFieldDirty(fieldName : string) : boolean {
    return !Object.is(this.assertVRec[fieldName], this.assertXRecRef[fieldName])
  }
  public clearDirty() {
    this._new = false
    this.prepared = false
    Object.assign(this._xRecRef, this._vRec )
  }
  public get prepared() : boolean { return this._prepared }
  public set prepared(value : boolean) { this._prepared = value}
  public get isNew() : boolean { return this._new }
  public setNew() { this._new = true }

  async validate(silent : boolean = false) : Promise<boolean> {
    return new Promise( async (resolve, reject) => {
      var isValid = true
      for(let field of this.fieldComponents){
        if (!await field.validate(silent).catch(error => reject(error)))
          isValid = false
      }
      resolve(isValid)
    })
  }
  public get index() { return -1 }
  public get isDirty() : boolean { 
    return Array.from(this.fieldComponents).some( item => this.assertVRec[item.name] !== this.assertXRecRef[item.name]) 
  } 
 
  public get isValid() : boolean { return Array.from(this.fieldComponents).every( field => field.isValid ) }
  public get firstInvalid() : FieldComponent | undefined { return Array.from(this.fieldComponents).find(field => !field.isValid) }

  public isDirtyAndValid() :boolean {
    return this.isDirty && this.isValid//.validate()
  }
}
/**
 * This class takes the fields of the Card, especially the CardFieldcomponent
 */
export class CardData<Entity extends EntityLiteral> extends PageData<Entity, CardFieldComponent> {
  private fields = new Map<string, CardFieldComponent>() 
  get fieldComponents() : Iterable<CardFieldComponent> { return this.fields.values()}
  addFieldComponent(field : CardFieldComponent){
    this.fields.set(field.name, field)
    return this
  }
}
/**
 * This class take the fields of a row in a list
 */
export class ListRow<Entity extends EntityLiteral> extends PageData<Entity, ListFieldComponent>{
  private _index : number

  private cells : ListFieldComponent[] = []
  get fieldComponents() : Iterable<ListFieldComponent> { return this.cells}
  
  constructor(entity : Entity, fieldMd : FieldsMdMap, index : number){
    super(entity, fieldMd)
    this._index = index
  }
  
  addFieldComponent(field : ListFieldComponent){
    this.cells.push(field)
    return this
  }

  public get index() { return this._index }
  public incrementIndex() { this._index++ }
  public get firstInvalidIndex() : number { 
    return this.firstInvalid?.colIndex || -1 
  }

  public compare(other : ListRow<Entity>) : number {
    if (this._index < other.index) return -1
    return (this._index > other.index) ? 1 : 0
  } 

}
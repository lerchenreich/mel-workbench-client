import { CardFieldComponent } from '../controls/fields/cardfield/cardfield.component'
import { ListFieldComponent } from '../controls/fields/listfield/listfield.component'
import { Field } from '../controls/fields/field'
import { FieldMetadata } from '../../types'

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
export abstract class PageData<Entity, Component extends Field<Entity>> {
  private _prepared : boolean
  private _new : boolean
  
  constructor(entity : Entity, colMetadata : Map<keyof Entity, FieldMetadata<Entity>>){
    //this.xRecRef = entity
    for(let [key, value] of Object.entries(entity)) {
      const md = colMetadata.get(key as keyof Entity)
      if (md)
        this[key] = value === undefined? md.default : md.format(value)
    }
    this.validationRec = entity
  }

  abstract get fieldComponents() : Iterable<Component>
  abstract addFieldComponent(item : Component)

  public static readonly statusColumn = "__status__" 
  public get __status__() : string { return (this.isNew ? '*' : '') + (this.isDirty ? '*' : '') }

  // This record is only used for validation
  protected _vRec : Entity = undefined
  protected _xRecRef : Entity = undefined
  get validationRec() : Entity { return this._vRec }
  set validationRec(rec : Entity) { 
    this._vRec = Object.assign({}, rec)
    this._xRecRef = rec
  }
  
  isFieldDirty(fieldName : keyof Entity) : boolean {
    return !Object.is(this._vRec[fieldName], this._xRecRef[fieldName])
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
    return Array.from(this.fieldComponents).some( item => this._vRec[item.name] !== this._xRecRef[item.name]) 
  } 
 
  public get isValid() : boolean { return Array.from(this.fieldComponents).every( field => field.isValid ) }
  public get firstInvalid() : Component { return Array.from(this.fieldComponents).find(field => !field.isValid) }

  public isDirtyAndValid() :boolean {
    return this.isDirty && this.isValid//.validate()
  }
}
export class CardData<Entity> extends PageData<Entity, CardFieldComponent> {
  private fields = new Map<keyof Entity, CardFieldComponent>() 
  get fieldComponents() : Iterable<CardFieldComponent> { return this.fields.values()}
  addFieldComponent(field : CardFieldComponent){
    this.fields.set(field.name as keyof Entity, field)
  }

}
export class ListRow<Entity> extends PageData<Entity, ListFieldComponent>{
  private _index : number

  private cells : ListFieldComponent[] = []
  get fieldComponents() : Iterable<ListFieldComponent> { return this.cells}
  
  constructor(entity : Entity, colMetadata : Map<keyof Entity, FieldMetadata<Entity>>, index : number){
    super(entity, colMetadata)
    this._index = index
  }
  
  addFieldComponent(field : ListFieldComponent){
    this.cells.push(field)
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
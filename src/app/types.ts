import { ValidationFunc, BaseFieldMetadata, ColumnMetadata } from 'mel-common'

export declare type InputType = 'text' | 'text-area'
export declare type InputSubType = 'none'|'text'|'email'|'number'|'password'|'tel'|'url'

export declare type  EntityDataTypes = string|number|bigint|boolean|Date
export class ObjectLiteral { [key : string] : any }
export class EntityLiteral      { [key : string] : EntityDataTypes | undefined }
export class EntityListLiteral extends EntityLiteral { [key : symbol] : number }

export enum EntityTypes  {'unknown', 'view', 'table'}
//export enum ColumnDisplay {Customized = 0x01, Lookup = 0x02, Sublist = 0x04, Everywhere = 0xFF}
export declare type Range = { from : number, until? : number}
export interface DisplayedFields {
  default? :  string[] 
  part? :     string[] 
  lookup? :   string[] 
}

export declare type FieldTableRelation<Entity extends EntityLiteral> = {
  RelatedTableName: string
  RelatedFieldName: string
  condition?: { [P in keyof Entity]?: any }
}
export interface FieldMetadata<Entity extends EntityLiteral> extends BaseFieldMetadata {
  name? : string
  isGenerated?: boolean        // autoincrement  
  enumValues?: string[]
  default?: EntityDataTypes | Function
  tableRelation?: FieldTableRelation<EntityLiteral>
  editable?: boolean
  validators?: ValidationFunc<Entity>[]
  autocomplete?: (value: string) => string
  format?: (value: any) => string
  formatString?: string

  apiToJavaType?: (value: any) => EntityDataTypes
  parse?: (value: any) => EntityDataTypes
  javaToApiType?: (value: any) => string | number
  display? : {
    type?: InputType
    subType?: InputSubType
    doNotTranslate?: true
    enumValues?: string[]
    caption?: string
    hint? : string
  }
}
export declare type FieldInfo = ColumnMetadata & { PrimaryKeyNo? : number }

export declare type FieldsMdMap = Map<string, FieldMetadata<EntityLiteral>>
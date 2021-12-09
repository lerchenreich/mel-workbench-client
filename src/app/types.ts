import { ValidationFunc, BaseFieldMetadata } from "mel-common/types"
import { ColumnMetadata } from 'mel-common/api'
export declare type InputType = 'text' | 'text-area'
export declare type InputSubType = 'text'|'email'|'number'|'password'|'tel'|'url'

export declare type ObjectLiteral = { [key: string]: any }

export enum EntityTypes  {'unknown', 'view', 'table'}
//export enum ColumnDisplay {Customized = 0x01, Lookup = 0x02, Sublist = 0x04, Everywhere = 0xFF}

export interface DisplayedColumns<Entity> {
  default? : (keyof Entity)[] 
  part? : (keyof Entity)[] 
  lookup? : (keyof Entity)[] 
}

export declare type ColumnTableRelation<Entity> = {
  RelatedTableName: string
  RelatedFieldName: string
  condition?: { [P in keyof Entity]?: any }
}
export interface FieldMetadata<Entity> extends BaseFieldMetadata {
  name? : keyof Entity
  isGenerated?: boolean        // autoincrement  
  enumValues?: string[]
  default?: string | number | Date | boolean | Function
  tableRelation?: ColumnTableRelation<Entity>
  editable?: boolean
  validators?: ValidationFunc<Entity>[]
  autocomplete?: (value: string) => string
  format?: (value: any) => string
  formatString?: string

  apiToJavaType?: (value: any) => string | number | Date | boolean | undefined
  parse?: (value: any) => string | number | Date | boolean | undefined
  javaToApiType?: (value: any) => string | number | undefined
  display? : {
    type?: InputType
    subType?: InputSubType
    doNotTranslate?: true
    enumValues?: string[]
    caption?: string
    hint? : string
  }
}
export class ColumnInfo extends ColumnMetadata {
  PrimaryKeyNo? : number
}

var pluralize = require('pluralize');
import 'reflect-metadata'
import * as moment from 'moment'
import 'moment/locale/de'
import { isBoolean } from 'lodash'
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';

import { FieldTypes, MelFieldClasses, ValidationFunc, parseNumber, parseBoolean, parseDate, parseDateTime, parseTime, validateInteger, validateDecimal, validateDate, validateDateTime, validateTime, validateBoolean, validationKey } from 'mel-common';
import { DisplayedColumns, EntityTypes, FieldMetadata } from '../types'

const ENTITY_METADATA_KEY = 'mel:entity'
const COLUMN_METADATA_KEY = 'mel:column'
/*
export declare type InputType = 'text' | 'text-area'
export declare type InputSubType = 'text'|'email'|'number'|'password'|'tel'|'url'

export declare type ColumnTableRelation<Entity> = {
  RelatedTableName: string
  RelatedFieldName: string
  condition?: { [P in keyof Entity]?: any }
}
*/
export class EntityMetadata<Entity> {
  //private static readonly
  readonly name: string
  readonly pluralName: string
  readonly target: Function
  type: EntityTypes
  captionSingular?: string
  captionPlural?: string
  primaryKeys: (keyof Entity)[] = []
  columnsMap: Map<keyof Entity, FieldMetadata<Entity>> = new Map<keyof Entity, FieldMetadata<Entity>>()
  _displayedColumns : DisplayedColumns<Entity>
  get displayedColumns() : DisplayedColumns<Entity> { 
    if (!this._displayedColumns){
      const allColumns = Array.from(this.columnsMap.keys()).filter(name => name !== 'timestamp')
      this._displayedColumns = {
        part : allColumns, 
        lookup : allColumns,
        default : allColumns
      }
    }
    return this._displayedColumns
  }
  constructor(target: Function, type: EntityTypes = EntityTypes.unknown, displayedColumns? : DisplayedColumns<Entity>) {
    this.target = target
    this.name = target.name
    this.type = type
    const plural = pluralize(this.name)
    this.pluralName = plural === this.name ? plural + 's' : plural
    this._displayedColumns = displayedColumns
  }
  get metadataKey(): string { return ENTITY_METADATA_KEY + this.name }
  define() {
    Reflect.defineMetadata(this.metadataKey, this, EntityMetadata)
  }
  initialize(translateService: TranslateService): Promise<[string, number]> {
    return new Promise((resolve, reject) => {
      var noOfTasks = 0
      var pkList: Object[] = []
      // translate the captions
      const keySingular = this.name + '.mel_captionSingular'
      const keyPlural = this.name + '.mel_captionPlural'
      const toTranslate: string[] = [keySingular, keyPlural]
      for (let [key, colMeta] of Array.from(this.columnsMap)) {
        // getPrimarykey-Infos
        if (colMeta.primaryKeyNo)
          pkList.push({ no: colMeta.primaryKeyNo, key: key })
        // Translate the enum-values
         if (colMeta.type === FieldTypes.Enum) {
          if (!colMeta.display.doNotTranslate && !colMeta.display.enumValues) {
            var enum$: Observable<string>[] = []
            for (let enumValue of colMeta.enumValues)
              enum$.push(translateService.get(`${this.name}.${key}Options.${enumValue}`))
            noOfTasks += enum$.length
            forkJoin(enum$).subscribe(captions => colMeta.display.enumValues = captions)
          }
        }
        toTranslate.push(`${this.name}.${key}`)
      }
      pkList = pkList.sort((a, b) => a['no'] - b['no'])
      for (var i = 0; i < pkList.length; i++)
        this.primaryKeys.push(pkList[i]['key'])
      noOfTasks += toTranslate.length
      translateService.get(toTranslate)
        .subscribe(
          captions => {
            this.captionSingular = captions[keySingular]
            this.captionPlural = captions[keyPlural]
            for (let [key, colMeta] of Array.from(this.columnsMap))
              colMeta.display.caption = captions[`${this.name}.${key}`]
          },
          error => reject(error),
          () => {
           // console.log(`initialize metadata: ${this.captionPlural}`)
            resolve([this.name, noOfTasks])
          }
        )
    })
  }
  /**
   * get the metadata of an entity
   * @param target the entity or EntityMetadata to get 
   * @param name   the name of the entity, if target is not the entity (target = EntityMetadata)
   */
  public static get<Entity>(targetOrName: Function | string): EntityMetadata<Entity> {
    const key = ENTITY_METADATA_KEY + (typeof targetOrName === 'function' ? targetOrName.name : targetOrName)
    return Reflect.getMetadata(key, this)
  }
}


//#region decorators
// decorator factory as metadata-producing entity-metadata.

// NOTE: The order of calling the decorator-functions is not deterministic. 
//       --> the Column-Decorator could be called before the Table- or View-Decorator
export function Table(displayedColumns? : DisplayedColumns<any>): ClassDecorator {
  return (target: Function) => {
    var metadata: EntityMetadata<Object> = EntityMetadata.get(target)
    if (metadata) {                             // entitymetadata was created by Column- or Assign-decorator
      metadata.type = EntityTypes.table
      metadata._displayedColumns = displayedColumns
    }
    else
      (new EntityMetadata(target, EntityTypes.table, displayedColumns)).define()
  }
}

export function View(displayedColumns? : DisplayedColumns<any>): ClassDecorator {
  return (target: Function) => {
    var metadata: EntityMetadata<Object> = EntityMetadata.get(target)
    if (metadata) {                             // entitymetadata was created by Column- or Assign-decorator
      metadata.type = EntityTypes.view
      metadata._displayedColumns = displayedColumns
    }
    else
      (new EntityMetadata(target, EntityTypes.view, displayedColumns)).define()
  }
}
/*
export interface IColumnMetadata<Entity> {
  name? : keyof Entity
  primaryKeyNo?: number
  isGenerated?: boolean        // autoincrement  
  class?: FieldClasstypes
  type: FieldTypes
  enumValues?: string[]
  default?: string | number | Date | boolean | Function
  tableRelation?: ColumnTableRelation<Entity>
  editable?: boolean
  validators?: v.ValidationFunc<Entity>[]
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
*/
function concatValidations(funcs: ValidationFunc<any>[], toConcat?: ValidationFunc<any>[]): ValidationFunc<any>[] {
  return toConcat ? funcs.concat(...toConcat) : funcs
}

export function fillColumnMetadata(column: FieldMetadata<any>) : FieldMetadata<any>{
  column.class = column.class || MelFieldClasses.Normal
  column.editable = column.editable === undefined ? true : column.editable
  if (column.validators && column.validators.length)
    column.validators = column.validators.filter(validationFunc => validationFunc !== undefined )
  if(!column.display)
    column.display = {}
  switch (column.type) {
    case FieldTypes.String: {
      column.default = column.default || ''
      column.format = column.format || formatString
      column.parse = column.parse
      column.display.subType = column.display.subType || 'text'
      break
    }
    case FieldTypes.Code: {
      column.default = column.default || ''
      column.format = column.format || formatCode
      column.javaToApiType = column.javaToApiType || javaToApiCode
      column.parse = column.parse
      column.display.subType = column.display.subType || 'text'
      break
    }
    case FieldTypes.Integer: {
      column.default = column.default || 0
      column.autocomplete = column.autocomplete || autocompleteInt
      column.validators = concatValidations([validateInteger], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaInteger
      column.javaToApiType = column.javaToApiType || javaToApiInteger
      column.format = column.format || formatInteger;
      column.parse = column.parse || parseNumber
      column.display.subType = column.display.subType || 'number'
      break
    }
    case FieldTypes.Decimal: {
      column.default = column.default || 0
      column.autocomplete = column.autocomplete || autocompleteDec
      column.validators = concatValidations([validateDecimal], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaDecimal
      column.javaToApiType = column.javaToApiType || javaToApiDecimal
      column.format = column.format || formatDecimal;
      column.parse = column.parse || parseNumber
      column.display.subType = column.display.subType || 'number'
      break
    }
    case FieldTypes.Date: {
      column.default = column.default
      column.autocomplete = column.autocomplete || autocompleteDate
      column.validators = concatValidations([validateDate], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaDate
      column.javaToApiType = column.javaToApiType || javaToApiDate
      column.format = column.format || formatDate
      column.parse = column.parse || parseDate
      column.display.subType = column.display.subType || 'text'
      break
    }
    case FieldTypes.DateTime: {
      column.default = column.default
      column.autocomplete = column.autocomplete || autocompleteDateTime
      column.validators = concatValidations([validateDateTime], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaDateTime
      column.javaToApiType = column.javaToApiType || javaToApiDateTime
      column.format = column.format || formatDateTime
      column.parse = column.parse || parseDateTime
      column.display.subType = column.display.subType || 'text'
      break
    }
    case FieldTypes.Time: {
      column.default = column.default
      column.autocomplete = column.autocomplete || autocompleteTime
      column.validators = concatValidations([validateTime], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaTime
      column.javaToApiType = column.javaToApiType || javaToApiTime
      column.format = column.format || formatTime
      column.parse = column.parse || parseTime
      column.display.subType = column.display.subType || 'text'
      break
    }
    case FieldTypes.Boolean: {
      column.default = column.default || false
      column.validators = concatValidations([validateBoolean], column.validators)
      column.apiToJavaType = column.apiToJavaType || apiToJavaBoolean
      column.javaToApiType = column.javaToApiType || javaToApiBoolean
      column.format = column.format || formatBoolean
      column.parse = column.parse || parseBoolean
      break
    }
    case FieldTypes.Enum: {
      column.default = column.default || column.enumValues[0]
      column.format = column.format || formatString
      column.display.subType = column.display.subType || 'text'
      break
    }
    default: throw new Error(`columntype ${column.type} not yet implemented. "string,number,date or boolean" expected`)
  }
  return column
}

export function Column(column: FieldMetadata<any>): PropertyDecorator {
  return (target, key) => {
    column.name = key
    Reflect.defineMetadata(COLUMN_METADATA_KEY, fillColumnMetadata(column), target, key)

    var entityMetadata = EntityMetadata.get<Object>(target.constructor)
    if (entityMetadata)                                         // EntityMetadata exist
      entityMetadata.columnsMap.set(key as keyof Object, column)    // complete the entity
    else {  // Entitymetadata do not exist at this time   
      entityMetadata = new EntityMetadata(target.constructor) // create an empty entitymetadata
      entityMetadata.columnsMap.set(key as keyof Object, column)    // set the column metadata
      entityMetadata.define()                                 // and store it            
    }
   
  }
}
//#region converting data: api  -->  java  -->  display --> java --> api 
//               functions  apiToJavaXX  formatXX     parseXX  javaToApi               

//#region api-values to java-values. converts the database-output into the correct datatype or undefined

/**
 * @param value 
 * @param format 
 */
function apiToJavaDateTime(value: any, format? : moment.MomentFormatSpecification): Date | undefined {
  if (typeof value !== 'string')
    return undefined
  const mom = moment(value, format, true) // strict!
  return mom.isValid ? mom.toDate() : undefined
}
function apiToJavaDate(value: any, format?: moment.MomentFormatSpecification): Date | undefined {
  return apiToJavaDateTime(value, format ? format : 'YYYY-MM-DD')
}
function apiToJavaTime(value: any, format?: moment.MomentFormatSpecification): Date | undefined {
  return apiToJavaDateTime(value, format ? format : 'HH:mm:ss')
}
function apiToJavaDecimal(value: any): number | undefined {
  value = parseNumber(value)
  return isNaN(value) ? undefined : value 
}
function apiToJavaInteger(value: any): number | undefined {
  value = parseNumber(value)
  return  isNaN(value) ? undefined : Math.round(value)
}
function apiToJavaBoolean(value: any): boolean | undefined {
  value = Boolean(value) 
  return isBoolean(value) ? value : undefined
}
//#endregion 

//#region Formatfunctions for the output in pages
function formatString(value: any, def?: string): string { return value ? value as string : def || "" }
function formatCode(value: any, def?: string): string { return value ? (value as string).toLocaleUpperCase() : def || "" }
function formatDecimal(value: any, precision?: number, def?: string): string {
  if (!precision)
    precision = 0.01
  return value === undefined ? def || '0.00' : Number(Math.round(value / precision) * precision).toLocaleString()
}
function formatInteger(value: any, def?: string): string {
  return value === undefined ? def || '0' : Number(value).toFixed(0).toLocaleString()
}
function formatDate(value: any, def?: string): string {
  return value === undefined ? def || "" : moment(value).format('L')
}
function formatDateTime(value: any, def?: string): string {
  if (value === undefined)
    return def || ''
  const mom = moment(value)
  return mom.format('L') + ' ' + mom.format('LT')
}
function formatTime(value: any, def?: string): string {
  return value === undefined ? def || '' : moment(value).format('LT')
}
function formatBoolean(value: boolean | number, def?: '0' | '1' | boolean | number): string {
  if (value === undefined) {
    if (def === undefined) return '0'
    if (typeof def === 'string') return def
    value = def
  }
  return value ? '1' : '0'
}
//#endregion

//#region autocompleter
function dateShortcut(value: string): moment.Moment {
  value = value.toLowerCase()
  if (value.match(/^[thymg]/g)) {
    switch (value[0]) {
      case 't':
      case 'h': return moment()
      case 'y':
      case 'g': return moment().subtract(1, 'day')
      case 'm': return moment().add(1, 'day')
    }
  }
  return undefined
}
function timeShortcut(value: string): moment.Moment {
  value = value.toLowerCase()
  if (value.match(/^[jnm]/g)) {
    switch (value[0]) {
      case 'm':
      case 'j':
      case 'n': return moment()
    }
  }
  return undefined
}
function autocompleteDate(value: string): string {
  if (value.length > 0) {
    var mom = dateShortcut(value)
    if (!mom) mom = moment(value, 'L')
    if (mom.isValid()) return mom.format('L')
  }
  return value
}
function autocompleteDateTime(value: string): string {
  if (value.length > 0) {
    var mom = dateShortcut(value)
    if (!mom) mom = moment(value, 'L LT')
    if (mom.isValid()) return mom.format('L LT')
  }
  return value
}
function autocompleteTime(value: string): string {
  if (value.length > 0) {
    var mom = timeShortcut(value)
    if (!mom) mom = moment(value, 'LT')
    if (mom.isValid()) return mom.format('LT')
  }
  return value
}
function autocompleteInt(value: string): string {
  while (value.length > 1 && value.startsWith('0')) {
    value = value.slice(1)
  }
  return value
}
function autocompleteDec(value: string): string {
  while (value.length > 1 && value.startsWith('0')) {
    value = value.slice(1)
  }
  return value
}

//#endregion


//#region convert to Api-values
function javaToApiCode(value: any): string | undefined {
  if (value !== undefined && value !== null) {
    if (typeof value === 'string')
      return value.toUpperCase()
    else throw validationKey + 'String'
  }
  return undefined
}
function javaToApiDateTime(value: string): string | undefined {
  var dateValue = parseDateTime(value)
  return dateValue? dateValue.toISOString() : undefined
}
function javaToApiDate(value: any): string | undefined {
  var dateValue = parseDate(value)
  return dateValue? dateValue.toISOString() : undefined
}
function javaToApiTime(value: any): string | undefined {
  var dateValue = parseTime(value)
  return dateValue? dateValue.toISOString() : undefined
}
function javaToApiDecimal(value: any): number | undefined {
  return value ? parseNumber(value) : value
}
function javaToApiInteger(value: any): number | undefined {
  return value ? parseNumber(value) : value
}
function javaToApiBoolean(value: any): number | undefined {
  return parseBoolean(value) ? 1 : 0
}

//#endregion


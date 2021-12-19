var pluralize = require('pluralize');
import 'reflect-metadata'
import * as moment from 'moment'
import 'moment/locale/de'
import { isBoolean } from 'lodash'
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';

import { FieldTypes, MelFieldClasses, ValidationFunc, 
         parseNumber, parseBoolean, parseDate, parseDateTime, parseTime, 
         validateInteger, validateDecimal, validateDate, validateDateTime, 
         validateTime, validateBoolean, validationKey } from 'mel-common';
         
import { DisplayedFields, EntityLiteral, EntityTypes, FieldsMdMap, FieldMetadata } from '../types'

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
export class EntityMetadata {
  //private static readonly
  readonly name: string
  readonly pluralName: string
  readonly target: Function
  type: EntityTypes
  captionSingular?: string
  captionPlural?: string
  primaryKeys: string[] = []
  fieldsMdMap : FieldsMdMap = new Map<string, FieldMetadata<EntityLiteral>>()
  
  constructor(target: Function, type: EntityTypes = EntityTypes.unknown, private _displayedFields? : DisplayedFields) {
    this.target = target
    this.name = target.name
    this.type = type
    const plural = pluralize(this.name)
    this.pluralName = plural === this.name ? plural + 's' : plural
   
  }
  assertGetField(fieldName : string) : FieldMetadata<EntityLiteral>{
    const md = this.fieldsMdMap.get(fieldName)
    if (md)
      return md
    throw new Error(`Fieldmetadata of field "${fieldName} is undefined`)
  }
  get displayedFields() : DisplayedFields { 
    if (!this._displayedFields){
      const allFields = Array.from(this.fieldsMdMap.keys()).filter(name => name !== 'timestamp')
      this._displayedFields = {
        part    : allFields as string[], 
        lookup  : allFields as string[],
        default : allFields as string[]
      }
    }
    return this._displayedFields
  }
  set displayedFields(fields : DisplayedFields) { this._displayedFields = fields }

  get metadataKey(): string { return ENTITY_METADATA_KEY + this.name }
  define() {
    Reflect.defineMetadata(this.metadataKey, this, EntityMetadata)
  }
  initialize(translateService: TranslateService): Promise<[string, number]> {
    return new Promise((resolve, reject) => {
      var noOfTasks = 0
      var pkList: { no : number, key : any}[] = []
      // translate the captions
      const keySingular = this.name + '.mel_captionSingular'
      const keyPlural = this.name + '.mel_captionPlural'
      const toTranslate: string[] = [keySingular, keyPlural]
      for (let [key, fieldMd] of Array.from(this.fieldsMdMap)) {
        // getPrimarykey-Infos
        if (fieldMd.primaryKeyNo)
          pkList.push({ no: fieldMd.primaryKeyNo, key: key })
        // Translate the enum-values
        if (fieldMd.type === FieldTypes.Enum && fieldMd.enumValues) {
          if (!fieldMd.display?.doNotTranslate && !fieldMd.display?.enumValues ) {
            if (!fieldMd.display)
              fieldMd.display = {}
            var enum$: Observable<string>[] = []
            for (let enumValue of fieldMd.enumValues)
              enum$.push(translateService.get(`${this.name}.${key}Options.${enumValue}`))
            noOfTasks += enum$.length
            forkJoin(enum$).subscribe(captions => {
              if (fieldMd.display) fieldMd.display.enumValues = captions
            })
          }
        }
        toTranslate.push(`${this.name}.${key}`)
      }
      pkList  = pkList.sort((a, b) => a.no - b.no)
      for (var i = 0; i < pkList.length; i++)
        this.primaryKeys.push(pkList[i].key)
      noOfTasks += toTranslate.length
      translateService.get(toTranslate)
        .subscribe(
          captions => {
            this.captionSingular = captions[keySingular]
            this.captionPlural = captions[keyPlural]
            for (let [key, fieldMd] of Array.from(this.fieldsMdMap)){
              if (!fieldMd.display)
                fieldMd.display = {}
              fieldMd.display.caption = captions[`${this.name}.${key}`]
            }
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
  public static get(targetOrName: Function | string): any {
    const key = ENTITY_METADATA_KEY + (typeof targetOrName === 'function' ? targetOrName.name : targetOrName)
    return Reflect.getMetadata(key, this)
  }
  public static assertGet(targetOrName: Function | string): EntityMetadata {
    const md = EntityMetadata.get(targetOrName)
    if (md)
      return md as EntityMetadata
    throw new Error(`EntityMetadata of "${targetOrName}" undefined!`)
  }
}


//#region decorators
// decorator factory as metadata-producing entity-metadata.

// NOTE: The order of calling the decorator-functions is not deterministic. 
//       --> the Column-Decorator could be called before the Table- or View-Decorator
export function Table(displayedFields? : DisplayedFields): ClassDecorator {
  return (target: Function) => {
    var metadata: EntityMetadata = EntityMetadata.get(target)
    if (metadata) {                             // entitymetadata was created by Column- or Assign-decorator
      metadata.type = EntityTypes.table
      if (displayedFields)
        metadata.displayedFields = displayedFields
    }
    else
      (new EntityMetadata(target, EntityTypes.table, displayedFields)).define()
  }
}

export function View(displayedFields? : DisplayedFields): ClassDecorator {
  return (target: Function) => {
    var metadata: EntityMetadata = EntityMetadata.get(target)
    if (metadata) {                             // entitymetadata was created by Column- or Assign-decorator
      metadata.type = EntityTypes.view
      if (displayedFields)
        metadata.displayedFields = displayedFields
    }
    else
      (new EntityMetadata(target, EntityTypes.view, displayedFields)).define()
  }
}

function concatValidations(funcs: ValidationFunc<any>[], toConcat?: ValidationFunc<any>[]): ValidationFunc<any>[] {
  return toConcat ? funcs.concat(...toConcat) : funcs
}

export function fillColumnMetadata(fieldMd: FieldMetadata<any>) : FieldMetadata<any>{
  fieldMd.class = fieldMd.class || MelFieldClasses.Normal
  fieldMd.editable = fieldMd.editable === undefined ? true : fieldMd.editable
  if (fieldMd.validators && fieldMd.validators.length)
    fieldMd.validators = fieldMd.validators.filter(validationFunc => validationFunc !== undefined )
  if(!fieldMd.display)
    fieldMd.display = {}
  switch (fieldMd.type) {
    case FieldTypes.String: {
      fieldMd.default = fieldMd.default || ''
      fieldMd.format = fieldMd.format || formatString
      fieldMd.parse = fieldMd.parse
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    case FieldTypes.Code: {
      fieldMd.default = fieldMd.default || ''
      fieldMd.format = fieldMd.format || formatCode
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiCode
      fieldMd.parse = fieldMd.parse
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    case FieldTypes.Integer: {
      fieldMd.default = fieldMd.default || 0
      fieldMd.autocomplete = fieldMd.autocomplete || autocompleteInt
      fieldMd.validators = concatValidations([validateInteger], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaInteger
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiInteger
      fieldMd.format = fieldMd.format || formatInteger;
      fieldMd.parse = fieldMd.parse || parseNumber
      fieldMd.display.subType = fieldMd.display.subType || 'number'
      break
    }
    case FieldTypes.Decimal: {
      fieldMd.default = fieldMd.default || 0
      fieldMd.autocomplete = fieldMd.autocomplete || autocompleteDec
      fieldMd.validators = concatValidations([validateDecimal], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaDecimal
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiDecimal
      fieldMd.format = fieldMd.format || formatDecimal;
      fieldMd.parse = fieldMd.parse || parseNumber
      fieldMd.display.subType = fieldMd.display.subType || 'number'
      break
    }
    case FieldTypes.Date: {
      fieldMd.default = fieldMd.default
      fieldMd.autocomplete = fieldMd.autocomplete || autocompleteDate
      fieldMd.validators = concatValidations([validateDate], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaDate
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiDate
      fieldMd.format = fieldMd.format || formatDate
      fieldMd.parse = fieldMd.parse || parseDate
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    case FieldTypes.DateTime: {
      fieldMd.default = fieldMd.default
      fieldMd.autocomplete = fieldMd.autocomplete || autocompleteDateTime
      fieldMd.validators = concatValidations([validateDateTime], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaDateTime
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiDateTime
      fieldMd.format = fieldMd.format || formatDateTime
      fieldMd.parse = fieldMd.parse || parseDateTime
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    case FieldTypes.Time: {
      fieldMd.default = fieldMd.default
      fieldMd.autocomplete = fieldMd.autocomplete || autocompleteTime
      fieldMd.validators = concatValidations([validateTime], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaTime
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiTime
      fieldMd.format = fieldMd.format || formatTime
      fieldMd.parse = fieldMd.parse || parseTime
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    case FieldTypes.Boolean: {
      fieldMd.default = fieldMd.default || false
      fieldMd.validators = concatValidations([validateBoolean], fieldMd.validators)
      fieldMd.apiToJavaType = fieldMd.apiToJavaType || apiToJavaBoolean
      fieldMd.javaToApiType = fieldMd.javaToApiType || javaToApiBoolean
      fieldMd.format = fieldMd.format || formatBoolean
      fieldMd.parse = fieldMd.parse || parseBoolean
      break
    }
    case FieldTypes.Enum: {
      if (!fieldMd.default && fieldMd.enumValues?.length)
        fieldMd.default = fieldMd.enumValues[0]
      fieldMd.format = fieldMd.format || formatString
      fieldMd.display.subType = fieldMd.display.subType || 'text'
      break
    }
    default: throw new Error(`columntype ${fieldMd.type} not yet implemented. "string,number,date or boolean" expected`)
  }
  return fieldMd
}

export function Field(field: FieldMetadata<any>): PropertyDecorator {
  return (target, key) => {
    field.name = key as string 
    Reflect.defineMetadata(COLUMN_METADATA_KEY, fillColumnMetadata(field), target, key)

    var entityMetadata = EntityMetadata.get(target.constructor)
    if (entityMetadata)                                         // EntityMetadata exist
      entityMetadata.fieldsMdMap.set(field.name, field)    // complete the entity
    else {  // Entitymetadata do not exist at this time   
      entityMetadata = new EntityMetadata(target.constructor) // create an empty entitymetadata
      entityMetadata.fieldsMdMap.set(key as keyof Object, field)    // set the column metadata
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
function apiToJavaDateTime(value: string, format? : moment.MomentFormatSpecification): Date  {
  const mom = moment(value, format, true) // strict!
  if (mom.isValid())
    return  mom.toDate()
  throw new Error(`Date "${value} is an invalid date`)
}
function apiToJavaDate(value: any, format?: moment.MomentFormatSpecification): Date {
  return apiToJavaDateTime(value, format ? format : 'YYYY-MM-DD')
}
function apiToJavaTime(value: any, format?: moment.MomentFormatSpecification): Date {
  return apiToJavaDateTime(value, format ? format : 'HH:mm:ss')
}
function apiToJavaDecimal(value: any): number {
  value = parseNumber(value)
  if (isNaN(value))
    throw new Error(`Decimal "${value} is invalid`)
  return value 
}
function apiToJavaInteger(value: any): number {
  value = parseNumber(value)
  if (isNaN(value))
    throw new Error(`Integer "${value} is invalid`)
  return  Math.round(value)
}
function apiToJavaBoolean(value: any): boolean {
  value = Boolean(value) 
  if (isBoolean(value) ) 
    return value
  throw new Error(`Boolean "${value} is invalid`)
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
function dateShortcut(value: string): moment.Moment | undefined {
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
function timeShortcut(value: string): moment.Moment | undefined {
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
function javaToApiCode(value: string): string {
  if (value !== undefined && value !== null) {
    return value.toUpperCase()
    //else throw validationKey + 'String'
  }
  return ''
}
function javaToApiDateTime(value: string): string {
    return parseDateTime(value).toISOString() 
}
function javaToApiDate(value: any): string {
  return  parseDate(value).toISOString()
}
function javaToApiTime(value: any): string  {
  return parseTime(value).toISOString()
}
function javaToApiDecimal(value: any): number {
  return value ? parseNumber(value) : value
}
function javaToApiInteger(value: any): number {
  return value ? parseNumber(value) : value
}
function javaToApiBoolean(value: any): number {
  return parseBoolean(value) ? 1 : 0
}

//#endregion


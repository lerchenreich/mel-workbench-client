/*
import 'moment/locale/de' 


import { ApiFilters, FilterOperators, RequestOptions} from 'mel-common/types'
import { IColumnMetadata } from 'mel-common/interfaces'
import { FilterRange } from '../../types'
import { ClientCondition, FieldConditions } from './filter-condition'

export enum FilterGroups {show, lock}
/**
 * Filters encapsulate FieldConditions an their methods to create, delete, reset and convert to friendly- and api-strings
 * The FieldCondition-Value is a Condition, which can be complex or simple. 
 * A simple condition contains one Expression
 * A complex condition contains two ore more Expressions. 
 * An Expression contains an operator an 0..n operands. The number of operands depends on the operator (see FilterOperators)
 * Operands apply the types number, string, boolean or Date (ExpressionTypes) 
 */

import { isEmpty } from 'lodash'
import { ExpressionType } from 'mel-common/filter-expression'
import { RecFilters } from "mel-common/filters"
import { FieldMetadata } from "../../types"
import { Filters, FilterOperators, RequestOptions } from "mel-common/api"
import { FieldTypes } from "mel-common/types"
import { ClientCondition } from "./filter-condition"

/**
 * Represents the filters of a record
 */
export class ClientFilters<Entity extends Object> extends RecFilters<Entity, ClientCondition, FieldMetadata<Entity>> {
 
  constructor(_columnsMetadata : Map<keyof Entity, FieldMetadata<Entity>>){
    super(_columnsMetadata)
  }

  createCondition(op : FilterOperators, ops : ExpressionType[], colType : FieldTypes) : ClientCondition{
    return new ClientCondition(op, ops, colType)
  }

  /* not used
  public static parse<Entity>(jsonToParse : string, columnsMetadata : Map<keyof Entity, IColumnMetadata<Entity>>) : RecFilters<Entity> {
    var filters : RecFilters<Entity> = new RecFilters(columnsMetadata)
    const filterObject = JSON.parse(jsonToParse)
    Object.entries(filterObject).forEach( ([fieldName, value]) => {
      filters.fieldFilters[fieldName] = new ClientCondition(FilterOperators.unknown, [value as string], columnsMetadata.get(fieldName as keyof Entity).type)
    })   
    return filters
  }
  */
  //getter, setter
   
  public get friendly() : string {
    var filters : string = ''
    Object.entries(this._filters)
    .forEach( ([key, value]) => {
      if (!this._lockedFilterNames.includes(key)) 
        filters += `${key}:${(value as ClientCondition).friendly}`
    })
    return filters
  }
  
  public getRequestOptions() : RequestOptions<Entity> {
    var options : RequestOptions<Entity> = {}
    if (this.hasFilters) {
      var fieldFilters : Filters<Entity> = {}
      var flowFilters  : Filters<Entity> = {}
      Object.entries(this._filters).forEach( ([fieldName, condition]:[string, ClientCondition]) => {
        if (condition.hasExpressions){
          if (this.isNormalFilter(fieldName)) 
            fieldFilters[fieldName] = condition.toApiFormat()
          else if (this.isFlowFilter) 
            flowFilters[fieldName] = condition.toApiFormat()
          else throw new Error()
        }
      })
      if (!isEmpty(fieldFilters)) options.where = fieldFilters
      if (!isEmpty(flowFilters) ) options.flowFilter = flowFilters
    }
    return options
  }
 
}

  

 
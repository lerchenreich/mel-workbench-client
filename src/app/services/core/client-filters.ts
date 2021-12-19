/*
import 'moment/locale/de' 

/**
 * Filters encapsulate FieldConditions an their methods to create, delete, reset and convert to friendly- and api-strings
 * The FieldCondition-Value is a Condition, which can be complex or simple. 
 * A simple condition contains one Expression
 * A complex condition contains two ore more Expressions. 
 * An Expression contains an operator an 0..n operands. The number of operands depends on the operator (see FilterOperators)
 * Operands apply the types number, string, boolean or Date (ExpressionTypes) 
 */

import { isEmpty } from 'lodash'
import { ExpressionType, RecFilters, QueryFilter, FilterOperators, QueryOptions, FieldTypes } from "mel-common"
import { EntityLiteral, FieldMetadata, FieldsMdMap } from "../../types"
import { ClientFilterCondition } from "./client-filter-condition"

/**
 * Represents the filters of a record
 */
export class ClientFilters<Entity extends EntityLiteral> extends RecFilters<EntityLiteral, ClientFilterCondition, FieldMetadata<EntityLiteral>> {
 
  constructor(_fieldsMetadata : FieldsMdMap){
    super(_fieldsMetadata)
  }

  createCondition(op : FilterOperators, ops : ExpressionType[], colType : FieldTypes) : ClientFilterCondition{
    return new ClientFilterCondition(op, ops, colType)
  }
  //getter, setter   
  public get friendly() : string {
    var filters : string = ''
    Object.entries(this._filters)
    .forEach( ([key, value]) => {
      if (!this._lockedFilterNames.includes(key)) 
        filters += `${key}:${(value as ClientFilterCondition).friendly}`
    })
    return filters
  }
  public getRequestOptions() : QueryOptions<Entity> {
    var options : QueryOptions<Entity> = {}
    if (this.hasFilters) {
      var fieldFilters : QueryFilter<Entity> = {}
      var flowFilters  : QueryFilter<Entity> = {}
      Object.entries(this._filters).forEach( ([fieldName, condition]) => {
        if (condition?.hasExpressions){
          if (this.isNormalFilter(fieldName)) 
            fieldFilters[fieldName as keyof Entity] = condition.toQueryFormat() 
          else if (this.isFlowFilter(fieldName)) 
            flowFilters[fieldName as keyof Entity] = condition.toQueryFormat()
          else throw new Error()
        }
      })
      if (!isEmpty(fieldFilters)) options.where = fieldFilters
      if (!isEmpty(flowFilters) ) options.flowFilter = flowFilters
    }
    return options
  }
 
}

  

 
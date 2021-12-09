import * as moment from 'moment'
import 'moment/locale/de' 
import { isEmpty } from 'lodash'

import { ValidationErrors } from '@angular/forms'
import { ConditionExpression, ExpressionType, FieldTypes , FilterOperators, IQueryCondition} from 'mel-common'

function isValidDate(date : any) : boolean {
  return (date instanceof Date) && !isNaN(date.getTime())
}

function IntegerToApiOperand(operand : ExpressionType): string { return Number(operand).toFixed(0) }
function DateToApiOperand(operand : ExpressionType) : string { return moment(operand as Date).format('YYYY-MM-DD') }
function DecimalToApiOperand(operand : ExpressionType) : string { return Number(operand).toLocaleString('en') }
function DatetimeToApiOperand(operand : ExpressionType) : string { return moment(operand as Date).format('YYYY-MM-DD HH:mm:ss') }
function BooleanToApiOperand(operand : ExpressionType) : string { return (operand as Boolean)? '1' : '0' }


function ToFriendlyCode(operand : ExpressionType, ifInvalid : string): string { 
  return typeof operand === 'string'? operand.toUpperCase() : ifInvalid
}
function ToFriendlyString(operand : ExpressionType, ifInvalid : string): string { 
  return typeof operand === 'string'? operand : ifInvalid 
}
function ToFriendlyInteger(operand : ExpressionType, ifInvalid : string): string { 
  return isNaN(operand as number)? ifInvalid : (operand as number).toFixed(0) 
}
function ToFriendlyBigInteger(operand : ExpressionType, ifInvalid : string): string { 
  return isNaN(operand as number)? ifInvalid : (operand as number).toFixed(0) 
}

function ToFriendlyDecimal(operand : ExpressionType, ifInvalid : string): string { 
  return isNaN(operand as number)? ifInvalid :  operand.toLocaleString() 
}
function ToFriendlyDate(operand : ExpressionType, ifInvalid : string): string { 
  return isValidDate(operand) ?  moment(operand as Date).format('L') : ifInvalid
}           
function ToFriendlyDatetime(operand: ExpressionType, ifInvalid : string) : string { 
  return isValidDate(operand) ? moment(operand as Date).format('L LT') : ifInvalid
}
function ToFriendlyBoolean(operand: ExpressionType, ifInvalid : string) : string { 
  return('toDo: filter-expressions.ts. ToFriendlyBoolean')
  //return  boolStrings.flat(3).includes(operand as string)?yes[0]:no[0] 
}
//
function validateString(expr : ConditionExpression) : ValidationErrors { 
  if (expr.operator === FilterOperators.like) return null
  return (expr.operands as string[]).filter( value => value.includes('*') ).length  ?
            { operands : `Expression "Operator ${expr.operator} can't be used with '*'-expression`} : null
}
function validateNumber(expr : ConditionExpression) : ValidationErrors {
  const  invalidNumbers = expr.operands.filter(operand => isNaN(operand as number))
  return invalidNumbers.length > 0? {operands : `Expression "${expr.input}" is not a number`} : null
}
function validateDate(expr : ConditionExpression) : ValidationErrors {
  const invalidDates = expr.operands.filter( operand => !isValidDate(operand))
  return invalidDates.length > 0? { operands : `Expression "${expr.input}" is no date-value`} : null
}
function validateDatetime(expr : ConditionExpression) : ValidationErrors {
  const invalidDates = expr.operands.filter( operand => !isValidDate(operand))
  return invalidDates.length > 0? { operands : `Expression "${expr.input}" is no datetime-value`} : null                  
}
function validateBoolean(expr : ConditionExpression) : ValidationErrors {
  var errors : ValidationErrors = {}
  if ( expr.operator != FilterOperators.equal)
    errors.operator = `Operator "${expr.operator}" can't be used with type 'Boolean'`
// toDo:  if  ( boolStrings.flat(3).includes(expr.operands[0] as string))
    errors.operands = `Boolean expression "${expr.operands}" not implemented`
  return isEmpty(errors)? null : errors
}

/**
 * This class represents one filterexpression of a condition
 * Members: 
 * - _operator: the filteroperator for the API-Call
 * - _operands: string[]
 * - _input: the original expression
 */
export class ClientExpression extends ConditionExpression {
 
  private _toApiOperand : (operand : ExpressionType) => string = undefined
  private _toFriendlyOperand : (operand : ExpressionType, ifInvalid : string) => string = undefined
  private _validate :(expr : ConditionExpression) => ValidationErrors 
  /**
   * The constructor ist used for a friendly interface. The faster way is to use create()
   * @param columnType 
   * @param _input 
   */
  constructor(columnType : FieldTypes, inputOrOperator? : string | FilterOperators, operands? : ExpressionType[]){
    super(columnType, inputOrOperator, operands)
    switch(columnType){
      case FieldTypes.Code    : this._toFriendlyOperand = ToFriendlyCode;    this._validate = validateString;    break;
      case FieldTypes.String  : this._toFriendlyOperand = ToFriendlyString;  this._validate = validateString;    break;
      case FieldTypes.Integer : this._toFriendlyOperand = ToFriendlyInteger; this._validate = validateNumber;    this._toApiOperand = IntegerToApiOperand;  break;
      case FieldTypes.Decimal : this._toFriendlyOperand = ToFriendlyDecimal; this._validate = validateNumber;    this._toApiOperand = DecimalToApiOperand;  break;
      case FieldTypes.Date    : this._toFriendlyOperand = ToFriendlyDate;    this._validate = validateDate;      this._toApiOperand = DateToApiOperand;     break;
      case FieldTypes.DateTime: this._toFriendlyOperand = ToFriendlyDatetime;this._validate = validateDatetime;  this._toApiOperand = DatetimeToApiOperand; break;
      case FieldTypes.Boolean : this._toFriendlyOperand = ToFriendlyBoolean; this._validate = validateBoolean;   this._toApiOperand = BooleanToApiOperand;  break;
      case FieldTypes.BigInt  : this._toFriendlyOperand = ToFriendlyInteger; this._validate = validateNumber;    this._toApiOperand = IntegerToApiOperand;  break;
      case FieldTypes.Enum    : this._toFriendlyOperand = ToFriendlyString;  this._validate = validateString;    break;
      case FieldTypes.Time    : this._toFriendlyOperand = ToFriendlyDatetime;this._validate = validateDatetime;  this._toApiOperand = DatetimeToApiOperand; break;
    }
  }

  public get queryCondition() : IQueryCondition { return {
    op : this.operator,
    opd : this.apiOperands
  }}
  private get apiOperands() : string[] {
    return this._toApiOperand? this.operands.map( operand => this._toApiOperand(operand) ) : this.operands as string[]
  } 
  /**
   * Formats the expression into a friendly format f.e. 020320 --> 02.03.2020 (date)
   */
  public get friendly() : string {
    if (this.operands.length === 1) 
      return `${this.operator===FilterOperators.equal?'':this.operator}${this._toFriendlyOperand(this.operands[0], this.input)}`
    if (this.operands.length > 1) {
        const operands = this.operands.map( operand => this._toFriendlyOperand(operand, this.input) )
        return (this.operator === FilterOperators.between)? `${operands[0]}..${operands[1]}` : `${this.operator} ${operands.join(',')}`     
    }
    if (this.operands.length === 0) return ''
  }

  /**
  * validates the condition and returns ValidationErrors if invalid otherwise null
  */
  public validate() : ValidationErrors {  
        
    function error(errorText : string) : ValidationErrors {
      return { FilterExpressionCondition : errorText}
    }

    if (this.isEmpty) 
      return error(`Condition "${this.operator} ${this.operands}" must not by empty`)
  
    
    return this._validate? this._validate(this) : null
  }
 
}

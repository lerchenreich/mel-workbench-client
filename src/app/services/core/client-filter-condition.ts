
//import * as moment from 'moment'
//import 'moment/locale/de' 
import { isEmpty } from 'lodash'
import { TranslateService } from '@ngx-translate/core'
import { ValidationErrors } from '@angular/forms'

import { FilterCondition, ExpressionType, Replace, IQueryCondition, FilterOperators , FieldTypes} from 'mel-common'

import { ClientExpression } from './client-condition-expression'
import { stringify } from 'querystring'

export type FieldConditions<Entity extends Object> = { [P in keyof Entity]? : ClientFilterCondition }
export interface ITranslateOptions {
  path : string
  service : TranslateService
}
export class ClientFilterCondition extends FilterCondition<ClientExpression> {

    constructor(operator : FilterOperators, operands : ExpressionType[], columnType : FieldTypes, public translateOptions? : ITranslateOptions){
      super(operator, operands, columnType)
    }
    protected createExpression(inputOrOperator? : string | FilterOperators, operands? : ExpressionType[]) : ClientExpression {
      return new ClientExpression(this._columnType, inputOrOperator, operands)
    }
  
    /**
     * Formats the condition into an api-conform Where-condition
     */
    public toQueryFormat() : IQueryCondition {     
      if (this.isComplex) {
        var complexCondition : string = this._complexInput as string
        for(let expression of this._expressions){
          const apiCondition = expression.queryCondition
          complexCondition = complexCondition.replace(expression.input, `${apiCondition.op} ${apiCondition.opd?.join(',')}` )
        }
        return { op : FilterOperators.cplx, opd : [complexCondition] }
      }
  
      return this._expressions[0].queryCondition
    }
  
    public setFriendly() : string {
      const friendlyString = this.friendly

      if (this.hasExpressions) {
        if (this.isComplex)
          this.complexInput = friendlyString
        else 
          this._expressions[0].input = friendlyString
      }
      return friendlyString
    }
  
    public get friendly() : string {
      if (!this.hasExpressions) 
        return ''
      if (this.isComplex){
          var friendyString = this._complexInput as string
          for (let expression of this._expressions)
            friendyString = friendyString.replace(expression.input, this.translateEnum(expression))
          return friendyString.trim()
      }
      else 
        return this.translateEnum(this._expressions[0])
      
    }
  
    private translateEnum(expression : ClientExpression) : string {
      if (this.translateOptions && (this.columnType == FieldTypes.Enum) ){
        const key = this.translateOptions.path+'.'+ expression.operands[0]   // an enum ist alltime stored in operand[0]
        var translated = this.translateOptions.service.instant( key ) 
        return translated === key ? expression.operands[0] : translated
      }
      else 
        return expression.friendly
    }

    translateEnumsInv() : ClientFilterCondition{
      if (this.translateOptions && this.columnType == FieldTypes.Enum ){
        for (let expression of this._expressions) { // an enum ist alltime stored in operand[0]
          const key = this.translateOptions.path+'Inv.'+ expression.operands[0]
          const translated = this.translateOptions.service.instant(key)
          if (translated !== key)
            expression.operands[0] = translated
        }
        this.translateOptions = undefined // translate once
      }
      return this
    }
    /** 
     * Validetes the brackets and all expressions 
    */
    public validate() : ValidationErrors | null {
      var _validationErrors : { required? : string, bracketsCheck? : string } = { }
      if ( !this.hasExpressions ) {
        _validationErrors.required = `Conditionis required`
        return _validationErrors 
      }
      // validate all expressions
      for (let expression of this._expressions){
        _validationErrors = Object.assign(_validationErrors, expression.validate())
      }
      if (this.isComplex){
        var toValidate = new Replace((this._complexInput as string).trim(), ["\\(", "\\)"]).replaced
        do {
          toValidate = toValidate.trim()
          var closingBracketIndex = toValidate.indexOf(')')
          if (closingBracketIndex >= 0) {
            var openBracketIndex = toValidate.lastIndexOf('(', closingBracketIndex)
            if ( openBracketIndex >= 0 ){
              toValidate = toValidate.substring(0, openBracketIndex) + toValidate.substring(closingBracketIndex+1)
            }
            else {
              _validationErrors.bracketsCheck = `Missing "(" for closing Bracket at index ${closingBracketIndex}` 
              return _validationErrors
            }
          }
        } while(closingBracketIndex >= 0)
      
        const regExprs = toValidate.match(/\(/g)
        if (regExprs !== null && regExprs.length) 
          _validationErrors.bracketsCheck = `Missing ${regExprs.length}  closing brackets ")" for ${regExprs.length} opening bracket(s)`
      }
     
      return isEmpty(_validationErrors)? null : _validationErrors 
    }
}
  
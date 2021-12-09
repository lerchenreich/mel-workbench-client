import { FormControl, ValidationErrors, ValidatorFn, AbstractControlOptions, AsyncValidatorFn } from '@angular/forms'

import { FieldTypes, FilterOperators} from'mel-common'
import { ClientCondition } from 'src/app/services/core/filter-condition'

export class FilterExpressionControl extends FormControl {
  private doValidate = true
  constructor(private _condition: ClientCondition, validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null)
  {
    super(_condition.friendly, validatorOrOpts, asyncValidator)
  }
  get columnType() : FieldTypes { return this._condition?.columnType}
  get condition() : ClientCondition { return this._condition }
  set condition(newCondition : ClientCondition) { 
    if (!this._condition || !newCondition.equals(this._condition)){
      this._condition = newCondition
      this.doValidate = false
      this.setValue(this.condition.setFriendly(), {
        onlySelf : false,
        emitEvent : true,
        emitModelToViewChange : true,
        emitViewToModelChange : true
      })
      this.doValidate = true
    }
  }
 
  onExpressionChanged(newExpression : string) : void {
    this.condition = new ClientCondition(FilterOperators.cplx, [newExpression], this.columnType, this.condition.translateOptions)
  }

    /** Prüft die Klammerung des Filters und validiert alle Ausdrücke */
  validate() : ValidationErrors | null {
    if (this.doValidate){
      console.log(`validate Filter with type "${this.columnType}" and condition "${this.value}"`)
      return this._condition.validate() 
    }
    return null
  }
} 


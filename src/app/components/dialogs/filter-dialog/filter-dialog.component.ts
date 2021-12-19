import { Inject, Injector, Component, OnInit, HostListener } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { FormControl, FormArray, ValidationErrors, FormGroup, AbstractControlOptions, ValidatorFn } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { isEmpty } from 'lodash'

import { FieldTypes, FilterOperators} from'mel-common'
import { FilterExpressionControl } from '../../controls/filterExpressionControl'
import { ClientFilters } from 'src/app/services/core/client-filters'
import { FieldConditions, ClientFilterCondition, ITranslateOptions } from 'src/app/services/core/client-filter-condition'
import { EntityLiteral } from 'src/app/types'

export interface IFilterDialogData {
  title? : string
  entityName : string
  filters : ClientFilters<EntityLiteral>
  useFlowfilters? : boolean
}

const fieldNameControlName = 'fieldName'
const conditionControlName = 'condition'

/**
 * The FilterDialogComponent consists of an array of FilterExpressionControls, 
 * which resides in the FormArray "filterElements". 
 * A FilterExpressionControl extends a FormControl and represents a Condition
 * The FilterDialogComponent get IFilterDialogData with the title of the dialog,
 * the entityname, the existing filters and if flowfilters should be used (default:false).
 * The user can add a new filterlement (fieldname and condition) and delete a filter but not locked filters
 * After entering a condition, this condition will be validated and values are converted and enum translated.
 * A cancel-button and a save-button close the dialog
 * The returned conditions contain only the filters the user has edited
 */
@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent {
  filterElements : FormArray
  fieldNames : string []

  constructor(@Inject(MAT_DIALOG_DATA)  private data: IFilterDialogData, 
                                        private translate : TranslateService, 
                                        private dialogRef:MatDialogRef<FilterDialogComponent>) { 
    if (!data.title) 
      translate.get(`List.${data.entityName}`).subscribe(result => this.data.title = result)   
    this.filterElements = new FormArray( [] )
    this.fieldNames = data.useFlowfilters ? data.filters.flowFilterFieldNames : data.filters.unlockedFilterFieldNames

    const fieldConditions = data.useFlowfilters? data.filters.copyFlowFieldConditions() : data.filters.copyNormalFieldConditions(false) 
    if (isEmpty(fieldConditions)){
      this.addFilterelement( this.firstUnusedFieldName() || 'No fieldname found' )
    }
    else
      Object.entries(fieldConditions).forEach(([fieldName, condition], i) => 
        this.addFilterelement(fieldName, condition)
      )
  }

  get caption():string { return this.data.title||''}
  
  @HostListener('keydown', ['$event']) 
  onKeyDown(event : KeyboardEvent) {
    if (event.ctrlKey && event.code == 'Enter' && this.filterElements?.status !=='INVALID')
      this.newFilterelement()
  }
  static validate(ctrl : FilterExpressionControl) : ValidationErrors | null{
    return  ctrl.columnType && (ctrl.value as string)?.length ? ctrl.validate() : null
  }

  validationErrors(i : number):string{ 
    var errors = ''
    const ctrl = this.filterElements.controls[i].get(conditionControlName)
    if (ctrl){
      const errs = ctrl.errors
      if (errs){
        for (let err of Object.values(errs))
          errors += err + '; '
      } 
    }
    return errors
  }

  usedFieldNames() : string[] {
    return this.filterElements.controls.map( element => {return (element as FormGroup).controls.fieldName.value} )
  }

  firstUnusedFieldName() : string | undefined {
    const used = this.usedFieldNames()
    for (let fieldName of this.fieldNames as string[])
      if (!used.includes(fieldName)) return fieldName
    return undefined
  }

  newFilterelement() : FormGroup | undefined{
    const fieldName = this.firstUnusedFieldName()
    return fieldName ? this.addFilterelement( fieldName ) : undefined
  }
  translateOptions(columnType : FieldTypes, fieldName : string) : ITranslateOptions | undefined{
    return columnType == FieldTypes.Enum ? { path : `${this.data.entityName}.${fieldName}Options`, service : this.translate} : undefined
  }
  /**
   * Creates a FilterExpressionControl from the fieldName and condition
   * @param fieldName the fieldname
   * @param condition the condiition
   */
  addFilterelement(fieldName : string, condition? : ClientFilterCondition) : FormGroup | undefined {
    var _fieldName = fieldName as string|undefined 
    if (!fieldName?.length ) 
      _fieldName = this.firstUnusedFieldName()
    if (_fieldName?.length) {
      const colMetadata = this.data.filters.fieldsMetadata.get(_fieldName)
      if (colMetadata){ 
        if (!condition) condition = new ClientFilterCondition(FilterOperators.cplx, [''], colMetadata.type) 
        condition.translateOptions = this.translateOptions(colMetadata.type, _fieldName)
        const filterControl = new FormGroup({})
        filterControl.addControl(fieldNameControlName, new FormControl(_fieldName))                                                                   
        filterControl.addControl(conditionControlName, 
          new FilterExpressionControl(condition, 
                                      {
                                        validators: FilterDialogComponent.validate as ValidatorFn, 
                                        updateOn:'blur'
                                      }))
        this.filterElements.push(filterControl)
        return filterControl
      }
    }
    return undefined
  }
 
  clear(){
    this.filterElements.clear()
  }
 
  private filterExpressionControl(index : number) : FilterExpressionControl { 
    return  (this.filterElements.controls[index] as FormGroup).get(conditionControlName) as FilterExpressionControl
  }

  onFieldNameChange(newFieldName : string, index: number){
    const filterExpressionControl = this.filterExpressionControl(index)
    filterExpressionControl.reset()
    const colMetadata = this.data.filters.assertGetFieldMetadata(newFieldName as string)
    filterExpressionControl.condition = new ClientFilterCondition(FilterOperators.cplx, [''], colMetadata.type) 
    filterExpressionControl.condition.translateOptions = this.translateOptions(colMetadata.type, newFieldName)
  }
 
  onConditionChange(event : any, index : number){
    const newExpression = event.target.value
    const filterExpressionControl = this.filterExpressionControl(index)
    if (filterExpressionControl.value !== newExpression) { 
      filterExpressionControl.onExpressionChanged(newExpression)
    }
  }

  clearButtonClicked(index : number){
    this.filterElements.removeAt(index)
  }

  close() {
    this.dialogRef.close()
  }
  
  save() {
    var conditions : FieldConditions<EntityLiteral> = {}
 
    for(let formGroup of this.filterElements.controls){   
      const conditionControl = formGroup.get(conditionControlName) as FilterExpressionControl
      const fieldNameControl = formGroup.get(fieldNameControlName) as FormControl
      if (conditionControl.value.length > 0){
        conditions[fieldNameControl.value] = conditionControl.condition.translateEnumsInv()
      }  
    } 
    this.dialogRef.close( conditions )
  }
}

import { Inject, Injector, Component, OnInit, HostListener } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { FormControl, FormArray, ValidationErrors, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { isEmpty } from 'lodash'

import { FieldTypes } from 'mel-common/types'
import { FilterOperators} from'mel-common/api'
import { FilterExpressionControl } from '../../controls/filterExpressionControl'
import { EntityMetadata} from '../../../metadata/entities';
import { ClientFilters } from 'src/app/services/core/filters'
import { FieldConditions, ClientCondition, ITranslateOptions } from 'src/app/services/core/filter-condition'

export interface IFilterDialogData<Entity> {
  title? : string
  entityName : string
  filters : ClientFilters<Entity>
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

  constructor(@Inject(MAT_DIALOG_DATA)  private data: IFilterDialogData<Object>, 
                                        private translate : TranslateService, 
                                        private dialogRef:MatDialogRef<FilterDialogComponent>) { 
    const metadata = EntityMetadata.get(data.entityName)
    if (!data.title) 
      translate.get(`List.${data.entityName}`).subscribe(result => this.data.title = result)   
    this.filterElements = new FormArray( [] )
    this.fieldNames = data.useFlowfilters ? data.filters.flowFilterFieldNames : data.filters.unlockedFilterFieldNames

    const fieldConditions = data.useFlowfilters? data.filters.copyFlowFieldConditions() : data.filters.copyNormalFieldConditions(false) 
    if (isEmpty(fieldConditions))
      this.addFilterelement( this.firstUnusedFieldName() )
    else
      Object.entries(fieldConditions).forEach(([fieldName, condition], i) => 
        this.addFilterelement(fieldName, condition)
      )
  }

  get caption():string { return this.data.title}
  
  @HostListener('keydown', ['$event']) 
  onKeyDown(event : KeyboardEvent) {
    if (event.ctrlKey && event.code == 'Enter' && this.filterElements?.status !=='INVALID')
      this.newFilterelement()
  }
  static validate(ctrl : FilterExpressionControl) : ValidationErrors {
    return  ctrl.columnType && (ctrl.value as string)?.length ? ctrl.validate() : null
  }

  validationErrors(i : number):string{ 
    const errs = this.filterElements.controls[i].get(conditionControlName).errors
    var errors = ''
    if (errs){
      for (let err of Object.values(errs))
        errors += err + '; '
    } 
    return errors
  }

  usedFieldNames() : string[] {
    return this.filterElements.controls.map( element => {return (element as FormGroup).controls.fieldName.value} )
  }

  firstUnusedFieldName() : string {
    const used = this.usedFieldNames()
    for (let fieldName of this.fieldNames as string[])
      if (!used.includes(fieldName)) return fieldName
    return undefined
  }

  newFilterelement() : FormGroup {
    return this.addFilterelement( this.firstUnusedFieldName() )
  }
  translateOptions(columnType : FieldTypes, fieldName : string) : ITranslateOptions {
    return columnType == FieldTypes.Enum ? { path : `${this.data.entityName}.${fieldName}Options`, service : this.translate} : undefined
  }
  /**
   * Creates a FilterExpressionControl from the fieldName and condition
   * @param fieldName   the filedname
   * @param condition the condiition
   */
  addFilterelement(fieldName : string, condition : ClientCondition = undefined) : FormGroup {
    if (!fieldName?.length ) 
      fieldName = this.firstUnusedFieldName()
    if (fieldName?.length) {
      const colMetadata = this.data.filters.columnsMetadata.get(fieldName as keyof Object)
      if (colMetadata){ 
        if (!condition) condition = new ClientCondition(FilterOperators.cplx, [''], colMetadata.type) 
        condition.translateOptions = this.translateOptions(colMetadata.type, fieldName)
        const filterControl = new FormGroup({})
        filterControl.addControl(fieldNameControlName, new FormControl(fieldName))
        filterControl.addControl(conditionControlName, new FilterExpressionControl(condition, {validators: [FilterDialogComponent.validate], updateOn:'blur'}))
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
    const colMetadata = this.data.filters.columnsMetadata.get(newFieldName as keyof Object)
    filterExpressionControl.condition = new ClientCondition(FilterOperators.cplx, [''], colMetadata.type) 
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
    var conditions : FieldConditions<Object> = {}
 
    for(let formGroup of this.filterElements.controls){   
      const conditionControl = formGroup.get(conditionControlName) as FilterExpressionControl
      const fieldNameControl = formGroup.get(fieldNameControlName)
      if (conditionControl.value.length > 0){
        conditions[fieldNameControl.value] = conditionControl.condition.translateEnumsInv()
      }  
    } 
    this.dialogRef.close( conditions )
  }
}

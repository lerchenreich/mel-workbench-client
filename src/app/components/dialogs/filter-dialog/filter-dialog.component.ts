import { Component, HostListener } from '@angular/core'
import { FormControl, FormArray, ValidationErrors, FormGroup, ValidatorFn, AbstractControl } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal'
import { isEmpty } from 'lodash'

import { EntityLiteral, FieldTypes, FilterOperators} from'mel-common'
import { FilterExpressionControl } from 'mel-client'
import { ClientFilters } from 'mel-client'
import { FieldConditions, ClientFilterCondition, ITranslateOptions } from 'mel-client'

import { MelModal, openDialog } from '../mel-modal'
import { Entity } from 'mel-client'

export interface IFilterDialogData<E extends Entity> {
  title? : string
  entityName? : string
  filters? : ClientFilters<E>
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
export class FilterDialogComponent<E extends Entity>  extends MelModal<IFilterDialogData<E>, FieldConditions<E>> implements IFilterDialogData<E> {
  // interface FilterdialogData
  title? : string
  entityName? : string
  filters? : ClientFilters<E>
  useFlowfilters : boolean = false
  
  constructor(public translate : TranslateService, modalRef : BsModalRef) { 
    super(modalRef)
  }
  //abstract member implementation of MelModal
  override set dlgData(data: IFilterDialogData<E>) {
    if (data.title)
      this.title = data.title
    else 
      this.translate.get(`List.${data.entityName}`).subscribe({next: result => (this.title = result)})
    if (!data.filters || !data.entityName)
      throw new Error('FilterDialogComponent: Entityname or filters noct defined')  
    this.filters = data.filters
    this.entityName = data.entityName
    this.useFlowfilters = !!data.useFlowfilters 
    this.fieldNames = this.useFlowfilters ? this.filters.flowFilterFieldNames : this.filters.unlockedFilterFieldNames
  	const fieldConditions = this.useFlowfilters? this.filters.copyFlowFieldConditions() : this.filters.copyNormalFieldConditions(false) 
    if (isEmpty(fieldConditions)){
      this.addFilterelement( this.firstUnusedFieldName() || 'No fieldname found' )
    }
    else
      Object.entries(fieldConditions).forEach(([fieldName, condition]) => 
        this.addFilterelement(fieldName, condition)
    )
  }

  get returnValue(): FieldConditions<E>  {
    var result : FieldConditions<Partial<E>> = {}
    for(let formGroup of this.filterElements.controls){   
      const conditionControl = formGroup.get(conditionControlName) as FilterExpressionControl
      const fieldNameControl = formGroup.get(fieldNameControlName) as FormControl
      if (conditionControl.value.length > 0)
        result[fieldNameControl.value as keyof E] = conditionControl.condition.translateEnumsInv()
    } 
    return result
  }

  get caption():string { return this.title||''}
  filterElements : FormArray = new FormArray( [] )
  fieldNames? : string []
  
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
    return this.filterElements.controls.map( control => {return (control as FormGroup).controls[fieldNameControlName].value} )
  }
  fieldNameControl(filterElement      : AbstractControl) : FormControl { return (filterElement as FormGroup).controls[fieldNameControlName] as FormControl}
  fieldConditionControl(filterElement : AbstractControl) : FilterExpressionControl { return (filterElement as FormGroup).controls[conditionControlName] as FilterExpressionControl}

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
    return columnType == FieldTypes.Enum ? { path : `${this.entityName}.${fieldName}Options`, service : this.translate} : undefined
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
    if (_fieldName?.length && this.filters) {
      const colMetadata = this.filters.fieldsMetadata.get(_fieldName)
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
    const colMetadata = (this.filters as ClientFilters<EntityLiteral>).assertGetFieldMetadata(newFieldName as string)
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

}

export function filterDialog<E extends Entity>(modal : BsModalService, 
                                               dlgData : IFilterDialogData<Entity>) : Promise<FieldConditions<E>>{
  return openDialog(modal, FilterDialogComponent, { initialState : dlgData })
}

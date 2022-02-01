import { Component, OnDestroy, AfterViewChecked, Injector } from '@angular/core'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'
import _, { isEmpty } from 'lodash'
import { EntityLiteral } from 'mel-common'

import { EntityMetadata } from 'mel-client'
import { filterDialog } from '../filter-dialog/filter-dialog.component';
import { EntityService } from 'mel-client'
import { EntityListLiteral } from 'mel-client'
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal'
import { MelModal, openDialog } from '../mel-modal'
import { Entity } from 'mel-client'
import { ILookupDialogData, ILookupDialogResult, ILookupFor } from './types'

const $index = Symbol('lookup-dialog-index')

@Component({
  selector: 'app-lookup-dialog',
  templateUrl: './lookup-dialog.component.html',
  styleUrls: ['./lookup-dialog.component.css'],
  providers: [ BsModalService ]
})
export class LookupDialogComponent extends MelModal<ILookupDialogData, ILookupDialogResult> 
                                   implements ILookupDialogData, OnDestroy, AfterViewChecked {
  // interface LookupDialogData
  title? : string
  lookupFor? : ILookupFor
  currValue : any
  
  constructor(private injector : Injector, public modal : BsModalService, modalRef : BsModalRef) { 
    super(modalRef)
  }
  // abstract member implementation
  get returnValue() : ILookupDialogResult | undefined {
    return { 
      selectedRow : this.selectedRow as Entity,
      key : this.returnFieldname  
    }
  }
  caption : string = ''
  selection   = new SelectionModel<EntityListLiteral>(false, [], true)
  datasource  = new MatTableDataSource<EntityListLiteral>()
  private _rec? : EntityService<EntityLiteral>
  displayColumns : string [] = []
  captions : string[] = []
  scollToIndex? : string 
  _selectedRow? : EntityListLiteral
  returnFieldname : string = ''    //selected field in selectedRow
  

  get selectedRow() : EntityListLiteral | undefined { return this._selectedRow}
  set selectedRow(rowToSelect : EntityListLiteral | undefined) { 
    this.scollToIndex = this._selectedRow ? undefined : String(rowToSelect? rowToSelect[$index]: undefined)
    this._selectedRow = rowToSelect
  }
  get Rec() { return this._rec as EntityService<EntityLiteral>}
  
  override set dlgData(data: ILookupDialogData) {    
    if (data.title) this.title = data.title
    if (data.currValue) this.currValue = data.currValue
    if (data.lookupFor){
      this.lookupFor = data.lookupFor
      var metadata = EntityMetadata.assertGet(data.lookupFor.entity)
      const fieldMetadata = metadata.assertGetField(data.lookupFor.fieldName )
      if (fieldMetadata.tableRelation) {  
        this.returnFieldname = fieldMetadata.tableRelation.RelatedFieldName 
        //get the metadata of the tablerelations-table   
        metadata = EntityMetadata.assertGet(fieldMetadata.tableRelation.RelatedTableName)
        this._rec = EntityService.create(this.injector, metadata.target.name )           
        
        /// TODO !!!!!
        //if (columnMetadata.tableRelation.filters)
        //  this.Rec.setFilters(columnMetadata.tableRelation.filters)     
      }
      else {
        this._rec = EntityService.create(this.injector, metadata.target.name)
        this.returnFieldname = 'unknonwn'
      } 
      this.displayColumns = this._rec.metadata.displayedFields.lookup || []
      this.captions = []
      for( let name of this.displayColumns){
        this.captions.push(this._rec.getFieldMd(name).display?.caption || '')
      }
      this.caption = this.Rec.metadata.captionPlural || '' 
      this.refresh()
    }
  }


  ngAfterViewChecked(){
    if (this.scollToIndex){
      const elem = document.getElementById(this.scollToIndex)
      if (elem) {
        elem.scrollIntoView({block:'start', behavior:'auto'})
      }
    }
  }
  ngOnDestroy(): void {
    this.datasource.disconnect();
  }
  
  refresh(){
    this.Rec.findMany([{ 
      error : err => console.log("Lookup-Error: " + err),
      complete : () => {
        if (this.Rec.dataSet){
          this.datasource.data = this.Rec.dataSet.map( 
            (entity, index) => (entity as EntityListLiteral)[$index] = index) as unknown as EntityListLiteral[]
          //this.rec.dataSet.forEach( (entity, index) => entity[$index] = index ) 
          //this.datasource.data = this.rec.dataSet
          this.datasource.connect(); 
          this.datasource.sort;
          if (this.currValue){
            const rows = this.datasource.data.filter(entity => entity[this.returnFieldname] === this.currValue, this)        
            if (!isEmpty(rows))
              this.toggle( rows[0] )
          }
        }
      }
    }])
  }
  afterFindMany(entities : EntityLiteral[]) : EntityLiteral[]{
    return entities
  }
  
  toggle(row : EntityListLiteral): void {
    this.selection.toggle(row);
    if (this.selection.isSelected(row)){
      this.selectedRow = row;
    }
  }
  getBackgroundColor(row : EntityListLiteral, index : number){
    const isSelected = this.selection.isSelected(row)
    const odd = (index & 1) == 0
    return isSelected? 'LightYellow' : (odd ? 'WhiteSmoke' : '')
  }

  runFilterDialog(){
    filterDialog(this.modal, {
        entityName : this.Rec.singularName,
        filters : this.Rec.getNormalFilters(false)
    })
    .then( result => this.Rec.setFilters(result) )
  }
}

export function lookupDialog(modal : BsModalService, 
                             dlgData : ILookupDialogData) : Promise<ILookupDialogResult>{
  return openDialog(modal, LookupDialogComponent, { initialState : dlgData })
}

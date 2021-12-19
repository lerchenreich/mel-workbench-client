import { Component, OnDestroy, Inject,  AfterViewChecked, Injector} from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'
import { isEmpty } from 'lodash'

import { EntityMetadata } from '../../../metadata/entities'
import { IFilterDialogData, FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { EntityService } from 'src/app/services/core/entityService'
import { LookupDialogData, ILookupDialogResult } from '../../core/types'
import { EntityListLiteral, EntityLiteral } from 'src/app/types'


const $index = Symbol('lookup-dialog-index')

@Component({
  selector: 'app-lookup-dialog',
  templateUrl: './lookup-dialog.component.html',
  styleUrls: ['./lookup-dialog.component.css']
})
export class LookupDialogComponent implements OnDestroy, AfterViewChecked {
  caption : string
  selection   = new SelectionModel<EntityListLiteral>(false, [], true)
  datasource  = new MatTableDataSource<EntityListLiteral>()
  rec : EntityService<EntityLiteral>
  displayColumns : string []
  captions : string[]
  currValue : any
  scollToIndex? : string 
  _selectedRow? : EntityListLiteral
  get selectedRow() : EntityListLiteral | undefined { return this._selectedRow}
  set selectedRow(rowToSelect : EntityListLiteral | undefined) { 
    this.scollToIndex = this._selectedRow ? undefined : String(rowToSelect? rowToSelect[$index]: undefined)
    this._selectedRow = rowToSelect
  }
  returnFieldname : string    //selected field in selectedRow

  constructor(@Inject(MAT_DIALOG_DATA) 
              data: LookupDialogData,
              private injector : Injector,
              private filterDialog : MatDialog) {                
    // get the tablerelation of the data.columnName
    // we find the tablerelation in the metadata of the calling table
    var metadata = EntityMetadata.assertGet(data.lookupFor.entity)
    const fieldMetadata = metadata.assertGetField(data.lookupFor.fieldName )
    if (fieldMetadata.tableRelation) {  
      this.returnFieldname = fieldMetadata.tableRelation.RelatedFieldName 
      this.currValue = data.currValue
      //get the metadata of the tablerelations-table   
      metadata = EntityMetadata.assertGet(fieldMetadata.tableRelation.RelatedTableName)
      this.rec = EntityService.create(injector, metadata.target.name)           
      
      
      /// TODO !!!!!
      //if (columnMetadata.tableRelation.filters)
      //  this.rec.setFilters(columnMetadata.tableRelation.filters)     
      
    }
    else {
      this.rec = EntityService.create(injector, metadata.target.name)
      this.returnFieldname = 'unknonwn'
    } 
    this.displayColumns = this.rec.entityMetadata.displayedFields.lookup || []
    this.captions = []
    for( let name of this.displayColumns){
      this.captions.push(this.rec.assertGetFieldMd(name).display?.caption || '')
    }
    this.caption = data.title || 'pluralCaption' 
    this.refresh()
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
    this.rec.findMany([{ 
      error : err => console.log("Lookup-Error: " + err),
      complete : () => {
        if (this.rec.dataSet){
          this.datasource.data = this.rec.dataSet.map( 
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
  getDialogResult(ok : boolean) : ILookupDialogResult {
    return { 
      ok : ok,
      selectedRow   : this.selectedRow as EntityLiteral,
      key : this.returnFieldname  
    }
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
    var filterData : IFilterDialogData = {
      entityName : this.rec.singularName,
      filters : this.rec.getNormalFilters(false)
    }
    this.filterDialog.open(FilterDialogComponent, {disableClose : true, autoFocus : true, data : filterData})
    .afterClosed().subscribe( conditions  => {
      if (conditions){
        this.rec.setFilters(conditions)
      }
    });
  }
}

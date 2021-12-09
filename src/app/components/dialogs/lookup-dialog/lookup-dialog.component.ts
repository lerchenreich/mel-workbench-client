import { Component, OnDestroy, Inject,  AfterViewChecked, Injector} from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'

import { EntityMetadata } from '../../../metadata/entities'
import { IFilterDialogData, FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { EntityService } from 'src/app/services/core/entityService'
import { LookupDialogData, ILookupDialogResult } from '../../core/types'


const $index = Symbol('lookup-dialog-index')

@Component({
  selector: 'app-lookup-dialog',
  templateUrl: './lookup-dialog.component.html',
  styleUrls: ['./lookup-dialog.component.css']
})
export class LookupDialogComponent implements OnDestroy, AfterViewChecked {
  caption : string
  selection : SelectionModel<Object>;
  datasource  = new MatTableDataSource<Object>()
  rec : EntityService<Object>
  displayColumns : string []
  captions : string[]
  currValue : any
  scollToIndex : string = undefined
  _selectedRow : Object  = undefined
  get selectedRow() : Object { return this._selectedRow}
  set selectedRow(row : Object) { 
      this.scollToIndex = this._selectedRow ? undefined : String(row[$index])
      this._selectedRow = row
  }
  returnKey : string    //selected field in selectedRow

  constructor(@Inject(MAT_DIALOG_DATA) 
              data: LookupDialogData,
              private injector : Injector,
              private filterDialog : MatDialog) {                
    // get the tablerelation of the data.columnName
    // we find the tablerelation in the metadata of the calling table
    var metadata = EntityMetadata.get<any>(data.lookupFor.entity)
    const columnMetadata = metadata.columnsMap.get(data.lookupFor.fieldName )
    if (columnMetadata.tableRelation) {  
      this.returnKey = columnMetadata.tableRelation.RelatedFieldName 
      this.currValue = data.currValue
      //get the metadata of the tablerelations-table   
      metadata = EntityMetadata.get(columnMetadata.tableRelation.RelatedTableName)
      this.rec = EntityService.create(injector, metadata.target.name)           
      
      
      /// TODO !!!!!
      //if (columnMetadata.tableRelation.filters)
      //  this.rec.setFilters(columnMetadata.tableRelation.filters)     
      
      
      this.selection = new SelectionModel<Object>(false, [], true)
    }
    else {
      this.rec = EntityService.create(injector, metadata.target.name)
    } 
    this.displayColumns = this.rec.entityMetadata.displayedColumns.lookup
    this.captions = []
    for( let name of this.displayColumns){
      this.captions.push(this.rec.columnsMetadataMap.get(name as keyof Object).display.caption)
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
        this.rec.dataSet.forEach( (entity, index) => entity[$index] = index ) 
        this.datasource.data = this.rec.dataSet
        this.datasource.connect(); 
        this.datasource.sort;
        if (this.currValue){
          const rows = this.datasource.data.filter(entity => entity[this.returnKey] === this.currValue, this)        
          this.toggle( rows[0] )
        }
      }
    }])
  }
  afterFindMany(entities) : Object[]{
    return entities
  }
  getDialogResult(ok : boolean) : ILookupDialogResult {
    return { 
      ok : ok,
      selectedRow   : this.selectedRow,
      key : this.returnKey  
    }
  }
  toggle(row : Object): void {
    this.selection.toggle(row);
    if (this.selection.isSelected(row)){
      this.selectedRow = row;
    }
  }
  getBackgroundColor(row : Object, index : number){
    const isSelected = this.selection.isSelected(row)
    const odd = (index & 1) == 0
    return isSelected? 'LightYellow' : (odd ? 'WhiteSmoke' : '')
  }

  runFilterDialog(){
    var filterData : IFilterDialogData<Object> = {
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

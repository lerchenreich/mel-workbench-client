import { Component, ElementRef,Injector, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs'

import { GetTablesOptions } from 'mel-common';
import { AppService } from '../../../services/app-service';
import { ListPage } from '../../core/list.page';
import { ListRow } from '../../core/page-data';
import { MelTable } from '../../../models/mel-table';
import { EntityLiteral, FieldMetadata, FieldsMdMap } from 'src/app/types';
import { EntityMetadata } from 'src/app/metadata/entities';

@Component({
  selector: 'apptables-dialog',
  templateUrl: './apptables-dialog.component.html',
  styleUrls: ['./apptables-dialog.component.css']
})
export class AppTablesDialogComponent extends ListPage<MelTable> implements OnInit{

  activeTables : string [] = []
 
  constructor(  public dialogRef: MatDialogRef<AppTablesDialogComponent>, private appService : AppService,
                injector : Injector, translateService : TranslateService, dialog : MatDialog, snackBar  : MatSnackBar) { 
    super(injector, translateService, dialog, snackBar)
    this.entityName = MelTable.name
  }

  @ViewChild('page',        { read: ElementRef }) pageRef?: ElementRef<HTMLElement>
  @ViewChild('pageSlider',  { read: ElementRef }) pageSliderRef?: ElementRef<HTMLDivElement>
  @ViewChild('pageTable',   { read: ElementRef }) tableRef?: ElementRef<HTMLTableElement>

  get pageSliderElement(): HTMLDivElement | null { return this.pageSliderRef?.nativeElement || null }
  get tableElement() : HTMLTableElement | null   { return this.tableRef?.nativeElement      || null }

  /* Hooks */

  ngOnInit(){
    super.ngOnInit()
    //if (this.viewFilters)
    //  this.setFilters(this.viewFilters.fieldFilters)  
    this.afterFilterChanged()
  }

  cancelClicked() {
    this.dialogRef.close()
  }
  /**
   * retrieve all tables
   */
  protected retrieveData() {
    var activeTables : string[] 
    this.setFilter("Active", "1").findMany()
    .subscribe(
      tables => { activeTables = tables.map(table => `\`${table.Name}\``)},
      error =>  { this.alertError("getTableNames-Error: " + error)},
      () =>     {
        const options : GetTablesOptions = { 
                database : '', 
                condition :  activeTables.length > 0 ? ` NOT IN (${activeTables.join(",")})` : undefined
              } 
        forkJoin([this.appService.getAppTableNames(options), this.appService.getMelTableNames(options)])
        .subscribe( 
          ([namesApp, namesMel]) => { 
            const rec = this.assertRecService
            rec.dataSet = namesApp.map(name => new MelTable({ Name : name }))
                                                    .concat(namesMel.map(name => new MelTable({ Name : name })))
            this.totalRecCount = rec.dataSet.length 
          },
          err => {
            this.alertError("getTableNames-Error: " + err)
          },
          () => {
            this.currPageNo = 1; 
            this.refresh()
          }
        )  
    
      })
  }

  refresh(){
    this.setViewMode()
    this.pageCeil = Math.round(this.totalRecCount / this.pageSize)
    this.dataSource.data = this.recordSet.map( (entity, index) => new ListRow(entity, this.fieldsMdMap as FieldsMdMap, index))
    this.dataSource.connect()
  }
  /**
   * dialog returnvalue
   */
  selectedTables() : string[] {
    return this.listComponent ? this.listComponent.selectedRowIndices.map(i => this.recordSet[i].Name as string ) :[]
  }
}

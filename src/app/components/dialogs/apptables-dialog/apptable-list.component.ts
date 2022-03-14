import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { NgbModalRef as ModalRef, NgbModal as ModalService } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs'

import { GetTablesOptions } from 'mel-common';
import { AlertService, AppService, MelTableService,ListDbPage, RowUI, MelTable } from "mel-client"


@Component({
  selector: 'apptable-list-dialog',
  templateUrl: './apptable-list.component.html'
})
export class AppTableListComponent extends ListDbPage<MelTable> implements OnInit{
  activeTables : string [] = []
  transPrefix = 'App.Dialog.AppTables.'
  constructor(public modalRef : ModalRef,
              private appService : AppService,
              melTableService : MelTableService,
              translate : TranslateService,
              modal : ModalService,
              snackBar  : MatSnackBar,
              alertService : AlertService) {
  super(melTableService, translate, modal, snackBar, alertService)
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

  okClicked() {
    this.modalRef.close(this.listComponent ? this.listComponent.selectedRowIndices.map(i => this.recordSet[i].Name as string ) :[])
  }
  dismissClicked() {
    this.modalRef.dismiss()
  }
  /**
   * retrieve all tables
   */
  protected retrieveData() {
    var activeTables : string[]
    this
      .setFilter("Active", "1")
      .findMany()
      .subscribe({
        next : tables => { activeTables = tables.map(table => `\`${table.Name}\``)},
        error : error =>  { this.alertError("getTableNames-Error: " + error)},
        complete : () =>     {
          const options : GetTablesOptions = {
                  database : '',
                  condition :  activeTables.length > 0 ? ` NOT IN (${activeTables.join(",")})` : undefined
                }

          forkJoin([this.appService.getAppTableNames(options), this.appService.getMelTableNames(options)])
          .subscribe( {
            next : ([namesApp, namesMel]) => {
              this.Rec.dataSet = namesApp.map(name => new MelTable({ Name : name }))
                                                      .concat(namesMel.map(name => new MelTable({ Name : name })))
              this.totalRecCount = this.Rec.dataSet.length
            },
            error : err => {
              this.alertError("getTableNames-Error: " + err)
            },
            complete : () => {
              this.currPageNo = 1;
              this.refresh()
            }
          })
        }
      })
  }

  refresh(){
    this.setViewMode()
    this.pageCeil = Math.round(this.totalRecCount / this.pageSize)
    this.dataSource.data = this.recordSet.map( (entity, index) => {
      const row = new RowUI<MelTable>(MelTable.name, index)
      row.initialize(entity)
      return row
    })
    this.dataSource.connect()
  }

}

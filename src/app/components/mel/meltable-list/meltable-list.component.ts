
import { AfterViewInit, Component, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { TableMetadata } from 'mel-common/api';
import { SqlToFieldtypes } from 'mel-common/types'

import { ListRouted } from '../../core/list.routed';
import { MelTable } from '../../../models/mel-table';
import { AppTablesDialogComponent } from '../../dialogs/apptables-dialog/apptables-dialog.component';
import { EntityService } from '../../../services/core/entityService';
import { forkJoin, Observable, BehaviorSubject, Subject} from 'rxjs';
import { ColumnInfo } from '../../../types'
import { MelField } from '../../../models/mel-field'
import { MelFieldService } from '../../../services/melservices';
import { DialogButtons, IMessageDialogData, MessageDialogComponent, MessageResults } from '../../dialogs/message-dialog/message-dialog.component';
import { ProgressDialogComponent } from '../../dialogs/progress-dialog/progress-dialog.component';

import { AppService } from '../../../services/app-service'


@Component({
  selector: 'app-meltable-list',
  templateUrl: './meltable-list.component.html',
  styleUrls: ['../../core/list.component.css']
})
@UntilDestroy()
export class MelTableListComponent extends ListRouted<MelTable> implements  AfterViewInit {
  
  constructor(private appService : AppService,
              private melFieldService : MelFieldService,
              injector :  Injector, router: Router, translateService : TranslateService, 
              dialog : MatDialog, snackBar : MatSnackBar) { 
    super(MelTable, router, injector, translateService, dialog, snackBar)
    this.accessRights = "md"
    router.events.pipe(untilDestroyed(this)).subscribe( event => {
      if (event instanceof NavigationEnd){
        this.retrieveData()
      }
    })
  }


  //#region Tableimport
  /**
   * Import the table metadata from the database
   * Shows a list of all tables in the database which are existent or not marked as active in MelTable 
   * where the user can select the tables to import. Existing tables would be overwritten,
   * new tables are created with their columns of course
   * @param $event 
   */
  importTables($event){
    var tableNames = this.listComponent.selectedRowIndices.length? this.listComponent.selectedRowIndices.map( rowIndex => this.recordSet[rowIndex].Name ) : []
    if (tableNames.length){
      var dlgData : IMessageDialogData  = {
        title : 'Message.Import.Metadata.Title',
        message : `${this.translate.instant('Message.Import.Metadata.Text')} [${tableNames.join(', ')}]`,
        buttons : DialogButtons.YesNo,
        default : MessageResults.YesOk
      }
      this.dialog
        .open(MessageDialogComponent,{data : dlgData})
        .afterClosed()
        .pipe( untilDestroyed(this), map( (answer:MessageResults) => answer == MessageResults.YesOk))
        .subscribe(answer => {
          if (answer)
            this._importTables(tableNames)
          else
            this.snack(this.translate.instant('Message.Canceled'))
        })  
    }
    else {
      this.dialog
        .open(AppTablesDialogComponent, {hasBackdrop: true, disableClose : true})
        .beforeClosed()
        .pipe(untilDestroyed(this))
        .subscribe( (dlg : AppTablesDialogComponent)=> {
          if (dlg) {
            tableNames = dlg.selectedTables()
            if (tableNames.length)
              this._importTables(tableNames)
          }
        })
    }
  }
  /**
   * Imports the metadata of the tables in tablenames into the MelTable- and MelField-table 
   * After the tablemetadata are read, the missing records in MelTable are inserted.
   * For all received tableinfos, the columns are updated or inserted. No column will be deleted
   * When all columns are completed, a message is shown.
   * Note: to serialize the writeactions for the MelTable, a tablesInfoIterator is used. 
   *       Only if all columns are written, the next MelTable will be handeled  
   * @param tableNames 
   */
  private _importTables(tableNames : string[]){
  //  forkJoin([this.infoService.getDbTableRelations({ columnInfo : false, condition : ` IN ('${tableNames.join("','")}')` }),
    this.appService.getAppTablesMetadata( { columnInfo : true, condition : ` IN ('${tableNames.join("','")}')` } )
  //])
    .pipe(untilDestroyed(this))
    .subscribe( (tablesMetadata) => {
        var dlgConfig : MatDialogConfig = undefined
        var dlgRef : MatDialogRef<ProgressDialogComponent>
        if (tablesMetadata.length > 3){
          dlgConfig = { data : { max : tablesMetadata.length, textType : "dark", type : "success", height : "3em" }, hasBackdrop : true, disableClose : true } 
          dlgRef = this.dialog.open(ProgressDialogComponent, dlgConfig)
        }
        var tablesMetadataIterator = new BehaviorSubject<TableMetadata>(tablesMetadata.pop())
        tablesMetadataIterator.asObservable()
        .pipe(untilDestroyed(this))
        .subscribe(
          tableMetadata =>  {
            if (tableMetadata) {
              if (dlgConfig){
                dlgConfig.data.title = 'Dialog.MetadataImport.ProgressTitle'
                dlgConfig.data.label = tableMetadata.Name
                dlgConfig.data.current += 1
              }
              this.rec.Name = tableMetadata.Name
              this.get().subscribe( 
                melTable => { 
                  if (melTable) 
                    this.upsertMelColumns(tableMetadata)
                      .pipe(untilDestroyed(this))
                      .subscribe( () => {
                       // this.upsertTableRelations(sqlTable)
                        tablesMetadataIterator.next(tablesMetadata.pop())
                      })
                  else {
                    this.rec.Name = tableMetadata.Name 
                    /*this.rec[PrimaryIndex] = 
                      sqlTable.columns
                        .filter(colInfo => colInfo.primaryKey)
                        .map(colInfo => colInfo.name)
                        .join(',')
                    */   
                    this.insert().subscribe( { 
                      error: error => this.alertError(error), 
                      complete: () => this.upsertMelColumns(tableMetadata)
                        .pipe(untilDestroyed(this))
                        .subscribe(() => {
                         // this.upsertTableRelations(sqlTable)
                          tablesMetadataIterator.next(tablesMetadata.pop())
                        }) 
                    })
                  }
                },
                err => { console.error(err)}
                
              )
            }
            else {
              if (dlgRef) dlgRef.close()
              this.snack(this.translate.instant("Message.Import.Metadata.Done"))
              this.refresh() 
            }
          }  
        ) // subscribe
      },
      error => this.alertError(error)
    )
  }
 
  upsertTableRelations(md : TableMetadata){

  }
  /**
   * Upserts the MelField from TableMetadata.Columns
   * @param md 
   */
  upsertMelColumns(md : TableMetadata) : Observable<boolean> {
    const resultSubject = new Subject<boolean>()
    const result$ = resultSubject.asObservable()
    var columnObservables : Observable<MelField>[] = []
    
    var keyNo = 0
    var colInfos : ColumnInfo[] = md.Columns.sort( (a,b) => a.SequenceNo - b.SequenceNo) 
    for(let colInfo of colInfos)
      if (!!colInfo.PrimaryKey) colInfo.PrimaryKeyNo =  ++keyNo 
     
    this.melFieldService.setRange('TableName', md.Name).findMany().subscribe( 
      melFields => {
        if (melFields) {
          colInfos.forEach(colInfo => {
            const melColumn = melFields.find(col => col.Name === colInfo.Name)
            if (melColumn)
              columnObservables.push(this.updateMelColumn(colInfo, melColumn))
            else
              columnObservables.push(this.insertMelColumn(md.Name, colInfo))
          })
        }
        else {
          for(let colInfo of colInfos)
            columnObservables.push(this.insertMelColumn(md.Name, colInfo))
        }
      },
      error => this.alertError(error),
      () =>   forkJoin(columnObservables)
              .pipe(untilDestroyed(this))
              .subscribe( 
                next  => resultSubject.next(true),
                error => resultSubject.error(error), 
                ()    => resultSubject.complete() 
              )
    )
    return result$
  }

  melColumnFromColInfo(melColumn : MelField, colInfo : ColumnInfo) : MelField{
    if (colInfo.EnumValues)
      melColumn.EnumValues = colInfo.EnumValues.join(',')  
    melColumn.IsAutoincrement = colInfo.Generated
    melColumn.PrimaryKeyNo = colInfo.PrimaryKeyNo 
    melColumn.Length = colInfo.Length
    melColumn.Name = colInfo.Name
    melColumn.Nullable = colInfo.Nullable
    melColumn.SqlDatatype = colInfo.DataType
    melColumn.Class = 'Normal'
    return melColumn
  }

  insertMelColumn(tableName : string, colInfo : ColumnInfo) : Observable<MelField>{
    const colService = EntityService.createFrom(this.melFieldService)
    const datatype = colInfo.ColumnType === 'tinyint(1)' ? 'TINYINT(1)' : colInfo.DataType // spcial case boolean
    var melColumn = new MelField({
      TableName : tableName,
      Datatype : SqlToFieldtypes[datatype.toUpperCase()],
      Updateable : true,
      PrimaryKeyNo : colInfo.PrimaryKeyNo,
      Comment : 'autocreated',
      DefaultValue : colInfo.Default,
      FlowFormula : '',
      Format : ''  
    })
    colService.assignData(this.melColumnFromColInfo(melColumn, colInfo))
    return colService.insert()
  }

  updateMelColumn(colInfo : ColumnInfo, melColumn : MelField) : Observable<MelField> {
    const colService = EntityService.createFrom(this.melFieldService)
    colService.assignData(Object.assign(colService.data, this.melColumnFromColInfo(melColumn, colInfo)))
    return colService.update()
  }
  //#endregion
}

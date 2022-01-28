
import { AfterViewInit, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable, BehaviorSubject, Subject}  from 'rxjs';

import { map } from 'rxjs/operators'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { TableMetadata, sqlToFieldtypesMap} from 'mel-common'
import { ListRouted, MelTable, FieldInfo, MelField, MelTableService, AlertService, 
         ProgressDialogData, MessageBox, MsgDialogButton, MsgDialogData, MsgResult, 
        ProgressDialogComponent, AppService, MelFieldService, EntityService } from 'mel-client'

import { AppTablesDialogComponent }                   from '../../dialogs/apptables-dialog/apptables-dialog.component';       
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-meltable-list',
  templateUrl: './meltable-list.component.html',
  styleUrls: ['./meltable-list.css'],
  providers: [{provide : MelTableService}]
})
@UntilDestroy()
export class MelTableListComponent extends ListRouted<MelTable> implements  AfterViewInit {
  
  constructor(private appService : AppService,
              private melFieldService : MelFieldService,
              entityService : MelTableService,
              router: Router, translate : TranslateService, 
              modal : BsModalService, snackBar : MatSnackBar,
              alertService : AlertService) { 
    super(router, entityService, translate, modal, snackBar, alertService)
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
  importTables($event:any){
    var tableNames = (this.listComponent?.selectedRowIndices.map( rowIndex => this.recordSet[rowIndex].Name ) || []) as string[]
    if (tableNames.length){
      var dlgData : MsgDialogData  = {
        title : 'Message.Import.Metadata.Title',
        message : `Message.Import.Metadata.Text`,
        buttons : MsgDialogButton.YesNo,
        default : MsgResult.Positive
      }
      MessageBox(this.modal, dlgData)
        .pipe( untilDestroyed(this), map( (answer:MsgResult) => answer == MsgResult.Positive))
        .subscribe(ok => {
          if (ok)
            this._importTables(tableNames)
          else
            this.snack(this.translate.instant('Message.Canceled'))
        })  
    }
    else {
      const dlgRef = this.modal.show(AppTablesDialogComponent, {backdrop: 'static'})
      dlgRef.onHide?.subscribe( { 
        next : (dc : any) => {
          tableNames = dlgRef.content?.resultValue || []
          if (tableNames.length)
            this._importTables(tableNames)
        }})
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
    var canceled : boolean = false
    var progressDlgRef : BsModalRef<ProgressDialogComponent>
    this.appService.getAppTablesMetadata( { database:'', columnInfo : true, condition : ` IN ('${tableNames.join("','")}')` } )
    .pipe(untilDestroyed(this))
    .subscribe( {
      next : tablesMetadata => {
        if (tablesMetadata.length > 0){
         
          if (tablesMetadata.length > 3){  
            progressDlgRef = this.modal.show(ProgressDialogComponent, {
              backdrop : 'static',
              initialState : { 
                title : 'Dialog.MetadataImport.ProgressTitle', 
                max : tablesMetadata.length, 
                type : "success", 
                height : "3em" 
              }  
            })
            progressDlgRef.onHide?.subscribe( () => { canceled = true; throw 'Canceled'})
          }
          try {
            var tablesMetadataIterator = new BehaviorSubject<TableMetadata>(tablesMetadata.pop() as TableMetadata)
            tablesMetadataIterator.asObservable()
            .pipe(untilDestroyed(this))
            .subscribe( {
              next : tableMetadata =>  {
                if (tableMetadata && !canceled) {
                  if (progressDlgRef && progressDlgRef.content){
                    progressDlgRef.content.label = tableMetadata.Name
                    progressDlgRef.content.current += 1
                  }
                  this.rec.Name = tableMetadata.Name
                  this.get().subscribe( {
                    next : melTable => { 
                      if (melTable) 
                        this.upsertMelColumns(tableMetadata)
                          .pipe(untilDestroyed(this))
                          .subscribe( () => {
                          // this.upsertTableRelations(sqlTable)
                            tablesMetadataIterator.next(tablesMetadata.pop() as TableMetadata)
                          })
                      else {
                        this.rec.Name = tableMetadata.Name 
                        this.insert().subscribe( { 
                          error: error => { this.alertError(error); throw error }, 
                          complete: () => this.upsertMelColumns(tableMetadata)
                            .pipe(untilDestroyed(this))
                            .subscribe(() => {
                            // this.upsertTableRelations(sqlTable)
                              tablesMetadataIterator.next(tablesMetadata.pop() as TableMetadata)
                            }) 
                        })
                      }
                    },
                    error : err => { console.error(err); throw err }
                  })
                }
                else {
                  if (progressDlgRef) 
                    progressDlgRef.hide()
                  this.snack(this.translate.instant("Message.Import.Metadata.Done"))
                  this.refresh() 
                }
              }
            }) // subscribe
          }
          catch(error){ 
            if ( canceled ){
              this.snack(this.translate.instant("Message.Import.Metadata.Canceled"))
            }
            else {
              if (progressDlgRef) 
                progressDlgRef.hide()
              this.snack(this.translate.instant("Message.Import.Metadata.Error"))
            }    
          }
        }
      },
      error : error => this.alertError(error)
    })
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
    var colInfos : FieldInfo[] = md.Columns.sort( (a,b) => a.SequenceNo - b.SequenceNo) 
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

  melColumnFromColInfo(melColumn : MelField, colInfo : FieldInfo) : MelField{
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

  insertMelColumn(tableName : string, colInfo : FieldInfo) : Observable<MelField>{
    const colService = EntityService.createFrom(this.melFieldService)
    const datatype = colInfo.ColumnType === 'tinyint(1)' ? 'TINYINT(1)' : colInfo.DataType // spcial case boolean
    var melColumn = new MelField({
      TableName : tableName,
      Datatype : sqlToFieldtypesMap.get(datatype.toUpperCase()),
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

  updateMelColumn(colInfo : FieldInfo, melColumn : MelField) : Observable<MelField> {
    const colService = EntityService.createFrom(this.melFieldService)
    colService.assignData(Object.assign(colService.data, this.melColumnFromColInfo(melColumn, colInfo)))
    return colService.update()
  }
  //#endregion
}

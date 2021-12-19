
import { ViewChild, Directive, Injector, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEmpty } from 'lodash';
import { ListPage } from './list.page';
import { PageTypes } from './types';
import { EntityLiteral } from 'src/app/types';

//function log(msg){ console.log(msg) }
/**
 * Basisklasse für alle gerouteten Listen
 * Abgeleitete Klassen -> alle {entityname}List
 */
@Directive()
@UntilDestroy()
export abstract class ListRouted<Entity extends EntityLiteral> extends ListPage<Entity> implements OnInit, AfterViewInit {

    constructor(private entityFunc : Function, 
                private router : Router,
                injector : Injector, 
                translateService : TranslateService,
                dialog : MatDialog, 
                snackBar  : MatSnackBar) {     
      super(injector, translateService, dialog, snackBar)
      this.pageType = PageTypes.List
      this.entityName = entityFunc.name
      this.router.onSameUrlNavigation = "reload"
    }

    get routeToEditEntity()  : string[] { 
      var route = [this.cardRoute]
      if(this.listComponent && this.listComponent.selectedRowIndices.length){
        Object.assign(this.rec, this.recordSet[this.listComponent.selectedRowIndices[0]])
        var pkFields = this.primaryKeyFields
        if (!isEmpty(pkFields))
          route.push(...Object.values(pkFields).map( value => { return String(value) }))
      }
      return route
    } 
    get routeToAddEntity() : string[] { return [this.cardRoute,'']}
    get routePrevious() : string[] {return ['/'] }

    @ViewChild('page',        { read: ElementRef }) pageRef?: ElementRef<HTMLElement>
    @ViewChild('pageTable',   { read: ElementRef }) tableRef?: ElementRef<HTMLTableElement>
    get tableElement() : HTMLTableElement | undefined { return this.tableRef?.nativeElement }

    /* Hooks */

    ngOnInit(){
      super.ngOnInit()
      if (this.viewFilters)
        this.setFilters(this.viewFilters.filters)  
      this.afterFilterChanged()
    }

    afterFilterChanged(){
      super.afterFilterChanged()
    }

}
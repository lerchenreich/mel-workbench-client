import { AfterViewInit, Component, EventEmitter, Injector, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'

import { FilterOperators, SortOrder } from 'mel-common'
import { ClientFilters } from 'src/app/services/core/filters';

import { ListPage } from '../../core/list.page';
import { ClientCondition} from 'src/app/services/core/filter-condition';
import { PageTypes } from 'src/app/components/core/types';

/**
 * Inputstructure of entityConfig
 */
export interface EntityConfig {
  name : string,
  permissions : string,
  link? : Object,
  view? : Object,
  sort? : SortOrder<any>
}
/**
 * The ListPart-Component is derived from ListComponent and shows a list of an entity. 
 * You can link this list to another entity, filter and sort it.
 * Inputs:                                               Example
 * - entity: the entity to list  (mandatory)            'UsageEntry'
 * - link:   the stringified filter of the entity       '{"MediumCode":"{{rec.Code}}"}'
 * - sort:   the stringified sortorder                  '{"PostingDate":"DESC"}'
 * - view:   additional filters           toDo: Merge filters to complex filters
 * - pagesize: the number of rows to display (default = 20)
 * - expanded : "false" to hide the list (default = true)
 * - permissions: 'imd' i=insert-, m=modify-, d=delete-permission; "i" implies "m" 
 *                default: empty; must only contain the character
*/
@Component({
  selector: 'list-part',
  templateUrl: './list-part.component.html',
  styleUrls: ['../../core/list.component.css']
})
@UntilDestroy()
export class ListPartComponent extends ListPage<Object> implements OnInit, AfterViewInit {
  private entityConfig : EntityConfig

  constructor(injector : Injector, translate: TranslateService, dialog : MatDialog, snackBar : MatSnackBar) {
    super(injector, translate, dialog, snackBar)
    this.pageType = PageTypes.ListPart
  }

  @Input('entityConfig') set _entityConfig(config : string){ 
    this.entityConfig = JSON.parse(config) 
    this.entityName = this.entityConfig.name
  }

  @Input() expanded : boolean
  @Input('pageSize')  set _pageSize(n : number) { this.pageSize = n }
  @Input('locked')    set _locked(b : boolean) { this.locked = b}
  

  ngOnInit(){
    super.ngOnInit()
    this.accessRights = this.entityConfig.permissions
    this.listContext.permissions = this.permissions
    //console.info(`${this.constructor.name}.OnInit, Permissions: "${this.permissions.permissionString}"`)
    if (!isEmpty(this.entityConfig.link)){
      const linkedFilter = new ClientFilters(this.columnsMap) 
      Object.entries(this.entityConfig.link).forEach( ([fieldName, value]) => 
        linkedFilter.filters[fieldName] = new ClientCondition(FilterOperators.unknown, [value], this.columnsMap.get(fieldName as keyof Object).type))
      this.mergeFilters(linkedFilter) 
      this.lockFilters(Object.keys(linkedFilter.filters))
    }
    if (!isEmpty(this.entityConfig.view)){
      this.viewFilters = new ClientFilters(this.columnsMap) 
      Object.entries(this.entityConfig.view).forEach( ([fieldName, value]) => 
        this.viewFilters.filters[fieldName] = new ClientCondition(FilterOperators.unknown, [value], this.columnsMap.get(fieldName as keyof Object).type))
      this.mergeFilters(this.viewFilters) 
    }
    if (!isEmpty(this.entityConfig.sort))
      this.sortOrder = this.entityConfig.sort
      
    this.afterFilterChanged()
  }

  ngAfterViewInit() {
    
    super.ngAfterViewInit()
  }

}


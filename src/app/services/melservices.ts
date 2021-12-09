import { Injectable,Inject } from '@angular/core'
import { HttpClient} from '@angular/common/http'
import { camelCase } from 'lodash'

import { ClientConfig, CLIENT_CONFIG } from '../client.configs'
import { MelCompany } from '../models/mel-company'
import { MelTable } from '../models/mel-table'
import { MelField } from '../models/mel-field'
import { EntityService } from './core/entityService'

import { MelSetup } from '../models/mel-setup'

@Injectable({ providedIn: 'root' })
export class MelSetupService extends EntityService<MelSetup> {

  constructor( httpClient : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) { 
    super(MelSetup, httpClient, config);
  }
  protected get restEndpoint() : string { return  this.config.restAppEndpoint }
}

@Injectable({ providedIn: 'root' })
export class MelCompanyService extends EntityService<MelCompany> {

  constructor( httpClient : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) { 
    super(MelCompany, httpClient, config);
  }
  protected get restEndpoint() : string { return  this.config.restAppEndpoint }
}

@Injectable({ providedIn: 'root' })
export class MelTableService extends EntityService<MelTable> {

  constructor( httpClient : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) { 
    super(MelTable, httpClient, config);
  }
  protected get restEndpoint() : string { return  this.config.restAppEndpoint }

  //#region trigger
  initColumnTrigger() {
    super.initColumnTrigger()
    this.triggerMap.set("Name", this.name.bind(this))
  }
  name(row : MelField) {
    if (row?.Name.length == 0) row.Name =  camelCase(row.Name)
  }
  //#endregion
}

@Injectable({ providedIn: 'root' })
export class MelFieldService extends EntityService<MelField> {

  constructor( httpClient : HttpClient, @Inject(CLIENT_CONFIG) config : ClientConfig) { 
    super(MelField, httpClient, config);
  }
  protected get restEndpoint() : string { return  this.config.restAppEndpoint }

  initColumnTrigger() {
    super.initColumnTrigger()
    this.triggerMap.set("PrimaryKeyNo", this.primaryKeyNo.bind(this))
  }
    /* deprecated
  afterInit() : Observable<MelField> { 
  
    const last = new MelFieldService(this.httpClient, this.config, this.injector)
    return last
    .setRange("TableName", this.data.TableName)
    .findLast()
    .pipe( 
      tap(column => isEmpty(column)? this.data.Id = 1 : this.data.Id = column.Id + 1),
      map(entity => this.data)
    ) 
    
  }
  */
  primaryKeyNo(row : MelField) {
    if (row.PrimaryKeyNo < 1) delete row.PrimaryKeyNo
  }
}


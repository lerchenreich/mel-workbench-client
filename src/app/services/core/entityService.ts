import { Directive, EventEmitter, Injector, ProviderToken } from '@angular/core'
import { from, Observable, PartialObserver, Subscriber, Subscription} from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient} from '@angular/common/http'
import { isBoolean, validateSync, validate, ValidationError } from "class-validator"
import "reflect-metadata"
import { isEmpty } from 'lodash'

import { deepCopy, ErrorCategories, FilterOperators, IRenamingRequest, MelError, QueryOptions, SortOrder } from 'mel-common'

import { ClientConfig } from '../../client.configs'
import { APP_MODUL_NAME, CLIENT_MODUL_NAME, getModulProviderToken} from '../../core'
import { EntityTypes, Range, EntityLiteral, FieldsMdMap } from '../../types'
import { EntityMetadata } from '../../metadata/entities'

import { ClientFilters} from './client-filters'
import { FieldConditions,  ClientFilterCondition} from './client-filter-condition'
import { newValidationError } from './client-condition-expression'
import { FieldMetadata } from '../../types'
import { ENTITIES } from 'src/app/models/entities'
import { BaseService } from './base-service'

declare type ColumnTrigger<Entity> = (row : Entity) => void

export type UpdateResult = {
  raw?: any
  affected?: number
  generatedMaps?: EntityLiteral[]
}
export type DeleteResult = {
  raw?: any
  affected?: number
}
export type RenameResult = {
  raw?: any
  affected?: number
}

export function getQueryParam(options? : any) : string {
  return options? btoa(JSON.stringify(deepCopy(options))) : '' 
}

declare type TriggerMap = Map<string, ColumnTrigger<EntityLiteral>>
@Directive()
export class EntityService<Entity extends EntityLiteral> extends BaseService {
   
  constructor(private entityFunc : Function,  protected httpClient : HttpClient, config : ClientConfig) {  
    super(config) 
    
    this.entityMetadata = EntityMetadata.get(entityFunc)
    this.lowerSingularName = this.entityMetadata.name.toLowerCase()
    this.lowerPluralName   = this.entityMetadata.pluralName.toLowerCase()
    this._filters = new ClientFilters<Entity>(this.fieldsMdMap)
    this._data = Reflect.construct(this.entityFunc, []) 
    this._xData = Reflect.construct(this.entityFunc, [])
    this.user = this.entityFunc.name
    this.options = {}
    this.triggerMap = new Map<string, ColumnTrigger<EntityLiteral>>()
    this.initColumnTrigger()
  } 

  protected get restEndpoint() : string { return this.config.restCompanyEndpoint }
  protected readonly lowerSingularName : string
  protected readonly lowerPluralName : string
  public readonly entityMetadata : EntityMetadata
  protected beforeInsert? : Subscriber<Entity>
  protected beforeModify? : Subscriber<Entity>
  protected beforeRename? : Subscriber<Entity>
  protected beforeDelete? : Subscriber<Entity>
  //protected onNew : Subscriber<Entity>
  protected triggerMap : TriggerMap

  private beforeInsertEmitter = new EventEmitter<Object>()
  private beforeModifyEmitter = new EventEmitter<Object>()
  private beforeRenameEmitter = new EventEmitter<Object>()
  private beforeDeleteEmitter = new EventEmitter<Object>()
  private subscriptions : Subscription[] = []
 
  private _xData : EntityLiteral
  private _data : EntityLiteral         
  public dataSet? : EntityLiteral[]
  protected dataSetIndex : number = -1

  private options : QueryOptions<Entity>
  private _filters : ClientFilters<Entity>

  protected user : string
 
  static create<Entity extends EntityLiteral>(injector : Injector, entityName : string) : EntityService<Entity> {
    var serviceModuleId = ENTITIES.find( entityFunction => (entityFunction.name == entityName)) ? CLIENT_MODUL_NAME : APP_MODUL_NAME
    var service = injector.get(getModulProviderToken(entityName + 'Service', serviceModuleId) as ProviderToken<any>) as EntityService<Entity>
    if (service.entityMetadata)   // the constructor was already called --> service is used by someone else
      service = EntityService.createFrom(service)
    return service
  }
  static createFrom<Entity extends EntityLiteral>(from : EntityService<Entity>) : EntityService<Entity> {
    const svc =  Object.assign(Object.create(from), from)
    svc._filters = new ClientFilters<Entity>(svc.fieldsMdMap)
    svc._data = Reflect.construct(svc.entityFunc, []) 
    svc._xData = Reflect.construct(svc.entityFunc, [])
    svc.options = {}
    return svc
  }
  protected initColumnTrigger() {}
  afterInit() : Observable<Entity> { return from([this.data as Entity]) }

  public get data()  : EntityLiteral { return this._data }   
  public get xData() : EntityLiteral { return this._xData }
  public assignData(dataToAssign : Entity) : void { 
    this._data = Object.assign({}, dataToAssign)
    this._xData = Object.assign({}, dataToAssign)
  }
  //public get filters(): Filters<Entity>{ return this._filters }
  public get fieldsMdMap() : FieldsMdMap { return this.entityMetadata.fieldsMdMap }
  public get primaryKeys() : string[] { return this.entityMetadata.primaryKeys }
  public get singularName() : string { return this.entityMetadata.name }
  public get pluralName() : string { return this.entityMetadata.pluralName; }
  public get canWrite() : boolean { return this.entityMetadata.type === EntityTypes.table}
  public get hasFilters() : boolean { return this._filters.hasFilters }
  public get hasFlowFilters() : boolean { return this._filters.hasFlowFilters}
  public get hasActiveFlowFilters() : boolean { return this._filters.hasActiveFlowFilters }
  public get hasUnlockedFilters() : boolean { return this._filters.hasUnlockedFilters }

  public subscribeTriggers(permissions : string){
    if (this.beforeDelete && permissions.includes('d')) this.subscriptions.push(this.beforeDeleteEmitter.subscribe(this.beforeDelete))
    if (this.beforeInsert && permissions.includes('i')) this.subscriptions.push(this.beforeInsertEmitter.subscribe(this.beforeInsert))
    if (this.beforeModify && permissions.includes('m')) this.subscriptions.push(this.beforeModifyEmitter.subscribe(this.beforeModify))
    if (this.beforeRename && permissions.includes('m')) this.subscriptions.push(this.beforeRenameEmitter.subscribe(this.beforeRename))
  }
  public assertGetFieldMd(fieldName : string) : FieldMetadata<Entity>{
    const md = this.fieldsMdMap.get(fieldName)
    if (md)
      return md
    throw new Error(`Metadata of field "${fieldName} is undefined`)
  }
  public unsubscribe(){
    this.subscriptions.forEach( subscription => subscription.unsubscribe() )
  }
  public triggerColumn(name : string, row : EntityLiteral) : void {
    this.triggerMap?.get(name)?.call(this, row)
  }
  /**
   * Copies the entitydata include the dataset and the filters, if to include
   * @param from the service to copy from
  */
  public copyData(from : EntityService<Entity>) : EntityService<Entity> {        
    this._data = deepCopy(from._data)
    this._xData = deepCopy(from._xData)
    return this
  }
  public copyDataset(from : EntityService<Entity>) : EntityService<Entity> {        
    this.dataSet = deepCopy(from.dataSet)
    this.dataSetIndex = from.dataSetIndex
    return this
  }
 
  public copyParameter(fromRecord : EntityService<Entity>) : EntityService<Entity> { 
    if (fromRecord.options.parameter)
      this.options.parameter = Array.from(fromRecord.options.parameter)
    return this
  }

  public copy(fromRecord : EntityService<Entity>) : EntityService<Entity> { 
    return this
    .copyData(fromRecord)
    .copyDataset(fromRecord)
    .copyFilters(fromRecord)
    .copyParameter(fromRecord)
  }
  //#region options and conditions

  private _selectName(fieldName : (keyof Entity)): EntityService<Entity>{
    if (!this.options.select)
      this.options.select = [fieldName];
    else {
      if (!this.options.select.includes(fieldName))
        this.options.select.push(fieldName);
    }
    return this
  }
  public select(fieldNames :(keyof Entity )[]) : EntityService<Entity>{
    for(var fieldName of fieldNames)
        this._selectName(fieldName)
    return this;
  }
  public setOrder(sortOrder : SortOrder<Entity> | undefined ) : EntityService<Entity>{
    if (sortOrder)
      this.options.order = sortOrder
    else 
      delete this.options.order
    return this
  }
  public get order() : SortOrder<Entity> | undefined { return this.options.order }


  public setCalcFields(calcFieldNames : (keyof Entity)[]) : EntityService<Entity>{
    this.options.calcFields = calcFieldNames
    return this
  }
  
  public take(n : number) :EntityService<Entity>{
    if (n > 0)
      this.options.take = n
    else 
      delete this.options.take
    return this;
  }
  public skip( n : number) :EntityService<Entity>{
    if (n > 0) 
      this.options.skip = n
    else 
      delete this.options.skip
    return this;
  }
  
  public get rowRange() : Range {
    const from = this.options.skip ? this.options.skip : 0
    const until = this.options.take ? from + this.options.take : undefined
    return { from : from, until : until }
  }
 
  /**
    * resets the options 
  */
  public resetAll() :EntityService<Entity>{
    this.options = {};
    this.resetFilters()
    return this;
  }
  // ------ Filtermethods
  public lockFilters(toLock : string | string[])  : EntityService<Entity> {
    this._filters.lock(toLock)
    return this
  }

  public copyFilters(from : EntityService<Entity>) : EntityService<Entity> {
    this._filters = from._filters.copy() as ClientFilters<Entity>
    this.setOrder(from.options.order)
    return this
  }
  public copyNormalFilters(from : EntityService<Entity>, includeLocked : boolean = true) : EntityService<Entity> {
    this._filters.setNormalFilters(from._filters.copyNormalFieldConditions(includeLocked))
    return this
  }
  public copyFlowFilters(from : EntityService<Entity>, includeLocked : boolean = true) : EntityService<Entity> {
    this._filters.setFlowFilters(from._filters.copyFlowFieldConditions())
    return this
  }
  public getNormalFilters(includeLocked : boolean = true) : ClientFilters<EntityLiteral>{
    return this._filters.copyNormalFilters(includeLocked)  as ClientFilters<EntityLiteral>
  }
  public getFlowFilters() : ClientFilters<Entity>{
    return this._filters.copyFlowFilters()  as ClientFilters<Entity>
  }

  public resetNormalFilters() : EntityService<Entity>{
    this._filters.resetNormalFilters()
    return this
  }
  public resetFlowFilters() : EntityService<Entity>{
    this._filters.resetFlowFilters()
    return this
  }

  /**
   * resets the unlocked filters
   */
  public resetFilters()  :EntityService<Entity>{
    this._filters.resetAll()
    return this
  }
  public clearFilters()  :EntityService<Entity>{
    this._filters.clear()
    delete this.options.where 
    delete this.options.flowFilter
    return this
  }
  public get friendlyFilters() : string {
      return this._filters.friendly
  }

  /**
   * Sets a range-filter for a field (fromValue..toValue). 
   * if fromValue and toValue are undefined, the filter is cleared
   * if only fromValue is defined, the range is set to this value (=fromValue)
   * @param fieldName 
   * @param range?    if undefined, the fieldfilter is cleared
   *                  if range is an array with 2 values, the between-filter is set
   *                  if range is an array with 1 values order is no array the equal-filter is set
   */
  public setRange(fieldName: string, range? : any) : EntityService<Entity>{ 
    this._filters.setRange(fieldName, range) 
    return this
  }

  public setFilter(fieldName: string, condition: ClientFilterCondition | string | boolean) : EntityService<Entity>{
    if (typeof condition === 'string')
      this._filters.add(this.createFieldCondition(fieldName, FilterOperators.cplx, condition))
    else 
    if (typeof condition === 'boolean')
      this._filters.add(this.createFieldCondition(fieldName, FilterOperators.equal, condition))
    else {
      const filter : FieldConditions<EntityLiteral> = {}
      filter[fieldName] = condition
      this._filters.add(filter)
    }
    return this
  }
  /**
   * sets the filters given by "findConditions". Other filters are cleared 
   * @param fieldConditions 
   */
  public setFilters(fieldConditions : FieldConditions<Entity>):EntityService<Entity>{
    this._filters.setFilters(fieldConditions)
    return this;
  }
  public setNormalFilters(fieldConditions : FieldConditions<Entity>):EntityService<Entity>{
    this._filters.setNormalFilters(fieldConditions)
    return this;
  }
  public setFlowFilters(fieldConditions : FieldConditions<Entity>):EntityService<Entity>{
    this._filters.setFlowFilters(fieldConditions)
    return this;
  }

  /**
   * Assings the conditions to the existing filters. existing fieldconditions are overwritten
   * @param conditions 
   */
  public mergeFilters(filters : ClientFilters<Entity>, overwrite : boolean = false):EntityService<Entity>{
    this._filters.merge(filters)
    return this;
  }
 
  public setParameter(param : string | string[] | undefined):EntityService<Entity>{
    if (param)
      this.options.parameter = Array.isArray(param) ? Array.from(param): [param]
    else
      delete this.options.parameter
    return this       
  }

  public addParameter(param : string | string[] | undefined):EntityService<Entity>{
    if (param){
      if (!Array.isArray(param))
        param = [param]
      if (this.options.parameter)
        this.options.parameter.push(...param)
      else 
        this.options.parameter = Array.from(param)
    }
    return this
  }

  //Helpers
  private assertGetFieldMetadata(key : string) : FieldMetadata<Entity>{
    const md = this.fieldsMdMap.get(key)
    if (md) 
      return md
    throw new Error(`Fieldmetadata of field ${key} not found`, )
  } 
  /**
   * Creates a fieldcondition. 
   * @param key           the fieldname for the condition
   * @param operator      complex or simple operators
   * @param operandsOrFilterExpression is an expression, if the the type is 'string' and the operator is unknown or complex 
   */
  private createFieldCondition(key : string, operator : FilterOperators, operandsOrFilterExpression? : any | any[]) : FieldConditions<Entity> {
    
    function assertArray(arrayMandatory : boolean){
      const isArray = operandsOrFilterExpression && Array.isArray(operandsOrFilterExpression)
      if (arrayMandatory && !isArray) throw new Error(`operand "${operandsOrFilterExpression}" must be an array`)
      if (!arrayMandatory && isArray) throw new Error(`operand "${operandsOrFilterExpression}" must not be an array`)
    }
    var fieldCondition = {} as FieldConditions<EntityLiteral>
    const columnType = this.assertGetFieldMetadata(key).type
    if (operandsOrFilterExpression){
      switch(operator) {
        case FilterOperators.unknown: // a simple filterexpression (operator operand, ...)
        case FilterOperators.cplx:    // a complex filterexpression
            assertArray(false) 
            fieldCondition[key] = new ClientFilterCondition(operator, [operandsOrFilterExpression], columnType)
            break;
        case FilterOperators.equal:
        case FilterOperators.notEqual:
        case FilterOperators.lessThan:
        case FilterOperators.moreThan:
        case FilterOperators.lessThanOrEqual:
        case FilterOperators.moreThanOrEqual:
        case FilterOperators.like:
        case FilterOperators.notLike:
            assertArray(false) 
            fieldCondition[key] = new ClientFilterCondition(operator, [operandsOrFilterExpression], columnType)
            break
        case FilterOperators.between:
        case FilterOperators.notBetween:
        case FilterOperators.in:
        case FilterOperators.notIn: 
            assertArray(true)
            fieldCondition[key] = new ClientFilterCondition(operator, operandsOrFilterExpression, columnType) 
            break;
        case FilterOperators.isEmpty:
        case FilterOperators.isNotEmpty:
        case FilterOperators.isNull:
        case FilterOperators.isNotNull:
            console.log(`createFieldCondition: for operator "${operator}" no operand "${operandsOrFilterExpression}" is expected`)
            fieldCondition[key] = new ClientFilterCondition(operator, [], columnType) 
            break;
        default:
            throw new Error(`createFieldCondition: operator "${operator}" not yet implemented`)
            break;
      } 
    }   
    else {
      switch(operator){
        case FilterOperators.isEmpty:
        case FilterOperators.isNotEmpty:
        case FilterOperators.isNull:
        case FilterOperators.isNotNull: fieldCondition[key] = new ClientFilterCondition(operator, [], columnType)
            break
        default: throw new Error(`Operands expected for operator "${operator}"`)
      }
    }
    return fieldCondition
  }  
  /*
  * ensures by converting the Date-, DateTime-, boolean and Numberfields into the correct types
  * @param entity 
  */
  private apiToJavaTypes(entity : EntityLiteral) : Entity {
    Array.from(this.fieldsMdMap.entries()).forEach( ([key,colMetadata]) => {
      if (colMetadata.apiToJavaType && entity.hasOwnProperty(key))
        entity[key] =  colMetadata.apiToJavaType(entity[key]) as any
    })
   return entity as Entity
  }
 
  private updateRecAndxRec(entity : EntityLiteral) : Entity{
    if (!isEmpty(entity)) {
      entity = this.apiToJavaTypes(entity)
      this._data =  Object.assign(this._data , entity)
      this._xData = Object.assign(this._xData, entity)
    }
    return this._data as Entity
  }
  private fireError(observers : PartialObserver<Entity>[] | PartialObserver<Entity[]>[], error : any){
    if (observers) 
        observers.forEach(observer => { if (observer.error) observer.error(error) })
  }
  private fireNext(observers : PartialObserver<Entity>[] | PartialObserver<Entity[]>[], next : any){
    if (observers)
      observers.forEach(observer => { if (observer.next) observer.next(next) })
  }
  private fireComplete(observers : PartialObserver<Entity>[] | PartialObserver<Entity[]>[]){
    if (observers)
      observers.forEach(observer => { if (observer.complete) observer.complete() })
  }

  get primaryKeyChanged() : boolean {
      for (let key of this.primaryKeys)
        if (this._data[key] !== this._xData[key]) return true
      return false
  }
  // Publics
  public get normalFieldChanged() : boolean {
    const fields = this.fieldsMdMap
    for(let key of fields.keys()) {
      const fieldMd = fields.get(key) as FieldMetadata<Entity>
      const _class = fieldMd.class.toLocaleLowerCase() || 'normal'
      if (_class == 'normal'){
        if (this._data[key] !== this._xData[key])
          return true
      }
    }
    return false
  }
  /**
   * Initialize the rec-data and the xRec-data, but by default not the primary-keys 
   * @param includePrimaryKeys (default:false) if true, the primary keys are initialized 
   */
  public initData(includePrimaryKeys : boolean = false){
    Array.from(this.fieldsMdMap.entries())
      .forEach( ([key, metadata]) => {
        if (includePrimaryKeys || !metadata.primaryKeyNo || metadata.isGenerated)
          this._data[key] = metadata.default as any
      })
    this._xData = Object.assign(this._xData, this._data) 
  }
  /**
   * set the primary-key from the filterconditions-values
   */
  public setPrimarykeysFromFilter() : void {
    for(let [key, condition] of Object.entries(this._filters.filters)){
      if (this.assertGetFieldMetadata(key).primaryKeyNo){
        var operand = (condition as ClientFilterCondition).operandOf(FilterOperators.equal) as any
        if (operand)
          this._data[key] = operand
      } 
    }
  }

  public validateSync() : ValidationError[]{
      return validateSync(this._data)
  }
  public validate() : Promise<ValidationError[]>{
    return validate(this.data)
  }
  public get primaryKeyFields() : EntityLiteral {
      var entityIds : EntityLiteral = {}
      this.primaryKeys.every( key => {
        const value = this._data[key]
        if (value == undefined || value == null) return false
        switch (typeof value){
          case 'number' : if (isNaN(value)) return false; break
          case 'boolean': if (!isBoolean(value)) return false; break
        }
        entityIds[key] = value
        return true
      })
      return entityIds 
  }
  public validatePrimaryKeys() : ValidationError[]  {
    
    const errors : ValidationError[] = []
    this.primaryKeys.forEach( key => {
      const value = this._data[key]
      if (value == undefined || value == null) 
        errors.push(newValidationError(key as string, 'undefined'))
      switch (typeof value){
        case 'number' : if (isNaN(value)) errors.push(newValidationError(key as string, 'inNaN')); break
        case 'boolean': if (!isBoolean(value)) errors.push(newValidationError(key as string, 'no boolean')); break
      }
    })
    return errors
  } 
  //#region Database read-operations

  /**
   * returns the count of record filtered by conditions
   */
  public count(observer?:PartialObserver<number>) : Observable<number> {
    const observable = this._count()
    if (observer){
      observable.subscribe({
        next : count  => { if (observer.next) observer.next(count) },
        error : error => { if (observer.error) observer.error(error) },
        complete : () => { if (observer.complete) observer.complete()}
      })
    }
    return observable
  }

  /**
   * get the record with the primarykey in rec 
   * @param observers if defined, all observers are called, and the method return undefined.
   * If you want to combine the observable of "get" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public get(observers? : PartialObserver<Entity>[] ) : Observable<Entity>{
    if (this.primaryKeys.length == 0){
      const error = `can't get() "${this.singularName}"! No primarykeys`
      if (observers)
        this.fireError(observers, error)
      else
        throw new Error(error)
    } 
    const savedFilter = this._filters.filters
    var fieldConditions : FieldConditions<EntityLiteral> = {}
    this.primaryKeys.forEach(key => 
      fieldConditions[key] = new ClientFilterCondition(FilterOperators.equal, [this.data[key] as any], this.assertGetFieldMetadata(key).type))
    this.setFilters(fieldConditions)
    var observable = this
      ._get()
      .pipe( map( entity => this.updateRecAndxRec(entity)) )       
    
    this.setFilters(savedFilter) 
    if (observers){
      observable.subscribe({
        next : entity  => this.fireNext(observers, entity),
        error : error  => this.fireError(observers, error),
        complete :  () => this.fireComplete(observers)
      })
    }
    return observable
  }
  /**
   * Find the first record within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findFirst" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findFirst(observers? : PartialObserver<Entity>[]): Observable<Entity>{
    var observable :  Observable<Entity> = this._findFirst()
    .pipe( map( entity => { return this.updateRecAndxRec(entity) }) )
    if (observers){
      observable.subscribe({
        next : entities => this.fireNext(observers, entities),
        error : error   => this.fireError(observers, error),
        complete :()    => this.fireComplete(observers)
      })
    }
    return observable
  }
  /**
   * Find the last record within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findLast" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findLast(observers? : PartialObserver<Entity>[]) : Observable<Entity> {
    var observable :  Observable<Entity> = this._findLast()
    .pipe(map( entity => this.updateRecAndxRec(entity)))
    if (observers){
      observable.subscribe({
        next : entities => this.fireNext(observers, entities),
        error: error    => this.fireError(observers, error),
        complete : ()   => this.fireComplete(observers)
      })
    }
    return observable
  }   

  /**
   * Find all records within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findMany" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findMany(observers? : PartialObserver<EntityLiteral[]>[]) : Observable<EntityLiteral[]>  {
    var observable : Observable<EntityLiteral[]> = this._findMany()
    .pipe( 
      map( (entities) => {
          this.dataSetIndex = -1 
          this.dataSet = entities? entities.map( entity => this.apiToJavaTypes(entity)) : []
          return this.dataSet
      }),
    )
    if (observers){
      observable.subscribe({
        next : entities => this.fireNext(observers, entities),
        error : error   => this.fireError(observers, error),
        complete : ()   => this.fireComplete(observers)
      })
    }
    return observable
  }

  /**
   * 
   * @param increment fetches the next data from the recordset into the data
   *                  can be negative 
   * @returns the increment or 0, if the target-record is auf of range
   */
  public next(increment : number = 1) : number {
      if (increment === 0) 
        throw new Error("next() with increment=0 doesn't make sense")
      if (this.dataSet){
        const futureIndex = this.dataSetIndex + increment
        if ( futureIndex > (this.dataSet.length - 1) || (futureIndex < 0) )
            return 0
        this.dataSetIndex = futureIndex
        this._xData = Object.assign(this._xData, this._data)
        this._data = Object.assign(this._data ,this.dataSet[this.dataSetIndex])
        return increment
      }
      throw new Error(`Dataset is undefined`)
  }
  public calcFields(fieldsToCalculate : string[], observer? : PartialObserver<Entity>) : Observable<EntityLiteral>{
    const obs =  (this._calcFields(fieldsToCalculate, this.data as Entity) as Observable<EntityLiteral>)
      .pipe(map(entity => {
            Object.entries(entity).forEach( ([key, value]) => entity[key] = value)
            return this.updateRecAndxRec(entity as Entity) 
          })
    )
    if (observer) 
      obs.subscribe(observer)
    return obs       
  }
  public insert(observer? : PartialObserver<Entity>) : Observable<Entity>{
    //this.convertRecToSqlTypes()
    const obs = this._insert(this.data as Entity)
    .pipe( map( entity => { return entity? this.updateRecAndxRec(entity) : entity }) )
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
 
  /**
   * 
   * @param dataSetOrObserver (optional) the dataset to insert or an observer. if undefined, the local dataset is inserted
   * @param observer          (optional) the observer of the insert 
   * @returns                 the observable of the insert
   */
  public insertMany(dataSetOrObserver? : Entity[] | PartialObserver<UpdateResult>, observer? : PartialObserver<UpdateResult>) : Observable<UpdateResult> {  
    
    var obs = observer
    var dataSet = dataSetOrObserver || this.dataSet
    if (dataSetOrObserver){
      if (!Array.isArray(dataSetOrObserver))
        obs = dataSetOrObserver as PartialObserver<UpdateResult>
    }
    else {
      if (!dataSet)
        throw new Error('Dataset is undefined')
    }
    const observable = this._insertMany(dataSet as Entity[]) 
    if (obs) 
      observable.subscribe(obs)
    return observable 
  }

  public rename(observer? : PartialObserver<UpdateResult>) : Observable<UpdateResult> {
    
    if (this.primaryKeys.filter(key => this._data[key] !== this._xData[key]).length){
      var renamingRequest : IRenamingRequest<Entity> = { rec  : this.data as Entity, xRec : this._xData as Entity }
      var observable  = this._rename(renamingRequest)
        .pipe( map(entity => this.updateRecAndxRec(entity)) )
    }
    else throw MelError.create(`Nothing to rename`, 'rename', ErrorCategories.Implausible)
    if (observer) 
      observable.subscribe(observer)
    return observable 
   
  }
  public update(observer?: PartialObserver<Entity>) : Observable<Entity> {
    const obs =  this._update(this.data as Entity)
    .pipe( map(entity => this.updateRecAndxRec(entity)) )
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
  public updateMany(observer?: PartialObserver<UpdateResult>) : Observable<UpdateResult> {
    const obs = this._updateMany(this.data as Entity)
    if (observer) 
      obs.subscribe(observer)
    return obs 
}
  public delete(observer?:PartialObserver<DeleteResult>) : Observable<DeleteResult> {
    const obs =  this._delete(this.data as Entity)
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
  public deleteMany(observer?: PartialObserver<DeleteResult>) : Observable<DeleteResult>{
    const obs =  this._deleteMany()
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }

  //Database requests
  protected getOptionsQueryParam(options? : any) : string {
    const reqOptions = Object.assign(deepCopy(options?options:this.options) || {}, this._filters.getRequestOptions())
    return getQueryParam(reqOptions)
  }
  private _count() : Observable<number> {
    const url = `${this.restEndpoint}${this.lowerPluralName}count/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<{count : number}>(url)
          .pipe( map( data => {return data.count}))
  }
  private _get() : Observable<Entity> {
     return this.httpClient.get<Entity>(`${this.restEndpoint}/${this.lowerSingularName}/${this.getOptionsQueryParam()}`)
  }
  private _findMany() : Observable<Entity[]>{
    const url = `${this.restEndpoint}${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<Entity[]>(url)
  }
  private _findFirst() : Observable<Entity> {
    const url = `${this.restEndpoint}${this.lowerSingularName}first/${this.getOptionsQueryParam()}`
    return this.httpClient.get<Entity>(url)
  }
  private _findLast() :Observable<Entity> {
    const url = `${this.restEndpoint}${this.lowerSingularName}last/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<Entity>(url)       
  }
  readonly contentType = {'content-type':'application/json'}
  readonly httpOptions = {headers:this.contentType}
  private _calcFields(fieldsToCalc : string[], entity : Entity) : Observable<Entity> {
    const url = `${this.restEndpoint}${this.lowerSingularName}calcfields/?options=${JSON.stringify(fieldsToCalc)}`;
    return this.httpClient.put<Entity>(url, JSON.stringify(entity), this.httpOptions)
  }
  private _insert(entity : Entity) : Observable<Entity> {
    var url = `${this.restEndpoint}${this.lowerSingularName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.post<Entity>(url, JSON.stringify(entity), this.httpOptions)
  }
  private _insertMany(entities : Entity[]) : Observable<UpdateResult> {
    var url = `${this.restEndpoint}${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.post<UpdateResult>(url, JSON.stringify(entities), this.httpOptions)
  }
  private _rename(renamingRequest : IRenamingRequest<Entity>) : Observable<Entity> {
      var url = `${this.restEndpoint}${this.lowerSingularName}rename/`;
      return this.httpClient.put<Entity>(url, JSON.stringify(renamingRequest), this.httpOptions)   
  }
  private _update(entity : Entity) : Observable<Entity> {
      var url = `${this.restEndpoint}${this.lowerSingularName}/${this.getOptionsQueryParam()}`
      //console.info('Updating: '+JSON.stringify(entity))
      return this.httpClient.put<Entity>(url, JSON.stringify(entity), this.httpOptions)
  }
  private _updateMany(partialEntity : Partial<Entity>) : Observable<UpdateResult> {
      var url = `${this.restEndpoint}${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
      return this.httpClient.put<UpdateResult>(url, JSON.stringify(partialEntity), this.httpOptions)
  }
  private _delete(partialEntity : Partial<Entity>) : Observable<DeleteResult> {
    const url = `${this.restEndpoint}${this.lowerSingularName}/${this.getOptionsQueryParam()}` 
    return this.httpClient.request<DeleteResult>('delete', url, {body:partialEntity, headers:this.contentType})    
  }

  private _deleteMany() : Observable<DeleteResult> {
    var url = `${this.restEndpoint}${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.delete<DeleteResult>(url)
   
  }

}

import { Directive, EventEmitter, Injector } from '@angular/core'
import { from, Observable, PartialObserver, Subscriber, Subscription} from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient} from '@angular/common/http'
import { isBoolean, validateSync, validate, ValidationError } from "class-validator"
import "reflect-metadata"
import { isEmpty } from 'lodash'

import { deepCopy, FilterOperators, IRenamingRequest, QueryOptions, SortOrder } from 'mel-common'

import { ClientConfig } from '../../client.configs'
import { getModulProviderToken} from '../../core'
import { ObjectLiteral, EntityTypes } from '../../types'
import { EntityMetadata } from '../../metadata/entities'

import { ClientFilters} from './filters'
import { FieldConditions,  ClientCondition} from './filter-condition'
import { FieldMetadata } from '../../types'

declare type ColumnTrigger<Entity> = (row : Entity) => void

export type UpdateResult = {
  raw?: any
  affected?: number
  generatedMaps?: ObjectLiteral[]
}
export type DeleteResult = {
  raw?: any
  affected?: number
}
export type RenameResult = {
  raw?: any
  affected?: number
}

@Directive()
export class EntityService<Entity extends Object>{

  constructor(private entityFunc : Function,  protected httpClient : HttpClient, protected config : ClientConfig) {   
    this.entityMetadata = EntityMetadata.get(entityFunc)
    this.lowerSingularName = this.entityMetadata.name.toLowerCase()
    this.lowerPluralName   = this.entityMetadata.pluralName.toLowerCase()
    this._init()
  } 
  
  protected get restEndpoint() : string { return  this.config.restCompanyEndpoint }
  protected readonly lowerSingularName : string
  protected readonly lowerPluralName : string
  public readonly entityMetadata : EntityMetadata<Entity>
  protected beforeInsert : Subscriber<Entity>
  protected beforeModify : Subscriber<Entity>
  protected beforeRename : Subscriber<Entity>
  protected beforeDelete : Subscriber<Entity>
  //protected onNew : Subscriber<Entity>
  protected triggerMap : Map<keyof Entity, ColumnTrigger<Entity>>

  private beforeInsertEmitter = new EventEmitter<Object>()
  private beforeModifyEmitter = new EventEmitter<Object>()
  private beforeRenameEmitter = new EventEmitter<Object>()
  private beforeDeleteEmitter = new EventEmitter<Object>()
  private subscriptions : Subscription[] = []
 
  private _xData : Entity
  private _data : Entity         
  public dataSet : Entity[]
  protected dataSetIndex : number = -1

  private options : QueryOptions<Entity>
  private _filters : ClientFilters<Entity>

  user : string = ''
  private _init() : EntityService<Entity> {
    this._filters = new ClientFilters<Entity>(this.columnsMetadataMap)
    this._data = Reflect.construct(this.entityFunc, []) 
    this._xData = Reflect.construct(this.entityFunc, [])
    this.options = {}
    this.user = this.entityFunc.name
    this.initColumnTrigger()
    return this  
  }
  initColumnTrigger() {
    this.triggerMap = new Map<keyof Entity, ColumnTrigger<Entity>>()
  }

  static create<Entity>(injector : Injector, entityName : string) : EntityService<Entity> {
    var service = injector.get(getModulProviderToken(entityName + 'Service')) as EntityService<Entity>
    if (service.entityMetadata)   // the constructor was already called --> service is used by someone else
      service = EntityService.createFrom(service)
    return service
  }
  static createFrom<Entity>(from : EntityService<Entity>) : EntityService<Entity> {
    return Object.assign(Object.create(from), from)._init()
  }
  afterInit() : Observable<Entity> { return from([this.data]) }

  public get data()  : Entity { return this._data }   
  public get xData() : Entity { return this._xData }
  public assignData(dataToAssign : Entity) : void { 
    this._data = Object.assign({}, dataToAssign)
    this._xData = Object.assign({}, dataToAssign)
  }
  //public get filters(): Filters<Entity>{ return this._filters }
  public get columnsMetadataMap() :  Map<keyof Entity, FieldMetadata<Entity>> { return this.entityMetadata.columnsMap }
  public get primaryKeys() : (keyof Entity)[] { return this.entityMetadata.primaryKeys }
  public get singularName() : string { return this.entityMetadata.name }
  public get pluralName() : string { return this.entityMetadata.pluralName; }
  public get canWrite() : boolean { return this.entityMetadata.type === EntityTypes.table}
  public get hasFilters() : boolean { return this._filters.hasFilters }
  public get hasFlowFilters() : boolean { return this._filters.hasFlowFilters }
  public get hasActiveFlowFilters() : boolean { return this._filters.hasActiveFlowFilters }
  public get hasUnlockedFilters() : boolean { return this._filters.hasUnlockedFilters }

  public subscribeTriggers(permissions : string){
    if (this.beforeDelete && permissions.includes('d')) this.subscriptions.push(this.beforeDeleteEmitter.subscribe(this.beforeDelete))
    if (this.beforeInsert && permissions.includes('i')) this.subscriptions.push(this.beforeInsertEmitter.subscribe(this.beforeInsert))
    if (this.beforeModify && permissions.includes('m')) this.subscriptions.push(this.beforeModifyEmitter.subscribe(this.beforeModify))
    if (this.beforeRename && permissions.includes('m')) this.subscriptions.push(this.beforeRenameEmitter.subscribe(this.beforeRename))
  }
  public unsubscribe(){
    this.subscriptions.forEach( subscription => subscription.unsubscribe() )
  }
  public triggerColumn(name : keyof Entity, row : Entity) : void {
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

  private selectFieldname(fieldName : (keyof Entity))
  {
    if (!this.options.select)
      this.options.select = [fieldName];
    else {
      if (!this.options.select.includes(fieldName))
        this.options.select.push(fieldName);
    }
  }
  public select(fieldNames :(keyof Entity )[]) : EntityService<Entity>{
    for(var fieldName of fieldNames)
        this.selectFieldname(fieldName)
    return this;
  }
  public setOrder(sortOrder : SortOrder<Entity> | undefined ) : EntityService<Entity>{
    this.options.order = sortOrder
    return this
  }
  public get sortOrder() : SortOrder<Entity> | undefined { return this.options.order }


  public setCalcFields(calcFieldNames : (keyof Entity)[]) : EntityService<Entity>{
    this.options.calcFields = calcFieldNames
    return this
  }
  
  public take(n : number | undefined) :EntityService<Entity>{
    this.options.take = n;
    return this;
  }
  public skip( n : number | undefined) :EntityService<Entity>{
    this.options.skip = n;
    return this;
  }
  public get rowRange() : number[] {
    const from = this.options.skip ? this.options.skip : 0
    const until = this.options.take ? from + this.options.take : undefined
    return [from, until]
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
    if (from.options.order)
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
  public getNormalFilters(includeLocked : boolean = true) : ClientFilters<Entity>{
    return this._filters.copyNormalFilters(includeLocked)  as ClientFilters<Entity>
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
  public setRange(fieldName: keyof Entity, range? : any) : EntityService<Entity>{ 
    this._filters.setRange(fieldName, range) 
    return this
  }

  public setFilter(fieldName: keyof Entity, condition: ClientCondition | string | boolean) : EntityService<Entity>{
    if (typeof condition === 'string')
      this._filters.add(this.createFieldCondition(fieldName, FilterOperators.cplx, condition))
    else 
    if (typeof condition === 'boolean')
      this._filters.add(this.createFieldCondition(fieldName, FilterOperators.equal, condition))
    else {
      const filter : FieldConditions<Entity> = {}
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
    /**
     * Creates a fieldcondition. 
     * @param key           the fieldname for the condition
     * @param operator      complex or simple operators
     * @param operandsOrFilterExpression is an expression, if the the type is 'string' and the operator is unknown or complex 
     */
  private createFieldCondition(key : keyof Entity, operator : FilterOperators, operandsOrFilterExpression? : any | any[]) : FieldConditions<Entity> {
    if (!key || !operator) return undefined
    function assertArray(arrayMandatory : boolean){
      const isArray = operandsOrFilterExpression && Array.isArray(operandsOrFilterExpression)
      if (arrayMandatory && !isArray) throw new Error(`operand "${operandsOrFilterExpression}" must be an array`)
      if (!arrayMandatory && isArray) throw new Error(`operand "${operandsOrFilterExpression}" must not be an array`)
    }
    var fieldCondition : FieldConditions<Entity> = {}
    const columnType = this.columnsMetadataMap.get(key).type
    if (operandsOrFilterExpression){
      switch(operator) {
        case FilterOperators.unknown: // a simple filterexpression (operator operand, ...)
        case FilterOperators.cplx:    // a complex filterexpression
            assertArray(false) 
            fieldCondition[key] = new ClientCondition(operator, [operandsOrFilterExpression], columnType)
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
            fieldCondition[key] = new ClientCondition(operator, [operandsOrFilterExpression], columnType)
            break
        case FilterOperators.between:
        case FilterOperators.notBetween:
        case FilterOperators.in:
        case FilterOperators.notIn: 
            assertArray(true)
            fieldCondition[key] = new ClientCondition(operator, operandsOrFilterExpression, columnType) 
            break;
        case FilterOperators.isEmpty:
        case FilterOperators.isNotEmpty:
        case FilterOperators.isNull:
        case FilterOperators.isNotNull:
            console.log(`createFieldCondition: for operator "${operator}" no operand "${operandsOrFilterExpression}" is expected`)
            fieldCondition[key] = new ClientCondition(operator, undefined, columnType) 
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
        case FilterOperators.isNotNull: fieldCondition[key] = new ClientCondition(operator, undefined, columnType)
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
  private apiToJavaTypes(entity : Entity) : Entity {
      Array.from(this.columnsMetadataMap.entries()).forEach( ([key,colMetadata]) => {
      if (colMetadata.apiToJavaType && entity.hasOwnProperty(key))
        entity[key as string] = entity[key] !== undefined? colMetadata.apiToJavaType(entity[key]) : colMetadata.default
   })
   return entity
  }
  /*
  private convertRecordSetToSqlTypes() {
    //  for(let rec of this.recordset)  
    //      this.convertEntityToSqlTypes(rec)
  }
    public convertRecToSqlTypes() {
      //this.convertEntityToSqlTypes(this.rec)
  }
  
  private convertEntityToSqlTypes(entity : Entity) {
      Array.from(this.columnsMetadata.entries()).forEach( ([key,colMetadata]) => {
          if (colMetadata.convertToApiType && this.data.hasOwnProperty(key))
              entity[key] = colMetadata.convertToApiType(entity[key])
      })
  }
*/
  private updateRecAndxRec(entity : Entity) : Entity{
    if (entity) {
      entity = this.apiToJavaTypes(entity)
      this._data =  Object.assign(this._data , entity)
      this._xData = Object.assign(this._xData, entity)
    }
    return this._data
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
  public get normalColumnChanged() : boolean {
      const columns = this.columnsMetadataMap
      for(let key of columns.keys()) {
          const _class = columns.get(key).class.toLocaleLowerCase() || 'normal'
          if (_class == 'normal'){
              if (this._data[key] !== this._xData[key])
                  return true
          }
      }
      return false
  }
  public initData(includePrimaryKeys : boolean = false){
      Array.from(this.columnsMetadataMap.entries()).forEach( ([key, metadata]) => {
          if (includePrimaryKeys || !metadata.primaryKeyNo|| metadata.isGenerated)
              this._data[key as string] = metadata.default
        })
      this._xData = Object.assign(this._xData, this._data) 
  }
  public setPrimarykeysFromFilter() : void {
    //fill pk-fields from filter
    for(let [key, condition] of Object.entries(this._filters.filters)){
      if (this.columnsMetadataMap.get(key as keyof Entity).primaryKeyNo){
        var operand = (condition as ClientCondition).operandOf(FilterOperators.equal)
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
  public primaryKeyFields() : Partial<Entity> | undefined {
      var entityIds : Partial<Entity> = {}
      return this.primaryKeys.every( key => {
        const value = this._data[key]
        if (value == undefined || value == null) return false
        switch (typeof value){
          case 'number' : if (isNaN(value)) return false; break
          case 'boolean': if (!isBoolean(value)) return false; break
        }
        entityIds[key] = value
        return true
      })? entityIds : undefined
  }
  public validatePrimaryKeys() : ValidationError[] {
    function newValidationError(key : string, constraint : string) : ValidationError {
      const err = new ValidationError()
      err.property = key
      err.constraints = {'primaryKey': constraint }
      return err
    }
    return this.primaryKeys.map( key => {
      const value = this._data[key]
      if (value == undefined || value == null) return newValidationError(key as string, 'undefined')
      switch (typeof value){
        case 'number' : if (isNaN(value)) return newValidationError(key as string, 'inNaN'); break
        case 'boolean': if (!isBoolean(value)) return newValidationError(key as string, 'no boolean'); break
      }
    }).filter( err => { if (err) return err})
  } 
  //#region Database read-operations

  /**
   * returns the count of record filtered by conditions
   */
  public count(observer?:PartialObserver<number>) : Observable<number> | undefined {
    const observable = this._count()
    if (observer){
        observable.subscribe(
            count => { if (observer.next) observer.next(count) },
            error => { if (observer.error) observer.error(error) },
            ()    => { if (observer.complete) observer.complete()}
        )
        return undefined
      }
      return observable
  }

  /**
   * get the record with the primarykey in rec 
   * @param observers if defined, all observers are called, and the method return undefined.
   * If you want to combine the observable of "get" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public get(observers? : PartialObserver<Entity>[] ) : Observable<Entity> | undefined{
    if (this.primaryKeys.length == 0){
      const error = `can't get() "${this.singularName}"! No primarykeys`
      if (observers)
          this.fireError(observers, error)
      else
          throw new Error(error)
      return undefined
    } 
    const savedFilter = this._filters.filters
    var fieldConditions : FieldConditions<Entity> = {}
    this.primaryKeys.forEach(key => 
        fieldConditions[key] = new ClientCondition(FilterOperators.equal, [this.data[key as string]], this.columnsMetadataMap.get(key).type))
    this.setFilters(fieldConditions)
    var observable = this._get()
    .pipe( map( entity => isEmpty(entity) ? undefined : this.updateRecAndxRec(entity)) )       
    
    this.setFilters(savedFilter) 
    if (observers){
      observable.subscribe(
          entity => this.fireNext(observers, entity),
          error  => this.fireError(observers, error),
          ()     => this.fireComplete(observers)
      )
      return undefined
    }
    return observable
  }
  /**
   * Find the first record within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findFirst" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findFirst(observers? : PartialObserver<Entity>[]): Observable<Entity> | undefined {
    var observable :  Observable<Entity> = this._findFirst()
    .pipe( map( entity => { return this.updateRecAndxRec(entity) }) )
    if (observers){
      observable.subscribe(
        entities => this.fireNext(observers, entities),
        error    => this.fireError(observers, error),
        ()       => this.fireComplete(observers)
      )
      return undefined
    }
    return observable
  }
  /**
   * Find the last record within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findLast" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findLast(observers? : PartialObserver<Entity>[]) : Observable<Entity> | undefined {
    var observable :  Observable<Entity> = this._findLast()
    .pipe(map( entity => this.updateRecAndxRec(entity)))
    if (observers){
      observable.subscribe(
          entities => this.fireNext(observers, entities),
          error    => this.fireError(observers, error),
          ()       => this.fireComplete(observers)
      )
      return undefined
    }
    return observable
  }   

  /**
   * Find all records within the filter
   * @param observers if defined, all observers are called, an the method return undefined.
   * If you want to combine the observable of "findMany" don't support the param observers and handle
   * the observation for example in the rxjs-Operations-subscription
   */
  public findMany(observers? : PartialObserver<Entity[]>[]) : Observable<Entity[]> | undefined  {
    var observable :  Observable<Entity[]> = this._findMany()
    .pipe( 
      map( (entities) => {
          this.dataSetIndex = -1 
          this.dataSet = entities? entities.map( entity => this.apiToJavaTypes(entity)) : []
          return this.dataSet
      }),
    )
    if (observers){
      observable.subscribe(
          entities => this.fireNext(observers, entities),
          error    => this.fireError(observers, error),
          ()       => this.fireComplete(observers)
      )
      return undefined
    }
    return observable
  }

  public next(increment : number = 1) : number {
      if (increment === 0) {
        throw new Error("next() with increment=0 doesn't make sense")
      }
      const futureIndex = this.dataSetIndex + increment
      if ( futureIndex > (this.dataSet.length - 1) || (futureIndex < 0) )
          return 0
      this.dataSetIndex = futureIndex
      this._xData = Object.assign(this._xData, this._data)
      this._data = Object.assign(this._data ,this.dataSet[this.dataSetIndex])
  }
  public calcFields(fieldsToCalculate : string[], observer? : PartialObserver<Entity>) : Observable<Entity>{
    const obs =  this._calcFields(fieldsToCalculate, this.data)
    .pipe(map(entity => { 
            Object.entries(entity).forEach( ([key, value]) => entity[key] = value)
            return this.updateRecAndxRec(entity) 
          })
    )
    if (observer) 
      obs.subscribe(observer)
    return obs       
  }
  public insert(observer? : PartialObserver<Entity>) : Observable<Entity>{
    //this.convertRecToSqlTypes()
    const obs = this._insert(this.data)
    .pipe( map( entity => { return entity? this.updateRecAndxRec(entity) : entity }) )
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
 
  public insertMany(observer? : PartialObserver<UpdateResult>) : Observable<UpdateResult> {  
    const obs = this._insertMany(this.dataSet)
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
  public rename(observer? : PartialObserver<UpdateResult>) : Observable<UpdateResult> {
    if (this.primaryKeys.filter(key => this._data[key] !== this._xData[key]).length){
      var renamingRequest : IRenamingRequest<Entity> = { rec  : this.data, xRec : this._xData }
      const obs = this._rename(renamingRequest)
        .pipe( map(entity => this.updateRecAndxRec(entity)) )
      if (observer) 
        obs.subscribe(observer)
      return obs  
    }
    return undefined
  }
  public update(observer?: PartialObserver<Entity>) : Observable<Entity> {
    const obs =  this._update(this.data)
    .pipe( map(entity => this.updateRecAndxRec(entity)) )
    if (observer) 
      obs.subscribe(observer)
    return obs 
  }
  public updateMany(observer?: PartialObserver<UpdateResult>) : Observable<UpdateResult> {
    const obs = this._updateMany(this.data)
    if (observer) 
      obs.subscribe(observer)
    return obs 
}
  public delete(observer?:PartialObserver<DeleteResult>) : Observable<DeleteResult> {
    const obs =  this._delete(this.data)
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
    return "?options="+ btoa(JSON.stringify(reqOptions))
  }
  private _count() : Observable<number> {
    const url = `${this.restEndpoint}/${this.lowerPluralName}count/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<Object>(url)
          .pipe( map(data => {return data["count"]}))
  }
  private _get() : Observable<Entity> {
     return this.httpClient.get<Entity>(`${this.restEndpoint}/${this.lowerSingularName}/${this.getOptionsQueryParam()}`)
  }
  private _findMany() : Observable<Entity[]>{
    const url = `${this.restEndpoint}/${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<Entity[]>(url)
  }
  private _findFirst() : Observable<Entity> {
    const url = `${this.restEndpoint}/${this.lowerSingularName}first/${this.getOptionsQueryParam()}`
    return this.httpClient.get<Entity>(url)
  }
  private _findLast() :Observable<Entity> {
    const url = `${this.restEndpoint}/${this.lowerSingularName}last/${this.getOptionsQueryParam()}`;
    return this.httpClient.get<Entity>(url)       
  }
  private _calcFields(fieldsToCalc : string[], entity : Entity) : Observable<Entity> {
    const url = `${this.restEndpoint}/${this.lowerSingularName}calcfields/?options=${JSON.stringify(fieldsToCalc)}`;
    return this.httpClient.put<Entity>(url, JSON.stringify(entity))
  }
  private _insert(entity : Entity) : Observable<Entity> {
    var url = `${this.restEndpoint}/${this.lowerSingularName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.post<Entity>(url, JSON.stringify(entity))
  }
  private _insertMany(entities : Entity[]) : Observable<UpdateResult> {
    var url = `${this.restEndpoint}/${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.post<UpdateResult>(url, JSON.stringify(entities))
  }
  private _rename(renamingRequest : IRenamingRequest<Entity>) : Observable<Entity> {
      var url = `${this.restEndpoint}/${this.lowerSingularName}rename/`;

      return this.httpClient.put<Entity>(url, JSON.stringify(renamingRequest))   
  }
  private _update(entity : Entity) : Observable<Entity> {
      var url = `${this.restEndpoint}/${this.lowerSingularName}/${this.getOptionsQueryParam()}`
      return this.httpClient.put<Entity>(url, JSON.stringify(entity))
  }
  private _updateMany(partialEntity : Partial<Entity>) : Observable<UpdateResult> {
      var url = `${this.restEndpoint}/${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
      return this.httpClient.put<UpdateResult>(url, JSON.stringify(partialEntity))
  }
  private _delete(partialEntity : Partial<Entity>) : Observable<DeleteResult> {
    const url = `${this.restEndpoint}/${this.lowerSingularName}/${this.getOptionsQueryParam()}` 
    return this.httpClient.request<DeleteResult>('delete', url, {body:partialEntity})    
  }
  private _deleteMany() : Observable<DeleteResult> {
    var url = `${this.restEndpoint}/${this.lowerPluralName}/${this.getOptionsQueryParam()}`;
    return this.httpClient.delete<DeleteResult>(url)
   
  }

}

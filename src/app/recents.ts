import { isEmpty } from 'lodash'
import { ClientConfig } from "./client.configs"
import { MelCompanyService } from "./services/melservices"
import { Observer } from "rxjs-compat"

import { StringKeyPair, NumberKeyPair, IKeyPair } from 'mel-common'
import { map } from 'rxjs/operators'

const cookieRecentApps : string = `Mel-RecentApps` 

var recentApps : RecentApps

export function createRecentApps(companyService : MelCompanyService, config : ClientConfig) : RecentApps {
  recentApps = new RecentApps(companyService, config)
  return recentApps
}

export function apps() : StringKeyPair[] | undefined { return recentApps.recents}
export function currentApp() : StringKeyPair | undefined { return recentApps.current }
export function otherApps() : StringKeyPair[] { return recentApps.others }
export function changeApp(app : StringKeyPair ) : void { recentApps.current = app }

export function currentCompany() : NumberKeyPair | undefined { return recentApps.currentCompany }
export function hasCompanies() : boolean { return recentApps.hasCompanies }
export function otherCompanies() : NumberKeyPair[] { return recentApps.otherCompanies }
export function companies() : NumberKeyPair[] { return recentApps.companies }
export function changeCompany(company : NumberKeyPair) { if (recentApps) recentApps.currentCompany = company }

abstract class Recent<P extends IKeyPair<T>, T> {
  abstract itemName : string

  constructor(public recents? : P[]){
    if (recents){
      recents = recents.map( recent => { return this.isInstanceOfPair(recent)? recent : this.newPair() })
    }
  }
  abstract newPair(pair? : P) : P
  abstract isInstanceOfPair(recent : P) : boolean

  public get current() : P | undefined { return this.recents?.length? this.recents[0] : undefined} 
  /**
   * sets the new item at the index 0
   */
  public set current(newCurrentItem : P | undefined) {
    if (newCurrentItem) {
      if ( ! this.isInstanceOfPair(newCurrentItem) )
        newCurrentItem = this.newPair(newCurrentItem)
      if (this.recents){
        var i = this.recents.findIndex(recent => recent.equals(newCurrentItem as P))
        if (i > 0)   
          this.recents = this.recents.splice(i-1, 1) // remove
        if (i != 0 ) 
          this.add(newCurrentItem)
        console.info(`${this.itemName} changed to "${newCurrentItem.value}"`)
      }
      else {
        this.recents = [newCurrentItem] 
      }
    }
  }
  public get others() : P[] { return this.recents? this.recents.slice(1) : []}
  /**
   * adds a new item at index 0
   * @param newItem 
   */
  public store(key : string){
    if(this.recents)
      localStorage.setItem(key, JSON.stringify({ recents : this.recents }))
  }
  

  protected add(newItem : P){
    if (this.recents)
      this.recents.unshift(...[newItem])
    else 
      this.recents = [newItem]
  }
  /**
   * Adjusts the recentlist with another. The result is a recentlist which contains only the members of the itemsToAdjust
   * in the order of the existing itemlist
   * @param itemsToAdjust 
   */
  adjust(itemsToAdjust : P[]) : void {
    function keyPairsIncludes(keyPairs : P[], keyPair : P) : boolean {
      return keyPairs.some( item => item.equals(keyPair))
    }
    if (itemsToAdjust){
      if (isEmpty(this.recents)) 
        this.recents = itemsToAdjust
      else { // remove deleted
        this.recents = this.recents?.filter( recent => keyPairsIncludes(itemsToAdjust, recent))
        if(itemsToAdjust.length && this.recents) // add new
          this.recents.concat(itemsToAdjust.filter(item => !keyPairsIncludes(this.recents as P[], item)))
      }
    } 
  }
}

class RecentCompanies extends Recent<NumberKeyPair, Number> {
  itemName = 'Company'
  constructor(recents? : NumberKeyPair[]){
    super(recents)

  }
  public override newPair(pair?: NumberKeyPair): NumberKeyPair {
      return new NumberKeyPair(pair)
  }
  public override isInstanceOfPair(recent: NumberKeyPair): boolean {
      return recent instanceof NumberKeyPair
  }
   
}

export class RecentApps extends Recent<StringKeyPair, string> { 
  itemName = 'App'
  private recentCompanies = new RecentCompanies()
  
  constructor(private companyService : MelCompanyService, private config : ClientConfig){
    super() 
    const value = localStorage.getItem(cookieRecentApps)   
    if (value){
      var recents : StringKeyPair[] = JSON.parse(value).recents
      this.recents = recents.map(recent => new StringKeyPair(recent))
      if (this.current){
        this.getRecentCompaniesFromCookie()
        this.refreshCompanies( { complete : () => {
        if (this.hasCompanies)
          this.currentCompany = this.currentCompany  
        }})
      }
    }
  }
  public override newPair(pair?: StringKeyPair): StringKeyPair {
    return new StringKeyPair(pair)
  }
  public override isInstanceOfPair(recent: StringKeyPair): boolean {
    return recent instanceof StringKeyPair
  }
  get hasCompanies() : boolean { if (this.recentCompanies.recents) return this.recentCompanies.recents.length > 0; return false }
  get currentCompany() : NumberKeyPair | undefined { return this.recentCompanies.current }
  set currentCompany(company : NumberKeyPair | undefined ) {
    if (company){
      this.recentCompanies.current = company
      this.config.companyId = Number(( company).key)
      this.storeCompanies()
    }
  }
  get otherCompanies() : NumberKeyPair[] { if (this.recentCompanies) return this.recentCompanies.others; return [] }
  get companies() : NumberKeyPair[] { if (this.recentCompanies.recents) return this.recentCompanies.recents; return [] }

  override set current(newCurrentApp : StringKeyPair | undefined) {
    if (newCurrentApp){
      super.current = newCurrentApp
      this.store(cookieRecentApps)
      this.refreshCompanies( { complete : () => this.storeCompanies()} )
    }
  }
  override get current() : StringKeyPair | undefined { return super.current }

  private getRecentCompaniesFromCookie(){
    const value = localStorage.getItem(cookieRecentApps+this.current)
    if(value){
      this.recentCompanies = new RecentCompanies(JSON.parse(value).recents)
    }
  }
 
  private storeCompanies() {
    if ( this.hasCompanies && this.current)
      this.recentCompanies.store(cookieRecentApps + String(this.current.key))
  }

  private refreshCompanies( observer? : Partial<Observer<NumberKeyPair[]>>) : void {
    if (this.current){
      this.config.appCode = this.current.key
      this.companyService.findMany()
      .pipe( map (companies => companies.map(company => { 
        return new NumberKeyPair({ key : company.Id as number, value : company.Name as string}) 
      })))
      .subscribe( {
        next :  companies => { 
          if (this.hasCompanies) 
            this.recentCompanies.adjust(companies) 
          if (observer?.next) observer.next(companies)
        },
        error : error => { if (observer?.error) observer.error(error) },
        complete : () => { if (observer?.complete) observer.complete() } 
      })
    }
  }
  
  protected add(newApp : StringKeyPair) : void {
    super.add(newApp)
    this.refreshCompanies()
  }

}
 


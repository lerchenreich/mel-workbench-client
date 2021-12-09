import { isEmpty } from 'lodash'
import { ClientConfig } from "./client.configs"
import { MelCompanyService } from "./services/melservices"
import { Observer } from "rxjs-compat"
import { MelCompany } from "./models/mel-company"
import { KeyPair } from 'mel-common/types'
import { map } from 'rxjs/operators'

const cookieRecentApps : string = `Mel-RecentApps` 

var recentApps : RecentApps
export function createRecentApps(companyService : MelCompanyService, config : ClientConfig) : RecentApps {
  recentApps = new RecentApps(companyService, config)

  return recentApps
}

export function apps() : KeyPair [] { return recentApps?.recents}
export function currentApp() : KeyPair { return recentApps?.current }
export function otherApps() : KeyPair[] { return recentApps?.others }
export function changeApp(app : KeyPair ) : void { recentApps.current = app }
export function currentCompany() : KeyPair { return recentApps?.currentCompany }
export function hasCompanies() : boolean { return recentApps?.hasCompanies }
export function otherCompanies() : KeyPair[] { return recentApps?.otherCompanies }
export function companies() :KeyPair[] { return recentApps?.companies }
export function changeCompany(company : KeyPair) { if (recentApps) recentApps.currentCompany = company }

abstract class Recent {
  abstract itemName : string

  constructor(public recents? : KeyPair[]){
    if (recents){
      recents = recents.map( recent => { return recent instanceof KeyPair? recent : new KeyPair(recent) })
    }
  }
  public get current() : KeyPair { return this.recents && this.recents.length? this.recents[0] : undefined} 
  /**
   * sets the new item at the index 0
   */
  public set current(newItem : KeyPair) {
    if (newItem) {
      if ( ! (newItem instanceof KeyPair))
        newItem = new KeyPair(newItem)
      if (this.recents){
        var i = this.recents.findIndex(recent => recent.equals(newItem))
        if (i > 0)   
          this.recents = this.recents.splice(i, 1) // remove
        if (i != 0 ) 
          this.add(newItem)
        console.info(`${this.itemName} changed to "${newItem.value}"`)
      }
      else {
        this.recents = [newItem] 
      }
    }
  }
  get others() : KeyPair[] { return this.recents?.slice(1)}
  /**
   * adds a new item at index 0
   * @param newItem 
   */
  public store(key : string){
    if(this.recents)
      localStorage.setItem(key, JSON.stringify({ recents : this.recents }))
  }
  

  protected add(newItem : KeyPair){
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
  adjust(itemsToAdjust : KeyPair[]) : void {
    function keyPairsIncludes(keyPairs : KeyPair[], keyPair : KeyPair) : boolean {
      return keyPairs.some( item => item.equals(keyPair))
    }
    if (itemsToAdjust){
      if (isEmpty(this.recents)) 
        this.recents = itemsToAdjust
      else { // remove deleted
        this.recents = this.recents.filter( recent => keyPairsIncludes(itemsToAdjust, recent))
        if(itemsToAdjust.length) // add new
          this.recents.concat(itemsToAdjust.filter(item => !keyPairsIncludes(this.recents, item)))
      }
    } 
  }
}

class RecentCompanies extends Recent {
  itemName = 'Company'
  constructor(recents? : KeyPair[]){
    super(recents)

  }
}

export class RecentApps extends Recent { 
  itemName = 'App'
  private recentCompanies : RecentCompanies
  
  constructor(private companyService : MelCompanyService, private config : ClientConfig){
    super() 
    const value = localStorage.getItem(cookieRecentApps)   
    if (value){
      var recents : KeyPair[] = JSON.parse(value).recents
      this.recents = recents.map(recent => new KeyPair(recent))
      if (this.current){
        this.getRecentCompaniesFromCookie()
        this.refreshCompanies( { complete : () => {
        if (this.hasCompanies)
          this.currentCompany = this.currentCompany  
        }})
      }
    }
  }

  get hasCompanies() : boolean { return this.recentCompanies?.recents?.length > 0 }
  get currentCompany() : KeyPair { return this.recentCompanies?.current }
  set currentCompany(company : KeyPair) {
    this.recentCompanies.current = company
    this.config.companyCode = company.key
    this.storeCompanies()
  }
  get otherCompanies() : KeyPair[] { return this.recentCompanies?.others }
  get companies() : KeyPair[] { return this.recentCompanies?.recents }

  set current(newApp : KeyPair) {
    super.current = newApp
    this.store(cookieRecentApps)
    this.refreshCompanies( { complete : () => this.storeCompanies()} )
  }
  get current() : KeyPair { return super.current }

  private getRecentCompaniesFromCookie(){
    const value = localStorage.getItem(cookieRecentApps+this.current)
    if(value){
      this.recentCompanies = new RecentCompanies(JSON.parse(value).recents)
    }
  }
 
  private storeCompanies() {
    if ( this.hasCompanies )
      this.recentCompanies.store(cookieRecentApps+this.current)
  }

  private refreshCompanies( observer? : Partial<Observer<KeyPair[]>>) : void {
    this.config.appCode = this.current.key
    this.companyService.findMany()
    .pipe( map (companies => companies.map(company => { return new KeyPair({ key:company.DbName, value : company.Company}) }) ))
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
  
  protected add(newApp : KeyPair) : void {
    super.add(newApp)
    this.refreshCompanies()
  }
}
 

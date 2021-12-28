import { isEmpty } from 'lodash'
import { ClientConfig } from "./client.configs"
import { CompNumberString, CompString, IComp, NumberString } from 'mel-common'

var recentConnections : RecentConnections
export function createRecentConnections(config : ClientConfig) : RecentConnections {
  recentConnections = new RecentConnections(config)
  return recentConnections
}
export function connections() : CompString[] | undefined { return recentConnections.recents}
export function currentConnection() : CompString | undefined { return recentConnections.lastRecent }
export function otherConnections() : CompString[] { return recentConnections.others }
export function changeConnection(con : CompString ) : void { recentConnections.lastRecent = con }

var recentApps : RecentApps
export function createRecentApps(config : ClientConfig) : RecentApps{
  recentApps = new RecentApps(config)
  return recentApps
}
export function apps() : AppDescr[] | undefined { return recentApps.recents?.map(descr => descr.element)}
export function lastRecentApp() : AppDescr | undefined { return recentApps.lastRecent?.element }
export function otherApps() : AppDescr[] { return recentApps.others.map(desc => desc.element) }
export function changeApp(descr : AppDescr ) : void { recentApps.lastRecent = new CompAppDescr(descr) }
export function adjustApps(toAdjust : AppDescr[]) : void { recentApps.adjust(toAdjust.map(appDescr => new CompAppDescr(appDescr)))}
export function findFirstAppByCode(code : string) : AppDescr | undefined { return recentApps.findFirstByCode(code)}
export class AppDescr {
  constructor(public url : string, public code : string, public name : string){
  }
}
export class CompAppDescr implements IComp<AppDescr>{
  constructor(public element : AppDescr){ }
  compare(other : CompAppDescr) : number { return this.element.url.localeCompare(other.element.url) }
}
/*
export function currentCompany() : NumberKeyPair | undefined { return recentConnections.currentCompany }
export function hasCompanies() : boolean { return recentConnections.hasCompanies }
export function otherCompanies() : NumberKeyPair[] { return recentConnections.otherCompanies }
export function companies() : NumberKeyPair[] { return recentConnections.companies }
export function changeCompany(company : NumberKeyPair) { if (recentConnections) recentConnections.currentCompany = company }
*/
abstract class Recent<E extends IComp<T>, T> {
  protected abstract key : string
  protected abstract getInstance(o : T ) : E
  
  constructor(protected type : Function , private appCode : string, public recents? : E[]){
    if (recents){
      recents = recents.filter( recent => { return (recent as any) instanceof type ? recent : undefined })
    }
      
  }
  protected get cookieName() : string { return this.appCode + this.key}

  public get lastRecent() : E | undefined { return this.recents?.length? this.recents[0] : undefined} 
  /**
   * sets the lastRecent at the index 0
   */
  public set lastRecent(lastRecent : E | undefined) {
    if (lastRecent) {
      if ( !((lastRecent as E) instanceof this.type) )
        throw new Error(`item "${lastRecent} is not instance of "${this.type.name}"`)
      if (this.recents){
        var i = this.recents.findIndex(recent => recent.compare(lastRecent) == 0)
        if (i > 0)   
          this.recents = this.recents.splice(i-1, 1) // remove
        if (i != 0 ) 
          this.add(lastRecent)
        console.info(`last recent "${this.key}" changed to "${lastRecent.element}"`)
      }
      else {
        this.recents = [lastRecent] 
      }
    }
  }
  public get others() : E[] { return this.recents? this.recents.slice(1) : []}
  /**
   * adds a new item at index 0
   * @param newItem 
   */
  public store(){
    if(this.recents)
      localStorage.setItem(this.cookieName + this.key, JSON.stringify({ recents : this.recents }))
  }
  protected restore() : any {
    const cookie = localStorage.getItem(this.cookieName + this.key) 
    if (cookie){
      var parsedRecents : E[] = JSON.parse(cookie).recents as E[]
      this.recents = parsedRecents.map(parsedRecent => this.getInstance(parsedRecent.element))  
    }
  }
  protected add(newItem : E){
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
  public adjust(itemsToAdjust : E[]) : void {
    if (itemsToAdjust){
      if (isEmpty(this.recents)) 
        this.recents = itemsToAdjust
      else { // remove deleted
        this.recents = this.recents?.filter( recent => itemsToAdjust.some(item => item.compare(recent) == 0))
        if(itemsToAdjust.length && this.recents) // add new
          this.recents.concat(itemsToAdjust.filter(item => !this.recents?.some(recent => recent.compare(item)==0)))
      }
    } 
  }
}

export class RecentCompanies extends Recent<CompNumberString, NumberString> {
  readonly key : string = 'Companies' 
  constructor(appCode : string, recents? : CompNumberString[]){
    super(CompNumberString, appCode, recents)
  }
  protected getInstance(recent : NumberString)  : CompNumberString { return new CompNumberString(recent)}
}

/**
 * Stores the url to the app-server of an application
 */
export class RecentConnections extends Recent<CompString, string> { 
  //private recentCompanies = new RecentCompanies()
  readonly key : string = 'Connections'
  protected getInstance(recent : string) { return new CompString(recent)}

  constructor(private config : ClientConfig){
    super(CompString, config.appCode as string) 
  }
}
/**
 * Stores the app-code (client-name), the corresponding Applicationname and url to the appserver
 */
export class RecentApps extends Recent<CompAppDescr, AppDescr> { 
  //private recentCompanies = new RecentCompanies()
  readonly key : string = 'AppDescr'
  protected getInstance(recent :AppDescr) { return new CompAppDescr(recent)}

  constructor(private config : ClientConfig){
    super(CompAppDescr, config.appCode as string)
    this.restore() 
    //if (this.current){
      //this.getRecentCompaniesFromCookie()
    //}
  }
  public override get lastRecent() : CompAppDescr | undefined { return super.lastRecent as CompAppDescr } 
  public override set lastRecent(lastRecent : CompAppDescr | undefined) {
    if (lastRecent){
      super.lastRecent = lastRecent
      this.config.appCode = lastRecent.element.code
      this.store()
    }
  }
  findFirstByCode( code : string) : AppDescr | undefined{
    if (this.recents){
      const result = this.recents.find(recent => recent.element.code === code)
      return result?.element
    }
  }
}
 /*
  get hasCompanies() : boolean { if (this.recentCompanies.recents) return this.recentCompanies.recents.length > 0; return false }
  get currentCompany() : NumberString | undefined { return this.recentCompanies.current }
  set currentCompany(company : NumberString | undefined ) {
    if (company){
      this.recentCompanies.current = company
      this.config.companyId = Number((company).key)
      this.storeCompanies()
    }
  }
  get otherCompanies() : NumberString[] { if (this.recentCompanies) return this.recentCompanies.others; return [] }
  get companies() : NumberString[] { if (this.recentCompanies.recents) return this.recentCompanies.recents; return [] }

  override get current() : StringKeyPair | undefined { return super.current }
  override set current(newConnection : StringKeyPair | undefined) {
    if (newConnection){
      super.current = newConnection
      this.store(this.cookieName)
    }
  }
 
  private getRecentCompaniesFromCookie(){
    const value = localStorage.getItem(this.cookieName+this.current)
    if(value){
      this.recentCompanies = new RecentCompanies(JSON.parse(value).recents)
    }
  }

  private storeCompanies() {
    if ( this.hasCompanies && this.current)
      this.recentCompanies.store(this.cookieName + String(this.current.key))
  }
 */

 


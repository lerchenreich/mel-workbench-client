import { Directive, Inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core"
import { ClientConfig, CLIENT_CONFIG } from "../client.configs";
import { createRecentApps, createRecentConnections, RecentApps, RecentConnections } from "../recents";
import { EntityMetadata } from "../metadata/entities"
import { ENTITIES } from "../models/entities";
import { MelCompanyService } from './melservices'


@Directive()
export abstract class InitializationService<R> {
  constructor() {
  }
  abstract initRecents() : Promise<R>

  translateEntities(translate : TranslateService): Promise<void> {
    return new Promise<any>( (resolve,reject) => {
      var entityPromises : Promise<[string, number]>[] = []
      ENTITIES.forEach( entity => {
        entityPromises.push(EntityMetadata.get(entity.name).initialize(translate))
      })
      //console.info(`Entityname - Translations`)
      //console.info(`-------------------------`)
      const now = Date.now()
      Promise.all(entityPromises)
        .then( result => { 
          console.log(`Translationduration : ${Math.round((Date.now()-now)/10)*10} ms`)
          resolve(0)
        })
        .catch(error => reject(error))
    })
  }
 
}

@Injectable()
export class AppInitializationService extends InitializationService<RecentConnections>{
  constructor( private melCompanyService : MelCompanyService, @Inject(CLIENT_CONFIG) private config : ClientConfig) {
    super()
  }
 
  initRecents() : Promise<RecentConnections> {
    return new Promise( (resolve, reject) => {
      try {
        const recentConnections = createRecentConnections(this.config)
        if (recentConnections.lastRecent?.element)
          this.config.endPoint = recentConnections.lastRecent.element
        resolve(recentConnections)
      }
      catch(error){ reject(error)}
    })
  }
}
@Injectable()
export class DevInitializationService extends InitializationService<RecentApps>{
  constructor( private melCompanyService : MelCompanyService, @Inject(CLIENT_CONFIG) private config : ClientConfig) {
    super()
  }
 
  initRecents() : Promise<RecentApps> {
    return new Promise( (resolve, reject) => {
      try {
        const recentApps = createRecentApps(this.config)  
        const lastRecent = recentApps.lastRecent
        if (lastRecent){
          this.config.appCode = lastRecent.element.code
          this.config.endPoint = lastRecent.element.url
        }
        resolve(recentApps)
      }
      catch(error){ reject(error)}
    })
  }

}
export function initializationFactory( initService: InitializationService<RecentApps|RecentConnections>, translate: TranslateService) {
  return (): Promise<any> => {
    //localStorage.clear()
    return Promise.all([
        initService.translateEntities(translate),
        initService.initRecents(),
      ])
      .then( ([dc , recents]) => {
        if (recents.lastRecent){
        /*  if (devApps.currentCompany)
            console.info(`${devApps.current}-Client started with company ${devApps.currentCompany}`)
          else 
            console.info(`${devApps.current}-Client started without a company`)
        */}
        else console.info(`No recent app registered`)
      })
      .catch( error => console.error(error))
  }
}


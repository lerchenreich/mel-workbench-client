import { Inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core"
import { ClientConfig, CLIENT_CONFIG } from "../client.configs";
import { createRecentApps, RecentApps } from "../recents";
import { EntityMetadata } from "../metadata/entities"
import { ENTITIES } from "../models/entities";
import { MelCompanyService } from './melservices'


@Injectable()
export class InitializationService {
  constructor( private melCompanyService : MelCompanyService, @Inject(CLIENT_CONFIG) private config : ClientConfig) {
  }
 
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
  initRecentDevApps() : Promise<RecentApps> {
    return new Promise( (resolve, reject) => {
      try {
    //    localStorage.clear()
        const devApps = createRecentApps(this.melCompanyService, this.config)  
        resolve(devApps)
      }
      catch(error){ reject(error)}
    })
  }

}

export function initializationFactory( initService: InitializationService, translate: TranslateService) {
  return (): Promise<any> => {
    return Promise.all([
        initService.translateEntities(translate),
        initService.initRecentDevApps()
      ])
      .then( ([dc , devApps]) => {
        if (devApps.current){
          if (devApps.currentCompany)
            console.info(`${devApps.current}-Client started with company ${devApps.currentCompany}`)
          else 
            console.info(`${devApps.current}-Client started without a company`)
        }
        else console.info(`No recent app registered`)
      })
      .catch( error => console.error(error))
  }
}

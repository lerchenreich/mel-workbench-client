import { TranslateService } from "@ngx-translate/core"
import { RecentApps, RecentConnections, IconService, InitializationService } from "mel-client";
import { appEntities } from "../models/entities";


export function initializationFactory( initService: InitializationService<RecentApps|RecentConnections>, translate: TranslateService, iconService : IconService) {
  return (): Promise<any> => {
    //localStorage.clear()
    iconService.registerIcons()
    return Promise.all([
        initService.translateEntities(translate, appEntities),
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


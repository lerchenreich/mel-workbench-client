import { Type, InjectionToken, getNgModuleById, ɵNG_INJ_DEF, ɵNG_PROV_DEF} from '@angular/core'
import { ObjectLiteral } from './types'

const providerKey = ɵNG_PROV_DEF ? ɵNG_PROV_DEF : "ɵprov"
export const CLIENT_MODUL_NAME = 'mel-client'
export const APP_MODUL_NAME = 'App'

export function getModulProviderToken<T>( providerName : string, moduleName : string): Type<T> |InjectionToken<T> | undefined {
  try {
    const appModule = getNgModuleById(moduleName) as ObjectLiteral
    const providers = appModule[ɵNG_INJ_DEF].providers as Function[]
    if (providers){
      const provider = providers.find( provider => (providerName === provider.name) ) as ObjectLiteral
      if (provider)
        return provider[providerKey].token 
    }
  }
  catch( error) {
    console.error(error)
  }
  return undefined
}


export function getInjectionToken<T>(provider : ObjectLiteral) : InjectionToken<T>{
  return provider[ɵNG_PROV_DEF ? ɵNG_PROV_DEF : "ɵprov"].token 
}


import { Type, InjectionToken, getModuleFactory, NgModuleFactory, ɵNG_INJ_DEF, ɵNG_PROV_DEF } from '@angular/core'



export function getModulProviderToken<T>( providerName : string, moduleName : string = 'App') : Type<T> |InjectionToken<T>  {
    const provider = getModulProvider(providerName, moduleName)
    const key = ɵNG_PROV_DEF ? ɵNG_PROV_DEF : "ɵprov"
    return provider ? provider[key].token : undefined
}

export function getModulProvider<T>( providerName : string, moduleName : string = 'App') : any {
    const appFactory : NgModuleFactory<any> = getModuleFactory(moduleName)
    const providers = appFactory.moduleType[ɵNG_INJ_DEF]?.providers  

    for (let provider of providers){
      if (provider.name === providerName){
        return provider
      }
    }
    return undefined
}
export function getServiceModulProviders<T>(moduleName : string = 'App') : any[]{
  const appFactory : NgModuleFactory<any> = getModuleFactory(moduleName)
  const providers = appFactory.moduleType[ɵNG_INJ_DEF]?.providers  
  return providers.filter( provider => {
    return (typeof provider === 'function') && (provider.name.indexOf("Service")>1)}
     )
}
export function getInjectionToken<T>(provider) : InjectionToken<T>{
  return provider ? provider[ɵNG_PROV_DEF ? ɵNG_PROV_DEF : "ɵprov"].token : undefined
}

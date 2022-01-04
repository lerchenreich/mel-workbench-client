
import { ClientConfig } from 'mel-client'

//#region app
import manifest from '../../package.json'
export const CLIENT_APP_CONFIG  = new ClientConfig(manifest.name)
//#endregion app


//#region dev
export const WORKBENCH_CONFIG = new ClientConfig('')// without appCode --> for all apps
//#endregion




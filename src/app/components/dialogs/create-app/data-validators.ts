
import { CreateAppDlgData } from './data';

export function toPromise<T>(value : T) : Promise<T>{
  return new Promise<T>( (resolve, reject) => { resolve(value) })
}
export class CreateAppDlgDataValidators {
          
}
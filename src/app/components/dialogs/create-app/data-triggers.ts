import { Injectable } from "@angular/core"
import { FieldTriggers, Trigger} from "mel-client"
import { CreateAppDlgData } from "./data"


@Injectable({ providedIn: 'root' })
export class CreateAppDlgDataTriggers extends FieldTriggers{

  constructor(){
    super(CreateAppDlgData.name)
  }
 
  @Trigger()
  set AppCode(code:string){
    this.SpDbConfigDatabase = code + '_app'
  }  

  SpDbConfigDatabase? : string
}

  
  
import { Entity, Field, Table} from 'mel-client';

import { FieldTypes, greaterOrEqualThan, matchIp4Address, 
         notBlank, notZero } from 'mel-common';



@Table({ temporary : true}) 
export class CreateServerData extends Entity{
  @Field({type : FieldTypes.String })                               
  Keywords?: string
  @Field({type : FieldTypes.String })                               
  Author?: string
  @Field({type : FieldTypes.String, default : 'MIT'})                               
  License?: string;
  @Field({type : FieldTypes.Integer, validators:[notZero], default : 4200})         
  ServerPort?: number
  //database configuration
  @Field({type : FieldTypes.String , validators:[matchIp4Address], default : '192.168.0.x'}) 
  DbConfigHost?: string 
  @Field({type : FieldTypes.Integer, validators:[notZero], default: 3400})         
  DbConfigPort? : number
  @Field({type : FieldTypes.String, validators:[notBlank], default : 'root' })        
  DbConfigUsername? : string
  @Field({type : FieldTypes.String, validators:[notBlank], default : 'secret'})        
  DbConfigPassword? : string
  @Field({type : FieldTypes.String, editable : false })        
  DbConfigDatabase? : string 
  @Field({type : FieldTypes.Boolean})                               
  DbConfigSsl? : boolean
  @Field({type : FieldTypes.Integer, default : 30000, validators: [(v:number) => greaterOrEqualThan(v, 30000)] })   
  DbConfigTimeout? : number 
  @Field({type : FieldTypes.Enum, enumValues:['mysql','mssql','postgres'], default : 'mysql'})                 
  DatabaseType?: string

  constructor(init? : Partial<CreateServerData>){
    super(CreateServerData.name, init as Entity)
  }
}
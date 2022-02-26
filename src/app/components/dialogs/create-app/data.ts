
import { Entity, Field, Table} from 'mel-client';

import { FieldTypes, greaterOrEqualThan, matchIp4Address, 
         matchVersion, notBlank, notZero } from 'mel-common';



@Table({ temporary : true}) 
export class CreateAppDlgData extends Entity{
  @Field({type : FieldTypes.Code, validators:[notBlank]})           
  AppCode? : string 
  @Field({type : FieldTypes.String, validators:[notBlank] })                               
  AppName? : string
  @Field({type : FieldTypes.String, default : "0.1.0", validators:[matchVersion]})     
  Version? : string 
  @Field({type : FieldTypes.String, validators:[notBlank] })        
  CompanyName? : string 
  @Field({type : FieldTypes.String, validators:[notBlank]})         
  CompanyDbName? : string
  @Field({type : FieldTypes.Boolean})                               
  DropExistingAppDatabase? : boolean 
  //@Field({type : FieldTypes.Boolean})                               
  //RenameCompanyDatabase  : boolean = false
  // Sp = ServerProject
  @Field({type : FieldTypes.String })                               
  SpKeywords?: string
  @Field({type : FieldTypes.String })                               
  SpAuthor?: string
  @Field({type : FieldTypes.String, default : 'MIT'})                               
  SpLicense?: string;
  @Field({type : FieldTypes.Integer, validators:[notZero], default : 4200})         
  SpServerPort?: number
  
  @Field({type : FieldTypes.String , validators:[matchIp4Address], default : '192.168.0.103'}) 
  SpDbConfigHost?: string 
  @Field({type : FieldTypes.Integer, validators:[notZero], default: 3401})         
  SpDbConfigPort? : number
  @Field({type : FieldTypes.String, validators:[notBlank], default : 'root' })        
  SpDbConfigUsername? : string
  @Field({type : FieldTypes.String, validators:[notBlank], default : 'secret'})        
  SpDbConfigPassword? : string
  @Field({type : FieldTypes.String, validators:[notBlank], editable : false })        
  SpDbConfigDatabase? : string 
  @Field({type : FieldTypes.Boolean})                               
  SpDbConfigSsl? : boolean
  @Field({type : FieldTypes.Integer, default : 30000, validators: [(v:number) => greaterOrEqualThan(v, 30000)] })   
  SpDbConfigTimeout? : number 
  @Field({type : FieldTypes.Enum, enumValues:['mysql','mssql','postgres'], default : 'mysql'})                 
  SpDatabaseType?: string
  
  constructor(init? : Partial<CreateAppDlgData>){
    super(CreateAppDlgData.name, init as Entity)
  }
}

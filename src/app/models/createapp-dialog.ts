import { Field, Table} from 'mel-client';

import { EntityLiteral, FieldTypes, greaterOrEqualThan, matchIp4Address, 
         matchVersion, notBlank, notZero } from 'mel-common';

@Table({ temporary : true})
export class CreateAppDlgData extends EntityLiteral{
  @Field({type : FieldTypes.Code, validators:[notBlank]})           
  AppCode : string = ""
  @Field({type : FieldTypes.String })                               
  AppName : string = ""
  @Field({type : FieldTypes.String, validators:[matchVersion]})     
  Version : string = ""
  @Field({type : FieldTypes.String, validators:[notBlank] })        
  CompanyName : string = ""
  @Field({type : FieldTypes.String, validators:[notBlank]})         
  CompanyDbName : string = ""
  @Field({type : FieldTypes.Boolean})                               
  DropExistingAppDatabase : boolean = false
  @Field({type : FieldTypes.Boolean})                               
  RenameCompanyDatabase  : boolean = false
  // Sp = ServerProject
  @Field({type : FieldTypes.String })                               
  SpKeywords?: string
  @Field({type : FieldTypes.String })                               
  SpAuthor?: string
  @Field({type : FieldTypes.String })                               
  SpLicense: string = 'MIT';
  @Field({type : FieldTypes.Integer, validators:[notZero]})         
  SpServerPort: number = 0;
  
  @Field({type : FieldTypes.String , validators:[matchIp4Address]}) 
  SpDbConfigHost: string = '192.168.x.x'
  @Field({type : FieldTypes.Integer, validators:[notZero]})         
  SpDbConfigPort : number = 0
  @Field({type : FieldTypes.String, validators:[notBlank] })        
  SpDbConfigUsername : string = 'root'
  @Field({type : FieldTypes.String, validators:[notBlank] })        
  SpDbConfigPassword : string = 'secret'
  @Field({type : FieldTypes.String, validators:[notBlank] })        
  SpDbConfigDatabase : string = ''
  @Field({type : FieldTypes.Boolean})                               
  SpDbConfigSsl : boolean = false
  @Field({type : FieldTypes.Integer, validators: [(v, e) => greaterOrEqualThan(v, 30000)] })   
  SpDbConfigTimeout : number = 40000
  @Field({type : FieldTypes.Enum, enumValues:['mysql','mssql','postgres']})                 
  SpDatabaseType: string = 'mysql';
  //  entities?: (Function | string)[];
}
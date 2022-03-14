


import { Entity, Field, Table } from 'mel-client';

import { FieldTypes, greaterOrEqualThan, matchIp4Address,
         matchVersion,
         notBlank, notZero } from 'mel-common';



@Table({ temporary : true})
export class CreateServerDlgData extends Entity{
  @Field({type : FieldTypes.String, validators : [notBlank], editable : false })
  Name?: string
  @Field({type : FieldTypes.String, validators : [notBlank] })
  Description?: string
  @Field({type : FieldTypes.String, validators : [notBlank, matchVersion], default : '0.0.1' })
  Version?: string
  @Field({type : FieldTypes.String })
  Keywords?: string
  @Field({type : FieldTypes.String})
  Author?: string
  @Field({type : FieldTypes.String, default : 'MIT'})
  License?: string;
  @Field({type : FieldTypes.String})
  GitAccount?: string;

  @Field({type : FieldTypes.Integer, validators:[notZero], default : 0})
  ServerPort?: number
  //database configuration
  @Field({type : FieldTypes.String , validators:[matchIp4Address]})
  DbConfigHost?: string
  @Field({type : FieldTypes.Integer, validators:[notZero], default: 0})
  DbConfigPort? : number
  @Field({type : FieldTypes.String, validators:[notBlank], default : 'root' })
  DbConfigUsername? : string
  @Field({type : FieldTypes.String, validators:[notBlank], display : { subType : "password"}})
  DbConfigPassword? : string
  @Field({type : FieldTypes.String, editable : false })
  DbConfigDatabase? : string
  @Field({type : FieldTypes.Boolean})
  DbConfigSsl? : boolean
  @Field({type : FieldTypes.Integer, default : 30, validators: [(v:number) => greaterOrEqualThan(v, 30)] })
  DbConfigTimeout? : number
  @Field({type : FieldTypes.Enum, enumValues:['mysql','mssql','postgres'], default : 'mysql', display :{ doNotTranslate : true}})
  DatabaseType?: string

  @Field({type : FieldTypes.String, validators:[notBlank]})
  TargetDir? : string

  constructor(init? : Partial<CreateServerDlgData>){
    super(CreateServerDlgData.name, init as Entity)
  }
}

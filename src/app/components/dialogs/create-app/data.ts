
import { Entity, Field, Table} from 'mel-client';

import { FieldTypes,  matchVersion, notBlank } from 'mel-common';



@Table({ temporary : true})
export class CreateAppDlgData extends Entity{
  @Field({type : FieldTypes.Code, validators:[notBlank]})
  AppCode? : string
  @Field({type : FieldTypes.String, validators:[notBlank] })
  AppName? : string
  @Field({type : FieldTypes.String, default : "0.1.0", validators:[matchVersion]})
  Version? : string
  @Field({type : FieldTypes.String, validators:[notBlank],default : "" })
  CompanyName? : string
  @Field({type : FieldTypes.String, validators:[notBlank], default : ""})
  CompanyDbName? : string

  constructor(init? : Partial<CreateAppDlgData>){
    super(CreateAppDlgData.name, init as Entity)
  }
}

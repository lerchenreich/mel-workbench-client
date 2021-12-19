import { FieldTypes, MelFieldClasses } from "mel-common"
import { Field, Table } from "../metadata/entities"
import { EntityLiteral } from "../types"


@Table()
export class MelSetup  extends EntityLiteral {

  @Field( { type : FieldTypes.Code, class : MelFieldClasses.Normal, primaryKeyNo : 1 })
  AppCode? : string

  @Field( { type : FieldTypes.String, class : MelFieldClasses.Normal } )
  AppName? : string

  @Field( { type : FieldTypes.String, class : MelFieldClasses.Normal } )
  AppDbName? : string

  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Major? : number

  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Minor? : number

  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Build? : number

  @Field({type : FieldTypes.String, class : MelFieldClasses.Normal}) 
  public ServerProject?    : string  

  @Field( { type : FieldTypes.String, class : MelFieldClasses.Normal } )
  public ClientProject? : string
  
}
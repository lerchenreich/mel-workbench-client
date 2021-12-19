import { FieldTypes, MelFieldClasses } from "mel-common"
import { Field, Table } from "src/app/metadata/entities"
import { EntityLiteral } from "../types"


@Table()
export class MelCompany extends EntityLiteral {

  @Field({ type : FieldTypes.Integer, class : MelFieldClasses.Normal, primaryKeyNo : 1})
  Id?    : number

  @Field({ type : FieldTypes.String, class : MelFieldClasses.Normal })
  Name?    : string

  @Field({ type : FieldTypes.String, class : MelFieldClasses.Normal })
  DbName?    : string

  @Field({ type : FieldTypes.Enum, class : MelFieldClasses.Normal, enumValues : ['Active', 'Inactive', 'DbExists'] }) 
  State? : string
  
  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Major? : number

  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Minor? : number

  @Field( { type : FieldTypes.Integer, class : MelFieldClasses.Normal})
  Build? : number

 
  constructor(init? : Partial<MelCompany>){
    super()
    if (init)
      Object.assign(this, init)
  }
}
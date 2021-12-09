import { FieldTypes } from "mel-common/types"
import { Column, Table } from "src/app/metadata/entities"


@Table()
export class MelCompany {

  @Column({ type : FieldTypes.String, primaryKeyNo : 1})
  Company    : string

  @Column({ type : FieldTypes.String })
  DbName?    : string

  @Column({ type : FieldTypes.String })
  Version : string

  @Column({ type : FieldTypes.Enum, enumValues : ['Active', 'Inactive', 'DbExists'] }) 
  State : string
  
  constructor(init? : Partial<MelCompany>){
    if (init)
      Object.assign(this, init)
  }
}
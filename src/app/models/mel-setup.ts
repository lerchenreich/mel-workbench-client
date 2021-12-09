import { FieldTypes } from "mel-common/types"
import { Column, Table } from "src/app/metadata/entities"


@Table()
export class MelSetup {

  @Column( { type : FieldTypes.Integer, primaryKeyNo : 1})
  Major : number

  @Column( { type : FieldTypes.Integer, primaryKeyNo : 2})
  Minor : number

  @Column( { type : FieldTypes.Integer, primaryKeyNo : 3})
  Build : number

  @Column({type : FieldTypes.String}) 
  public AppName    : string  // appname
  
}
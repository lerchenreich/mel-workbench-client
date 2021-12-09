
import { FieldTypes } from 'mel-common'
import { Table, Column } from '../metadata/entities';
import { notBlank, notTrue, notZero } from 'mel-common';

@Table( {
  default : [ "Name",  "Domain", "Active","AppTable"],
  lookup :  [ "Name", "Domain"]
})
export class MelTable  {
 
    @Column({type : FieldTypes.String, primaryKeyNo : 1, validators : [notBlank]})
    public Name? : string   


    @Column({type : FieldTypes.String})  
    public Domain? : string   

    @Column({type : FieldTypes.Boolean, validators : []})  
    public Active? : boolean   

    @Column({type : FieldTypes.Boolean, editable : false, validators : []})  
    public AppTable? : boolean   

    @Column({type : FieldTypes.DateTime, editable : false})  
    public timestamp? : Date   

    constructor(init?: Partial<MelTable>) {
      Object.assign(this, init)
    }

    
}

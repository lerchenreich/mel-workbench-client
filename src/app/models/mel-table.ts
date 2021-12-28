
import { FieldTypes, MelFieldClasses } from 'mel-common'
import { Table, Field } from '../metadata/entities';
import { notBlank, notTrue, notZero } from 'mel-common';
import { EntityLiteral } from '../types';

@Table( {
  default : [ "Name",  "Domain", "Active","AppTable"],
  lookup :  [ "Name", "Domain"]
})
export class MelTable extends EntityLiteral {
 
    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal, primaryKeyNo : 1, validators : [notBlank]})
    public Name? : string   


    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})  
    public Domain? : string   

    @Field({type : FieldTypes.Boolean, class : MelFieldClasses.Normal, validators : []})  
    public Active? : boolean   

    @Field({type : FieldTypes.Boolean, class : MelFieldClasses.Normal, editable : false, default : true, validators : []})  
    public AppTable? : boolean   

    @Field({type : FieldTypes.DateTime, class : MelFieldClasses.Normal, editable : false})  
    public timestamp? : Date   

    constructor(init?: Partial<MelTable>) {
      super()
      Object.assign(this, init)
    }

    
}

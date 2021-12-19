
import { Field } from 'src/app/metadata/entities'
import { Table } from 'src/app/metadata/entities'
import { FieldTypes, MelFieldClasses } from 'mel-common'
import { EntityLiteral } from '../types'
@Table()
export class MelErrorLog  extends EntityLiteral {
    @Field({type : FieldTypes.BigInt, class : MelFieldClasses.Normal, primaryKeyNo : 1, editable : false })  
    public Id? : bigint   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})
    public Method? : string   
    
    @Field({type : FieldTypes.Enum, class : MelFieldClasses.Normal, enumValues : []})
    public Class? : string   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})
    public Message? : string   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})
    public Details? : string   

    @Field({type : FieldTypes.DateTime, class : MelFieldClasses.Normal})  
    public timestamp? : Date   
}
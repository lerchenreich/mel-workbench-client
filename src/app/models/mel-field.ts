import { FieldTypes, MelFieldClasses, notBlank } from 'mel-common'
import { Table } from '../metadata/entities';
import { Field } from 'src/app/metadata/entities';
import  * as V  from './field-validations';
import { EntityLiteral } from '../types';


@Table({
  part : [
    "Name",
    "Datatype",
    "Length",
    "EnumValues",
    "PrimaryKeyNo",
    "IsAutoincrement",
    "ShowDefault",
    "ShowInPart",
    "ShowInLookup",
    "DefaultSelect",
    "Class",
    "FlowFormula",
    "DefaultValue",
    "Nullable",
    "Updateable",
    "SqlDatatype",
    "Comment"
  ],
  lookup : ["Name","Datatype"]
})
export class MelField extends EntityLiteral {
    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal, primaryKeyNo:1, editable : false })  
    public TableName? : string   

    @Field({ type : FieldTypes.String, class : MelFieldClasses.Normal, primaryKeyNo:2, validators : [notBlank]})
    public Name? : string   

    @Field({type : FieldTypes.Enum, class : MelFieldClasses.Normal,
            validators : [V.datatype],
            enumValues : ['String', 'Code', 'Integer', 'Decimal', 'DateTime', 'Date', 'Time', 'Boolean', 'Enum', 'BigInt']})//, '10', '11', 'Object', 'Buffer']})
    public Datatype? : string   

    @Field({type : FieldTypes.Integer, class : MelFieldClasses.Normal})
    public Length? : number   

    @Field({type : FieldTypes.Integer, class : MelFieldClasses.Normal,  validators : [V.primaryKeyNo]})
    public PrimaryKeyNo? : number   

    @Field({ type : FieldTypes.Boolean, class : MelFieldClasses.Normal, validators : [V.isAutoIncrement]} )
    public IsAutoincrement? : boolean   

    @Field({type : FieldTypes.Enum , class : MelFieldClasses.Normal,enumValues : ['Normal', 'FlowField', 'FlowFilter']})
    public Class? : string   

    @Field({ type : FieldTypes.String, class : MelFieldClasses.Normal, validators : [V.flowFormula]})
    public FlowFormula? : string   

    @Field({
      type : FieldTypes.Enum, class : MelFieldClasses.Normal, 
      enumValues : ['VARCHAR', 'TINYINT', 'INT', 'BIGINT', 'DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'BOOLEAN', 'DOUBLE', 'ENUM', 'JSON','TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
      display : { doNotTranslate : true}
    })
    public SqlDatatype? : string   
    
    @Field({
      type : FieldTypes.Enum, class : MelFieldClasses.Normal,
      enumValues : ['NotBlank','NotZero']
    })
    public Validator? : string   

    @Field({ type : FieldTypes.String, class : MelFieldClasses.Normal, validators : [V.defaultValue]})
    public DefaultValue? : string   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal,  })
    public Format? : string   

    @Field({ type : FieldTypes.Boolean, class : MelFieldClasses.Normal, validators : [V.nullable]})  
    public Nullable? : boolean   

    @Field({type : FieldTypes.Boolean, class : MelFieldClasses.Normal}) 
    public Updateable? : boolean   

    @Field({ type : FieldTypes.Boolean, class : MelFieldClasses.Normal})  
    public DefaultSelect? : boolean   

    @Field({ type : FieldTypes.Boolean, class : MelFieldClasses.Normal})  
    public ShowDefault? : boolean   
    
    @Field({ type : FieldTypes.Boolean, class : MelFieldClasses.Normal})  
    public ShowInPart? : boolean   
    
    @Field({type : FieldTypes.Boolean, class : MelFieldClasses.Normal}) 
    public ShowInLookup? : boolean   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})
    public EnumValues? : string   

    @Field({type : FieldTypes.String, class : MelFieldClasses.Normal})
    public Comment? : string   

    @Field({type : FieldTypes.DateTime, class : MelFieldClasses.Normal, editable : false })  
    public timestamp? : Date   
    
    constructor(init? : Partial<MelField>){
      super()
      if (init) 
        Object.assign(this, init)
    }
  

}

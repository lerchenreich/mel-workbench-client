import { FieldTypes } from 'mel-common/types'
import { Table } from 'src/app/metadata/entities';
import { Column } from 'src/app/metadata/entities';
import { notBlank } from 'mel-common/validation';
import  * as V  from './field-validations';


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
export class MelField  {
    @Column({type : FieldTypes.String, primaryKeyNo:1, editable : false })  
    public TableName : string   

    @Column({ type : FieldTypes.String, primaryKeyNo:2, validators : [notBlank]})
    public Name : string   

    @Column({type : FieldTypes.Enum,
            validators : [V.datatype],
            enumValues : ['String', 'Code', 'Integer', 'Decimal', 'DateTime', 'Date', 'Time', 'Boolean', 'Enum', 'BigInt']})//, '10', '11', 'Object', 'Buffer']})
    public Datatype : string   

    @Column({type : FieldTypes.Integer})
    public Length : number   

    @Column({type : FieldTypes.Integer,  validators : [V.primaryKeyNo]})
    public PrimaryKeyNo : number   

    @Column({ type : FieldTypes.Boolean, validators : [V.isAutoIncrement]} )
    public IsAutoincrement : boolean   

    @Column({type : FieldTypes.Enum,enumValues : ['Normal', 'FlowField', 'FlowFilter']})
    public Class : string   

    @Column({ type : FieldTypes.String,  validators : [V.flowFormula]})
    public FlowFormula : string   

    @Column({
      type : FieldTypes.Enum, 
      enumValues : ['VARCHAR', 'TINYINT', 'INT', 'BIGINT', 'DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'BOOLEAN', 'DOUBLE', 'ENUM', 'JSON','TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
      display : { doNotTranslate : true}
    })
    public SqlDatatype : string   
    
    @Column({
      type : FieldTypes.Enum, 
      enumValues : ['NotBlank','NotZero']
    })
    public Validator : string   

    @Column({ type : FieldTypes.String, validators : [V.defaultValue]})
    public DefaultValue : string   

    @Column({type : FieldTypes.String,  })
    public Format : string   

    @Column({ type : FieldTypes.Boolean, validators : [V.nullable]})  
    public Nullable : boolean   

    @Column({type : FieldTypes.Boolean}) 
    public Updateable : boolean   

    @Column({ type : FieldTypes.Boolean})  
    public DefaultSelect? : boolean   

    @Column({ type : FieldTypes.Boolean})  
    public ShowDefault? : boolean   
    
    @Column({ type : FieldTypes.Boolean})  
    public ShowInPart? : boolean   
    
    @Column({type : FieldTypes.Boolean}) 
    public ShowInLookup : boolean   

    @Column({type : FieldTypes.String})
    public EnumValues : string   

    @Column({type : FieldTypes.String})
    public Comment : string   

    @Column({type : FieldTypes.DateTime, editable : false })  
    public timestamp : Date   
    
    constructor(init? : Partial<MelField>){
        if (init) Object.assign(this, init)
    }
  

}

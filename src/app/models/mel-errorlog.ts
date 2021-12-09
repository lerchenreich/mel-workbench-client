
import { Column } from 'src/app/metadata/entities'
import { Table } from 'src/app/metadata/entities'
import { FieldTypes } from '../types'
@Table()
export class MelErrorLog {
    @Column({type : FieldTypes.BigInt, primaryKeyNo : 1, editable : false })  
    public Id : bigint   

    @Column({type : FieldTypes.String})
    public Method : string   
    
    @Column({type : FieldTypes.Enum, enumValues : []})
    public Class : string   

    @Column({type : FieldTypes.String})
    public Message : string   

    @Column({type : FieldTypes.String})
    public Details : string   

    @Column({type : FieldTypes.DateTime})  
    public timestamp : Date   
}
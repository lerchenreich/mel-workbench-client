
import { isBlank , blankMandatory, notTrue, notBlank, notFalse, greaterThan, ValidationFunc  } from 'mel-common'
import { MelField } from './mel-field';

async function valueOk(value : any) : Promise<any>{
  return new Promise<any>((resolve, reject) => {
    resolve(value)
  })
}

export async function flowFormula(value : any, row : MelField) : Promise<any> {
  return row.Class === 'Normal' ? blankMandatory(row.FlowFormula) : notBlank(row.FlowFormula)
}
export async function primaryKeyNo(value : any, row : MelField) : Promise<any> {
  return row.IsAutoincrement ? greaterThan(row.PrimaryKeyNo, 0) : valueOk(row.PrimaryKeyNo)
}
export async function isAutoIncrement(value : any, row : MelField) : Promise<any> {
  return row.PrimaryKeyNo? valueOk(value) : notTrue(row.IsAutoincrement) 
}
export async function defaultValue(value : any, row : MelField) : Promise<any> {
  if (row.Class === 'Normal' && row.Nullable) 
    return notBlank(row.DefaultValue)
  return valueOk(value)
}

export async function nullable(value : any, row : MelField) : Promise<any> {
  if (row.Class === 'Normal' && isBlank(row.DefaultValue)) 
    return notTrue(row.Nullable)
  return valueOk(value)
}

export var datatype : ValidationFunc<MelField> 
/*
export function datatype(value : boolean, row : DatasourceRow | MelColumn) : Promise<any> {
  const err = (row as DatasourceRow).checkFields("Datatype", [neededFieldnames...])
  if (err) return err
  const rec = row as MelColumn
  if (rec.Class === 'Normal' && rec.DefaultValue.length==0) 
    return notTrue(value)
  return validationOk
}
*/
import { Entity } from "mel-client"

export declare interface ILookupDialogData {
  title? : string
  lookupFor? : ILookupFor
  currValue? : any
}

export declare interface ILookupDialogResult {
  selectedRow : Entity
  key : string
}

export declare interface ILookupFor { 
  entity : string, 
  fieldName : string 
}

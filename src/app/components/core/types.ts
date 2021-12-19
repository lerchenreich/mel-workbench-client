import { NextObserver, CompletionObserver } from "rxjs"
import { SortOrder } from 'mel-common'
import { Field } from "../controls/fields/field"
import { ListFieldComponent } from "../controls/fields/listfield/listfield.component"
import { Permissions } from "./page"
import { ListRow, PageData } from "./page-data"
import { InputSubType, FieldMetadata, EntityLiteral } from "../../types"

export enum PageTypes {undefined, Card, List, CardPart, ListPart};
export enum PageMessageTypes { nothing, dataChanged, modeChanged };
export enum PageModes {View, Edit, Insert, Error, None}

export declare type SaveRequestEvent = {
  pageData : PageData<EntityLiteral, Field>
  afterSavedObserver? : CompletionObserver<any>
} 

export declare type LookupDialogData = {
  title? : string
  lookupFor : LookupFor
  currValue? : any
}

export declare type ILookupDialogResult = {
  ok : boolean
  selectedRow : EntityLiteral
  key : string
}

export declare type LookupFor = { 
  entity : string, 
  fieldName : string 
}

export declare type FieldNavigationEvent = {
  field : ListFieldComponent
  keyboardEvent : KeyboardEvent
} 
export declare type FieldShortcutEvent = {
  field : ListFieldComponent
  keyboardEvent : KeyboardEvent
} 

export declare type RowChangedEvent = {
  newRowIndex   : number
  row           : ListRow<any>
  //observer      : CompletionObserver<any>
}
export declare type FieldContext<Entity extends EntityLiteral> = {
  //Common context
  subType?            : InputSubType
  value?              : any
  meta?               : FieldMetadata<Entity>

  data?               : PageData<Entity, Field>
  lookupFor?          : LookupFor
  assistObs?          : NextObserver<Field>     // Assist-button pressed
  changedObs?         : NextObserver<string|boolean> // value has changed and is valid
  touchedObs?         : NextObserver<Field>  // the fieldvalue was changed and is valid
  // Card context
  editable?           : boolean
  caption?            : string
  hint?               : string
  // List context
  colIndex?           : number
  initializationObs?  : NextObserver<ListFieldComponent>    // a field in alist is initialized and can be used
  navigationObs?      : NextObserver<FieldNavigationEvent>  // a navigation-key was pressed
  shortcutObs?        : NextObserver<FieldShortcutEvent>    // a shortcut was pressed
  rowChangedObs?      : NextObserver<RowChangedEvent>        // the row has lost focus and is dirty and valid
}

export declare type ListContext<Entity extends EntityLiteral> = {
  permissions?  : Permissions
  metadata?     : FieldMetadata<Entity>[]
  touchedObs?   : NextObserver<ListFieldComponent>
  sortObs?      : NextObserver<SortOrder<Entity>> 
  saveObs?      : NextObserver<SaveRequestEvent>
  addRowObs?    : NextObserver<number>
}
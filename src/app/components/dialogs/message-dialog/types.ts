//import { ObjectLiteral } from "../../../core/types";

import { ObjectLiteral } from "mel-client"

export enum MsgButton { Yes = 1, No = 2, Ok = 4, Cancel = 8, Ignore = 16, Retry = 32, GotIt = 64 }
export const msgButtonTranslations = new Map<MsgButton, string> ([
  [MsgButton.Yes, "Yes"],
  [MsgButton.No, "No"],
  [MsgButton.Ok, "Ok"],
  [MsgButton.Cancel, "Cancel"],
  [MsgButton.Ignore, "Ignore"],
  [MsgButton.GotIt, "GotIt"],
  [MsgButton.Retry, "Retry"],
])  
export enum MsgDialogButton  {  
  Ok    = MsgButton.Ok,
  GotIt = MsgButton.GotIt,
  Ignore = MsgButton.Ignore,
  YesNo = MsgButton.Yes|MsgButton.No, 
  YesNoRetry = MsgButton.Yes|MsgButton.No|MsgButton.Retry, 
  YesNoIgnore = MsgButton.Yes|MsgButton.No|MsgButton.Ignore,
  OkCancel = MsgButton.Ok|MsgButton.Cancel, 
  OkCancelRetry = MsgButton.Ok|MsgButton.Cancel|MsgButton.Retry, 
}

export enum MsgResult { Positive, Negative, Ignore, Retry }

export declare type MsgReportItem = {
  message: string;
  annotation?: string;
  result: boolean;
}
export interface MsgDialogData {
  title?   : string
  message? : string
  context? : ObjectLiteral
  reportItems? : MsgReportItem[]
  buttons? : MsgDialogButton
  default? : MsgResult
}
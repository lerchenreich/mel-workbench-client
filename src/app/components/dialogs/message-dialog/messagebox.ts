
import { BsModalService } from "ngx-bootstrap/modal";
import { Subject } from "rxjs";
import { openDialog } from "../mel-modal";
import { MessageDialogComponent } from "./message-dialog.component";
import { MsgDialogData, MsgResult } from "./types";


export function MessageBox(modal : BsModalService, dlgData : MsgDialogData): Subject<MsgResult>{
  const resultEmitter = new Subject<MsgResult>()
  openDialog<MessageDialogComponent, MsgResult>(modal, MessageDialogComponent, { initialState : dlgData })
  .then( result => resultEmitter.next(result))
  .catch( dc => {} )
  return resultEmitter
}       
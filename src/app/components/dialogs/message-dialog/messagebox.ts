
import { EventEmitter } from "@angular/core";
import { openModal } from "mel-client";
import { BsModalService } from "ngx-bootstrap/modal";
import { map, Observable, take } from "rxjs";


import { MessageDialogComponent } from "./message-dialog.component";
import { MsgDialogData, MsgResult } from "./types";


export function MessageBox(modal : BsModalService, dlgData : MsgDialogData): Observable<MsgResult>{
  return openModal(modal, MessageDialogComponent, { initialState : dlgData } )
}       
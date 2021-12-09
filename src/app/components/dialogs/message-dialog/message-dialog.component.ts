import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

enum Buttons { Yes = 1, No = 2, Ok = 4, Cancel = 8, Ignore = 16 }

export enum DialogButtons  {  
  YesNo = Buttons.Yes|Buttons.No , 
  OkCancel = Buttons.Ok|Buttons.Cancel, 
  Ignore = Buttons.Ignore
}

export enum MessageResults { YesOk, NoCancel, Ignore }

export interface IMessageDialogData {
  title   : string
  message : string
  buttons : DialogButtons
  default : MessageResults
}

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css']
})
export class MessageDialogComponent {
  default : MessageResults
  okButton : boolean = false
  yesButton : boolean = false
  cancelButton : boolean = false
  noButton : boolean = false
  ignoreButton : boolean = false

  get focusOk() { return this.default == MessageResults.YesOk }
  get focusReject() { return this.default == MessageResults.NoCancel }
  get focusIgnore() { return this.default == MessageResults.Ignore }

  constructor(@Inject(MAT_DIALOG_DATA) public data: IMessageDialogData, private translate : TranslateService) { 
    this.default    = data.default
    this.okButton     = (data.buttons & Buttons.Ok) == Buttons.Ok 
    this.yesButton    = (data.buttons & Buttons.Yes) == Buttons.Yes
    this.cancelButton = (data.buttons & Buttons.Cancel) == Buttons.Cancel
    this.noButton     = (data.buttons & Buttons.No) == Buttons.No
    this.ignoreButton = (data.buttons & Buttons.Ignore) == Buttons.Ignore
  }       
  
  answer(result:MessageResults) : MessageResults { return result }
}

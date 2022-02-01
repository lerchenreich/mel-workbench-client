import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ObjectLiteral } from 'mel-client' //../../../core/types';
import { MsgReportItem, MsgButton, MsgDialogButton, 
  MsgDialogData, MsgResult, msgButtonTranslations } from './types';
import { MelModal } from '../mel-modal';
@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css']
})
export class MessageDialogComponent extends MelModal<MsgDialogData, MsgResult> implements AfterViewInit, OnInit, MsgDialogData {
  @ViewChild('btnPositive') buttonPositiveRef?: MatButton;
  @ViewChild('btnNegative') buttonNegativeRef?: MatButton;
  @ViewChild('btnIgnore')   buttonIgnoreRef?: MatButton;
  @ViewChild('btnRetry')    buttonRetryRef?: MatButton;

  constructor(modalRef : BsModalRef, public translate : TranslateService) { 
    super(modalRef)
  } 
  // MsgDialogData implementation
  title : string = 'Message'
  message : string = ''
  context? : ObjectLiteral 
  reportItems? : MsgReportItem[]
  buttons? : MsgDialogButton   
  default? : MsgResult

  // MelModal implementation
  resultValue? : MsgResult
  get returnValue(): MsgResult | undefined {
    return this.resultValue    
  }
 
  override set dlgData(data: MsgDialogData) {
    if (data.title) this.title = data.title
    this.message = this.message
    if (data.context) this.context = data.context
    if (data.reportItems) this.reportItems = data.reportItems
    this.buttons = data.buttons || MsgDialogButton.Ok
    this.default = data.default || MsgResult.Positive
  }
  readonly Positive = MsgResult.Positive
  readonly Negative = MsgResult.Negative
  readonly Ignore = MsgResult.Ignore
  readonly Retry = MsgResult.Retry
  readonly keyPrefix = 'Command.'

  negativeKey? : string 
  positiveKey? : string
  retryKey? : string
  ignoreKey? : string


  reportFieldNames = ['message', 'result']
  // getter / setter
  get showRetryButton()     : boolean { return this.retryKey !== undefined }
  get showIgnoreButton()    : boolean { return this.ignoreKey !== undefined }
  get showNegativeButton()  : boolean { return this.negativeKey !== undefined }
  get showPositiveButton()  : boolean { return this.positiveKey !== undefined }

  ngOnInit(): void {
    if (!this.buttons)
      this.buttons = MsgDialogButton.Ok
   
    switch(this.buttons){
      case MsgDialogButton.GotIt        : this.positiveKey = msgButtonTranslations.get(MsgButton.GotIt)
                                          break
      case MsgDialogButton.Ok           : this.positiveKey = msgButtonTranslations.get(MsgButton.Ok)
                                          break
      case MsgDialogButton.OkCancel     : this.positiveKey = msgButtonTranslations.get(MsgButton.Ok) 
                                          this.negativeKey = msgButtonTranslations.get(MsgButton.Cancel) 
                                          break
      case MsgDialogButton.YesNo        : this.positiveKey = msgButtonTranslations.get(MsgButton.Yes) 
                                          this.negativeKey = msgButtonTranslations.get(MsgButton.No) 
                                          break
      case MsgDialogButton.OkCancelRetry: this.positiveKey = msgButtonTranslations.get(MsgButton.Ok) 
                                          this.negativeKey = msgButtonTranslations.get(MsgButton.Cancel) 
                                          this.retryKey    = msgButtonTranslations.get(MsgButton.Retry) 
                                          
                                          break
      case MsgDialogButton.YesNoRetry :   this.positiveKey = msgButtonTranslations.get(MsgButton.Yes) 
                                          this.negativeKey = msgButtonTranslations.get(MsgButton.No) 
                                          this.retryKey    = msgButtonTranslations.get(MsgButton.Retry) 
                                          break
      case MsgDialogButton.YesNoIgnore  : this.positiveKey = msgButtonTranslations.get(MsgButton.Yes) 
                                          this.negativeKey = msgButtonTranslations.get(MsgButton.No) 
                                          this.retryKey    = msgButtonTranslations.get(MsgButton.Ignore) 
                                          break
    } 
    if (this.default === undefined) {
      this.default = this.negativeKey? MsgResult.Negative : MsgResult.Positive
    }
  }
  ngAfterViewInit(): void {
    switch(this.default){
      case MsgResult.Positive : this.buttonPositiveRef?.focus();  break
      case MsgResult.Negative : this.buttonNegativeRef?.focus();  break
      case MsgResult.Ignore   : this.buttonIgnoreRef?.focus();    break
      case MsgResult.Retry    : this.buttonRetryRef?.focus();     break
    }
  }

  resultImg(result : boolean) : string {
    return `assets/images/${(result?'mel_ok':'mel_notok')}.png`  
  }
  
  close(result : MsgResult){
    this.resultValue = result
    this.okClicked()
  }
  
}

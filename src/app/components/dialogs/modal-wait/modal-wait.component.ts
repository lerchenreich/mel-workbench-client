import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { EntityLiteral } from 'mel-common';
@Component({
  selector: 'app-modal-wait',
  template: `
  <div class="modal-header" >
    <h4 *ngIf="title" class="modal-title" style="text-align: center;" [translate]="title" [translateParams]="titleCtx"></h4>
  </div> 
  <div class="modal-body" style="text-align: center;">
    <img src="http://www.barbaraskunst.net/comics/comic-animationen/schleiertanz.gif" >
    <br/><br/>
    <span [translate]="action" [translateParams]="actionCtx"></span>
  </div>`,
  styleUrls: ['./modal-wait.component.css'],
  providers: [ BsModalService ]
})
export class ModalWaitComponent  {

  @Input() title? : string 
  @Input() action : string = "Dialog.Wait.Action"
  @Input() titleCtx : any
  @Input() actionCtx : any
  
  constructor(public modal : BsModalService, public translate : TranslateService) { }

}

/**
 * Runs a modaldialog with a title, displays actions until an updateaction i null
 * @param modal the modalDialog
 * @param title       the title to translate
 * @param titleCtx    the context of the title to translate
 * @returns           a function to change the action and/or the actioncontext. Null as action closes the dialog
 */
export function waitDialog(modal : BsModalService, title? : string, titleCtx? : EntityLiteral) : (newActionOrContext : string | EntityLiteral | null, newActionContext? : EntityLiteral) => void {
  var dlgRef : BsModalRef
  function updateAction(newActionOrContext : string | EntityLiteral | null, newActionContext? : EntityLiteral):void {
    if (newActionOrContext === null){
      dlgRef.hide()
    } 
    else if (dlgRef.content) {
      if (typeof newActionOrContext === 'string'){
        dlgRef.content.action = newActionOrContext
        dlgRef.content.actionCtx = newActionContext
      }
      else 
        dlgRef.content.actionCtx = newActionOrContext
    }
  }

  dlgRef = modal.show(ModalWaitComponent, { 
    backdrop : 'static', 
    initialState : {
      title     : title || "Dialog.Wait.Title",
      titleCtx  : titleCtx
    }}
  )
  return updateAction
}
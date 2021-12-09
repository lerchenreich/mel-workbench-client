import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-wait',
  templateUrl: './modal-wait.component.html',
  styleUrls: ['./modal-wait.component.css']
})
export class ModalWaitComponent  {

  @Input() title : string = "Dialog.Wait.Title" 
  @Input() action : string = "Dialog.Wait.Action"
  @Input() titleContext : any
  @Input() actionContext : any
  
  constructor(public activeModal : NgbActiveModal, public translate : TranslateService) { }

}

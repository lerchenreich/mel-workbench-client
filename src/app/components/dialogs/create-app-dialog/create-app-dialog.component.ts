import { AfterViewInit, Component, OnInit, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AppService, FieldContext, PageTypes } from 'mel-client';
import { CreateAppDlgData } from '../../../models/createapp-dialog';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { MelModalEntity } from '../mel-modal-entity';
import { MsgDialogButton } from '../message-dialog/types';
import { MessageBox } from '../message-dialog/messagebox';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-app-dialog',
  templateUrl: './create-app-dialog.component.html',
  styleUrls: ['./create-app-dialog.component.css']
})
export class CreateAppDialogComponent extends MelModalEntity<CreateAppDlgData, CreateAppDlgData> {
  readonly transPrefix  = "App.Dialog.CreateApp."

  constructor(modalRef:BsModalRef, protected appService:AppService, translate:TranslateService, modal : BsModalService) {
    super(modalRef, CreateAppDlgData.name, translate, modal)
    this.setEditMode()
  }  
  get title() { return this.caption }
  get pageType(): PageTypes { return PageTypes.ModalDialog }
  // abstract member implementation
  get returnValue() : CreateAppDlgData | undefined { return this.cardData?.assertVRec}

  context(fieldName : string) : FieldContext<CreateAppDlgData>{
    return {
      meta  : this.getFieldMd(fieldName),
      data : this.cardData,
      editable : true
      //touchedObs : { next : field => this.Rec.triggerColumn(field.name, field.validationRec)}, 
      //changedObs : { next : value => {if (this.shouldSave) this.saveData() } }
    }
  }    
 
}


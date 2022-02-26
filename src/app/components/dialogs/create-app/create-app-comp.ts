import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal as ModalRef} from '@ng-bootstrap/ng-bootstrap';
import { UntilDestroy } from '@ngneat/until-destroy';

import { AppService, CardfieldContext, PageTypes } from 'mel-client';
import { CreateAppDlgData } from './data';
import { MelModalEntity } from 'mel-client';


@Component({
  selector: 'app-create-app-dialog',
  templateUrl: './create-app-comp.html',
  styles: [`
    .separatorHorz {
      border: 0;
      background-color: lightgray;
      height: 1px;
      margin-bottom: 12px;
      text-align: right;
    }`,`
    .separator {
      text-align: left;
      font-weight: 400;
    }`
    ]
})
@UntilDestroy()
export class CreateAppDialogComponent extends MelModalEntity<CreateAppDlgData, CreateAppDlgData> {
  readonly transPrefix  = "App.Dialog.CreateApp."

  constructor(modalRef: ModalRef, protected appService:AppService, translate:TranslateService) {
    super(modalRef, CreateAppDlgData.name, translate)
    this.setEditMode()
  }  
  
  get title() { return this.caption }
  get pageType(): PageTypes { return PageTypes.ModalDialog }
  // abstract member implementation
  get returnValue() : CreateAppDlgData{ return this.entityUI.pickEntityFields() as CreateAppDlgData}

  override context(fieldName : string) : CardfieldContext{
    return Object.assign(super.context(fieldName), { editable : true })    
      //touchedObs : { next : field => this.Rec.triggerColumn(field.name, field.validationRec)}, 
  }    
 
}

import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal as ActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NextObserver } from 'rxjs';

import { OpenDialogOptions, OpenDialogReturnValue } from 'electron/renderer'
import { ElectronService } from 'ngx-electron';

import { PageTypes, MelModalEntity, AppService, BaseInputComponent, CardfieldContext} from 'mel-client';

import { CreateServerDlgData } from './data';

@Component({
  selector: 'app-create-server',
  templateUrl: './create-server.comp.html',
  styleUrls: [ './create-server.comp.css']
})
@UntilDestroy()
export class CreateServerComponent extends MelModalEntity<CreateServerDlgData, CreateServerDlgData> {

  constructor(activeModal: ActiveModal, protected appService:AppService, translate:TranslateService,
    public eSvc : ElectronService) {
    super(activeModal, CreateServerDlgData.name, translate)
    if (!this.eSvc.ipcRenderer)
      this.setViewMode()
  }

  readonly transPrefix = 'App.Dialog.CreateServer.'
  get title() { return this.caption }
  get pageType(): PageTypes { return PageTypes.ModalDialog }

  // abstract member implementation
  get returnValue() : CreateServerDlgData{
    return this.entityUI.pickEntityFields() as CreateServerDlgData
  }

  override context(fieldName : string) : CardfieldContext{
    return super.context(fieldName)
  }

  targetDirAssistObs : NextObserver<BaseInputComponent> = {
    next : input  => {
      console.info('Assist clicked')
      const options : OpenDialogOptions = {
        title : this.translate.instant(this.transPrefix + "SelectFolder"),
        defaultPath : input.value,
        properties : ['openDirectory', 'createDirectory', 'promptToCreate']
      }
      this.eSvc.ipcRenderer.invoke('opendialog', options)
      .then( (result : OpenDialogReturnValue) => {
        if (!result.canceled){
          input.value = result.filePaths[0]
          this.entityUI.afterFieldvalueChanged(input.value, 'TargetDir')
        }
      })
      .catch( error => {})
    }
  }



}


import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal as ActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { UntilDestroy } from '@ngneat/until-destroy';

import { AppService, CardfieldContext, PageTypes, MelModalEntity  } from 'mel-client';
import { CreateAppDlgData } from './data';

@Component({
  selector: 'app-create-app-dialog',
  templateUrl: './create-app-comp.html',

})
@UntilDestroy()
export class CreateAppDlgComponent extends MelModalEntity<CreateAppDlgData, CreateAppDlgData> {
  readonly transPrefix  = "App.Dialog.CreateApp."

  constructor(activeModal: ActiveModal, protected appService:AppService, translate:TranslateService) {
    super(activeModal, CreateAppDlgData.name, translate)
    this.setEditMode()
  }

  get title() { return this.caption }
  get pageType(): PageTypes { return PageTypes.ModalDialog }
  companyDbNames? : string[]
  // abstract member implementation
  get returnValue() : CreateAppDlgData{ return this.entityUI.pickEntityFields() as CreateAppDlgData}

  override context(fieldName : string) : CardfieldContext{
    return Object.assign(super.context(fieldName), { editable : true })
  }
  dbNameContext() : CardfieldContext {
    const context = this.context('CompanyDbName')
    context.meta.enumValues = this.companyDbNames
    return context
  }

  protected override mapEntity(entity : Partial<CreateAppDlgData>) : Partial<CreateAppDlgData>{
    this.companyDbNames = entity.CompanyDbNames?.slice()
    return entity
  }

}


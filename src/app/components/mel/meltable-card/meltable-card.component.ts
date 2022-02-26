import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal as ModalService } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'lodash'

import { MelTable, CardDbPage,  MelTableService, AlertService, EntityUI } from 'mel-client';

@Component({
  selector: 'app-meltable-card',
  templateUrl: './meltable-card.component.html',
  styleUrls: ['./meltable-card.component.scss'],
  providers: [MelTableService]
})
@UntilDestroy()
export class MelTableCardComponent  extends CardDbPage<MelTable> implements OnInit {
  constructor(private route: ActivatedRoute,
              router: Router, 
              translate : TranslateService,
              melTableService : MelTableService,  
              modal : ModalService,
              snackBar : MatSnackBar, alertService : AlertService ) { 
    super( router, melTableService,  translate, modal, snackBar, alertService)
  }
  get sublistLocked() : boolean { return !isEmpty(this.rec?.Name)}
  public get ui() : EntityUI<MelTable> { return this.entityUI }
  ngOnInit() : void {
    this.accessRights = 'md'
    const tablename = this.route.snapshot.paramMap.get('name')
    if (tablename){
      if ( tablename.length === 0)  
        this.add()
      else {
        this.param.Name = tablename  
        this.rec.Name = tablename
        this.get([this.findObserver])
      } 
    }
  }
  
}

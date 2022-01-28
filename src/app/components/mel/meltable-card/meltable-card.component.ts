import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'

import { MelTable, Card, MelTableService, AlertService } from 'mel-client';
import { BsModalService } from 'ngx-bootstrap/modal';


@Component({
  selector: 'app-meltable-card',
  templateUrl: './meltable-card.component.html',
  styleUrls: ['./meltable-card.component.scss'],
  providers: [MelTableService]
})
@UntilDestroy()
export class MelTableCardComponent  extends Card<MelTable> implements OnInit {
  constructor(private route: ActivatedRoute,
              router: Router, 
              translate : TranslateService,
              melTableService : MelTableService,  
              modal : BsModalService,
              snackBar : MatSnackBar, alertService : AlertService ) { 
    super( router, translate, melTableService, modal, snackBar, alertService)
  }
  get sublistLocked() : boolean { return !isEmpty(this.rec?.Name)}
  
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

import { Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash'

import { MelTable, Card } from 'mel-client';


@Component({
  selector: 'app-meltable-card',
  templateUrl: './meltable-card.component.html',
  styleUrls: ['./meltable-card.component.scss']
})
@UntilDestroy()
export class MelTableCardComponent  extends Card<MelTable> implements OnInit {
  constructor(private route: ActivatedRoute,
              injector : Injector, 
              router: Router, translate : TranslateService,  
              messageBox : MatDialog, snackBar : MatSnackBar ) { 
    super(MelTable, router, injector, translate, messageBox, snackBar)
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

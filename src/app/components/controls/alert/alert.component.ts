import { AfterViewInit, Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AlertService, IAppAlert } from '../../../services/alert.service';

@Component({
  selector: 'app-alert',
  template: 
  `<div  *ngIf="alerts">
      <p *ngFor="let alert of alerts; let i=index">
        <ngb-alert [type]="alert.type" (closed)="closeAlert(alert)">
          <div style="display:flex" >
            {{ alert.message | translate }}<span class="fill-remaining-space"></span>Details 
            <button *ngIf="alert.details" mat-icon-button class="up-down" style="line-height: 20px;" (click)="toggle(i)">
              <div [style.display]="hide(i)"> <mat-icon class="up-down" >arrow_drop_down</mat-icon></div>
              <div [style.display]="show(i)"> <mat-icon class="up-down" >arrow_drop_up</mat-icon></div>
            </button> 
          </div>
          <table *ngIf="alert.details" [style.display]="show(i)">
            <tr *ngFor="let detail of alert.details;">
              <td>{{detail}}<span class="fill-remaining-space"></span> </td>
            </tr> 
          </table>
        </ngb-alert>
      </p>
  </div>`,
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements AfterViewInit {

  private detailVisible : boolean[]
  constructor(private alertService : AlertService, public translate : TranslateService) { 
    this.detailVisible = []
  }
  get alerts() : IAppAlert[] { return this.alertService._alerts }

  ngAfterViewInit(){
    for(let i in this.alerts) this.detailVisible.push(false)
  }
  show(i : number) : string {
    return this.detailVisible[i]? 'block' : 'none'
  }
  hide(i : number) : string {
    return this.detailVisible[i]? 'none' : 'block'  
  }
  toggle( i : number) {
    this.detailVisible[i] = !this.detailVisible[i]
  }
  closeAlert(alert : IAppAlert) {
    this.alertService.close(alert) 
  }
}

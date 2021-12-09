import { Component, ElementRef, Input} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BaseSelectComponent} from '../base-select'

@Component({
  selector: 'mel-card-select',
  template: `
    <div class="row">
      <div class="col-10" > 
        <label class="form-label" [style.margin-bottom]="marginBottom" for="{{id}}">{{caption}}</label><br/>  
        <mat-select class="form-control"
          [(ngModel)]="value" 
          [caption]="caption"
          [editable]="editable"
          [options]="options"
          [changedObs]="changedObs"
          (selectionChange)="onSelectionChange($event)"  
        >
          <mat-option *ngFor="let option of enumValues; let i = index" [value]="option">{{dispEnumValues[i]}}</mat-option>
        </mat-select>  
      </div>
      <div class="col-2"> </div>    
    </div>
  `,
 styleUrls: ['./card-select.component.css']
})
@UntilDestroy()
export class CardSelectComponent extends BaseSelectComponent {

  constructor(host: ElementRef) {
    super(host)
  }
  @Input() editable : boolean 
  @Input() caption : string 
}

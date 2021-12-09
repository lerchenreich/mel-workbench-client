import { Component, ElementRef, Input} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BaseCheckboxComponent } from '../base-checkbox';

@Component({
  selector: 'mel-card-checkbox',
  template: `
  <ng-container *ngIf="caption">
    <label class="form-label" [style.margin-bottom]="marginBottom" for="{{id}}">{{caption}}</label><br/>
  </ng-container>  
  <mat-checkbox 
    [checked]="value" 
    [disabled]="!editable"   
    [caption]="caption"
    [changedObs]="changedObs"   
    [style.margin-bottom]="marginBottom" 
    aria-label=""
    (change)="onChange($event)">
  </mat-checkbox>`,
  styleUrls: ['./card-checkbox.component.css']
})
@UntilDestroy()
export class CardCheckboxComponent extends BaseCheckboxComponent {
  
  constructor(host: ElementRef) { 
    super(host)
  }

  @Input() caption : string
}
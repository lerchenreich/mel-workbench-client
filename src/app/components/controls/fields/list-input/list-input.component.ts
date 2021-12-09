import { Component, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BaseInputComponent } from '../base-input';

@Component({
  selector: 'mel-list-input',
  template: `
    <input matInput 
      type="text" 
      focusable 
      autocomplete="false"
      [subType]="subType"
      [value]="value" 
      [lookupFor]="lookupFor"
      [assistObs]="assistObs">                
    <button mat-icon-button [style.display]="lookupButtonDisplay"  #lookupButton (click)="onLookupClick()">
      <mat-icon>arrow_upward</mat-icon>
    <button mat-icon-button [style.display]="assistButtonDisplay" #assistButton (click)="onAssistClick()">
      <mat-icon>more_horiz</mat-icon>
    </button>
    `,
  styleUrls: ['./list-input.component.css']
})
@UntilDestroy()
export class ListInputComponent extends BaseInputComponent {
  
  constructor(host: ElementRef,  lookupDialog : MatDialog) {
    super(host, lookupDialog)
  }

}
import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BaseCheckboxComponent } from '../base-checkbox';

@Component({
  selector: 'mel-list-checkbox',
  template: ` 
  <mat-checkbox
    [checked]="value" 
    [changedObs]="changedObs"
    [style.margin-bottom]="marginBottom" 
    [editable]="editable"
    aria-label=""
    (change)="onChange($event)">
   
  </mat-checkbox>`,
  styleUrls: ['./list-checkbox.component.css']
})
@UntilDestroy()
export class ListCheckboxComponent extends BaseCheckboxComponent implements AfterViewInit {
  
  constructor(host: ElementRef) { 
    super(host)
  }
  
  @HostListener('click', ['$event']) 
  onClick(event : MouseEvent){ 
    event.cancelBubble = this.hasParent('TD', 'TR')
    if (!this.editable) 
      event.preventDefault()
  }

  ngAfterViewInit() {
    if (this.editable)
      this.inputElement?.focus()
  }
  override onChange(event : MatCheckboxChange) {
    if (this.editable)
      super.onChange(event)
    
  }
}
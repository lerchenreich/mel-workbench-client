import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BaseSelectComponent } from '../base-select';
@Component({
  selector: 'mel-list-select',
  template: `
    <mat-select
      [(ngModel)]="value"  
      [options]="options"
      [changedObs]="changedObs"
      (selectionChange)="onSelectionChange($event)" > 
      <mat-option 
        *ngFor="let option of enumValues; let i = index" [value]="option">{{dispEnumValues[i]}}
      </mat-option>
    </mat-select>  
  `,
  styleUrls: ['./list-select.component.css']
})
@UntilDestroy()
export class ListSelectComponent extends BaseSelectComponent implements AfterViewInit{
  constructor(host: ElementRef) {
    super(host)
  }
  
  @HostListener('click', ['$event']) 
  onClick(event : MouseEvent){ 
    event.cancelBubble = this.hasParent('TD', 'TR')
  }
 
  ngAfterViewInit() {
      this.host.nativeElement.firstElementChild.focus()
  }
  
}

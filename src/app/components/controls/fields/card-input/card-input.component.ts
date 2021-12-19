import { Component, ElementRef, AfterViewInit, EventEmitter, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import { NextObserver } from 'rxjs';
import { BaseInputComponent } from '../base-input';
var q$ = require('jquery')
@Component({
  selector: 'mel-card-input',
  template: `

    <div class="row">
      <div class="col-10" > 
        <label class="form-label" for="{{id}}">{{caption}}</label> 
          <input class="form-control"   
          [(ngModel)]="value"
          [caption]="caption"
          [subType]="subType"
          [editable]="editable"
          [lookupFor]="lookupFor"
          [assistObs]="assistObs"
          [changedObs]="changedObs"
          (change)="onChange($event)"
        >                
        </div>   
    <div style="margin-top:2.0em">
          <button mat-icon-button [style.display]="lookupButtonDisplay"  #lookupButton (click)="onLookupClick()">
            <mat-icon>arrow_upward</mat-icon>
          </button>
     
          <button mat-icon-button [style.display]="assistButtonDisplay" #assistButton (click)="onAssistClick()">
            <mat-icon>more_horiz</mat-icon>
          </button>
    </div>     
    </div>
 
`,
  styleUrls: ['./card-input.component.css']
})
@UntilDestroy()
export class CardInputComponent extends BaseInputComponent implements AfterViewInit {
  
  constructor(host: ElementRef, lookupDialog : MatDialog) {
    super(host, lookupDialog)
  }
  inputChanged = new EventEmitter<any>()

  @Input() caption : string = ''
  @Input() placeholder : string = ''
  @Input() editable : boolean = false
  @Input() set changedObs(obs : NextObserver<string|boolean>){
    if(obs) 
      this.inputChanged.pipe(untilDestroyed(this)).subscribe(obs)
  } 

  ngAfterViewInit(){
    if (!this.editable){
       (q$(this.host.nativeElement).find('input')?.get(0) as HTMLInputElement).setAttribute("disabled",'')
    }
  }

  onChange(event :Event){
    this.inputChanged.next( (event.target as HTMLInputElement).value)
  }
  
}

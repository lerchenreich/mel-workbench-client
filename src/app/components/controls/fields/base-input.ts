import { ElementRef, Input, EventEmitter, Directive, HostBinding } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import { InputSubType } from '../../../types';
import { NextObserver } from 'rxjs';
import { LookupDialogData, ILookupDialogResult, LookupFor } from 'src/app/components/core/types';
import { LookupDialogComponent } from '../../dialogs/lookup-dialog/lookup-dialog.component';
import { MelElement } from './element';


@Directive()
export class BaseInputComponent extends MelElement {
  
  constructor(host: ElementRef,  private lookupDialog : MatDialog) {
    super(host)
  }
  static nextId : number = 1
  readonly controlType = 'mel-input'
  protected assistRequest = new EventEmitter<any>()
  public showAssistButton : boolean = false
  
  @Input() value : any
  @Input() subType : InputSubType = 'none'
  @Input() lookupFor? : LookupFor 
  @Input() set assistObs(obs : NextObserver<any>){
    if (obs && !this.showAssistButton) {
      this.showAssistButton = true 
      this.assistRequest.pipe(untilDestroyed(this)).subscribe(obs)
    }
  }
  get assistButtonDisplay() : string { return this.showAssistButton? 'block' : 'none'}
  get lookupButtonDisplay() : string { return this.lookupFor? 'block' : 'none'}
  
  @HostBinding() id: string = `${this.controlType}${BaseInputComponent.nextId++}`
  
  onAssistClick(){
    this.assistRequest.next(this)
  }
  
  onLookupClick() {
    var lookupData : LookupDialogData = {
      lookupFor : this.lookupFor as LookupFor,
      currValue : this.value
    }
    const dialogRef = this.lookupDialog.open(LookupDialogComponent, {data : lookupData});
    dialogRef.afterClosed().subscribe( lookupResult  => {
      const result = lookupResult as ILookupDialogResult
      if ( result.ok && this.value !== result.selectedRow[result.key])
          this.value = result.selectedRow[result.key]
    });
  }
}
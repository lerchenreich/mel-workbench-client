import { Component, ElementRef, Input } from '@angular/core';

/**
 * A selectfield bur readonly for Enum-fields in a list
 */
@Component({
  selector: 'mel-enum',
  template: `<span>{{mappedValue}}</span>`,
  styleUrls: ['./enum.component.css']
})
export class EnumComponent {

  mappedValue : string
  constructor(private host: ElementRef) { }

  @Input()
  sourceMap : string[]
  @Input()
  targetMap : string[]

  @Input()
  set value(v:string) { 
    this.mappedValue = this.targetMap? this.targetMap[this.sourceMap.indexOf(v)] : v
  } 
  
  @Input() set disabled(disable : boolean) { 
    var spanStyle = (this.host.nativeElement as HTMLSpanElement).style
    spanStyle.color = disable? 'darkgray' : 'inherit'}
  
}

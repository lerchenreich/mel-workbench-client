import { AfterViewInit, Directive, ElementRef } from "@angular/core"


@Directive({ selector: '[modalStyle]' })
export class ModalStyleDirective implements AfterViewInit{
  constructor(private host: ElementRef) { }
  
  ngAfterViewInit() {
    var hostElem = this.host.nativeElement as HTMLElement
    const e = $(hostElem).parentsUntil('[role=dialog]')
    e[e.length-1].setAttribute('style',hostElem.getAttribute('modalStyle') as string )
  }
}

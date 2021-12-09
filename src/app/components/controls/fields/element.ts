import { ElementRef } from '@angular/core'

export class MelElement {
  readonly noMargin="0em"
  readonly marginBottom = "0.75em"

  constructor(protected host: ElementRef) {}
    
    protected hasParent(parentTag : string, stopTag? : string) : boolean{
      parentTag = parentTag.toUpperCase()
      if (stopTag) stopTag = stopTag.toUpperCase()
      var parent = (this.host.nativeElement as HTMLElement)
      while (parent.parentElement){
        parent = parent.parentElement
        if(parent.tagName === parentTag)
          return true
        if(stopTag && parent.tagName === stopTag)
          break
      }
      return false
    }
}
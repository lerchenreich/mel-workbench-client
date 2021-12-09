import { Directive, TemplateRef, ElementRef, AfterViewInit } from '@angular/core'
@Directive({ selector: '[cardInput]' })
export class CardInput { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[listInput]' })
export class ListInput { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[listBoolean]' })
export class ListBoolean { constructor(public tpl: TemplateRef<any>) {} }
@Directive({ selector: '[cardBoolean]' })
export class CardBoolean { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[listEnum]' })
export class ListEnum { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[cardEnum]' })
export class CardEnum { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[viewInput]' })
export class ViewInput {  constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[viewBoolean]' })
export class ViewBoolean { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[viewEnum]' })
export class ViewEnum { constructor(public tpl: TemplateRef<any>) {} }

@Directive({ selector: '[focusable]' })
export class FocusableDirective implements AfterViewInit{
  constructor(private host: ElementRef) { }
  ngAfterViewInit() {
      this.host.nativeElement.autocomplete ="off"
      this.host.nativeElement.focus()
  }
}


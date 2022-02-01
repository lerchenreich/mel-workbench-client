import { Directive, TemplateRef } from "@angular/core";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";

@Directive()
export abstract class MelModal<I, R> {
  abstract get returnValue() : R | undefined

  constructor(public modalRef : BsModalRef){
  } 
  
  dismissed : boolean = true
  set dlgData(data : I)  { 
    Object.assign(this, data)
  } 
 
  dismissClicked() {
    this.modalRef.hide()
  }
  okClicked() {
    this.dismissed = false
    this.modalRef.hide()
  }
} 
/**
 * 
 * @param modal    the modalservice from ngx-bootstrap/modal
 * @param content  the content of the dialog component
 * @param options  the modal-options see ngx-bootstrap/modal
 * @returns        a promise<R> to observe 
 * 
 *                 openModal(..).then(returnValue => ...).catch(dismissed => ...)
 * 
 */
 export function openDialog<T extends MelModal<Partial<T>,R>,R>( 
    modal   : BsModalService, 
    content : string | TemplateRef<any> | (new (...args : any[])=>T),                                                
    options : ModalOptions<T> = {} ) : Promise<R> {
  
  var inputData : Partial<T> = {}
  if (options.initialState){
    inputData = Object.assign({}, options.initialState) 
    delete options.initialState
  }
  options.backdrop = 'static'                                                    
  
  var dlgRef = modal.show(content, options)
  if (dlgRef.content){
    dlgRef.content.dlgData = inputData
    return new Promise<R>( (resolve, reject) => {
      dlgRef.onHide?.subscribe({ 
        next : (dc:any) => {
        if (dlgRef.content?.dismissed)
          reject(dlgRef)
        else
          resolve((dlgRef.content as T).returnValue as R)
        }
      })
    })
  }
  throw new Error('openModal - No content !!')
}

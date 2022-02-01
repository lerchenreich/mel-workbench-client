import { Directive, TemplateRef } from "@angular/core"
import { TranslateService } from "@ngx-translate/core"
import { CardData, EntityPage } from "mel-client"
import { EntityLiteral } from "mel-common"
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal"

@Directive()
export abstract class MelModalEntity<E extends EntityLiteral, R> extends EntityPage<E>{
  abstract get returnValue() : R | undefined
  
  constructor(private modalRef : BsModalRef<R>, entityName : string, translate : TranslateService, protected modal : BsModalService){
    super(entityName, translate)
    this.setEditMode()
  } 

  dismissed : boolean = true
  set dlgData(entity : Partial<E>)  { 
    this.cardData = new CardData<E>(this.mapEntity(entity), this.fieldsMdMap)
  } 
  /**
   * method to map values in the entity
   * @param entity the entity to bi mapped
   * @returns 
   */
  protected mapEntity(entity : Partial<E>) : Partial<E>{
    return entity
  }

  dismissClicked() {
    this.modalRef.hide()
  }
  okClicked() {
    this.dismissed = false
    this.modalRef.hide()
  }
  
  cardData? : CardData<E> 
  get isDirty() : boolean { return this.cardData ? this.cardData.isDirty : false }
  get isValid() : boolean { return !!this.cardData?.isValid }

} 


export function openEntityDialog<T extends MelModalEntity<E, R>, E extends EntityLiteral , R>(
                                    modal : BsModalService,
                                    content : string | TemplateRef<any> | (new (...args : any[])=>T),
                                    entity : Partial<E>,                                                
                                    options : ModalOptions<T> = {}) : Promise<R> {
  delete options.initialState
  options.backdrop = 'static'

  var dlgRef = modal.show(content, options)
  if (dlgRef.content) {
    dlgRef.content.dlgData = entity
    return new Promise<R>( (resolve, reject) => {
      dlgRef.onHide?.subscribe({ 
        next : (dc:any) => { 
          if (dlgRef.content?.dismissed)
            reject(dlgRef.content)
          else
            resolve((dlgRef.content as T).returnValue as R)         
        },
      })
    })
  }
  
  throw new Error('openModalWithEntity - No content !!')
}
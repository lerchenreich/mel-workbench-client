
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core'
import { OpenDialogOptions, OpenDialogReturnValue } from 'electron/renderer'
import JSZip from 'jszip';
import { ElectronService } from 'ngx-electron';

import { CreateServerOptions} from 'mel-common/api';
import { FieldTypes } from 'mel-common/types'
import { ClientConfig, CLIENT_CONFIG } from 'src/app/client.configs';
import { fillColumnMetadata } from 'src/app/metadata/entities';
import { notBlank } from 'mel-common/validation';
import { AlertService } from 'src/app/services/alert.service';
import { AppService } from 'src/app/services/app-service';
import { CardData } from '../core/page-data';
import { FieldContext } from '../core/types';
import { BaseInputComponent } from '../controls/fields/base-input';
import { ModalWaitComponent } from '../dialogs/modal-wait/modal-wait.component';
import { FieldMetadata } from '../../types';
class CreateServerEntity {
  name? : string
  version? : string
  description? : string
  targetDir? : string
}

@Component({
  selector: 'app-create-server',
  templateUrl: './create-server.component.html',
  styleUrls: ['./create-server.component.css']
})
@UntilDestroy()
export class CreateServerComponent implements OnInit, AfterViewInit {
  contextMap : Map<keyof CreateServerEntity, FieldContext<CreateServerEntity>>
  metaMap = new Map<keyof CreateServerEntity, FieldMetadata<CreateServerEntity>>()
  
  cardData : CardData<CreateServerEntity>
  
  entity : CreateServerEntity = {
    version : "1.0.0",
    targetDir : "c:\\Projekte\\mel",
    description : "Beschreibung"
  }
  metadata : FieldMetadata<CreateServerEntity>[] = [
    { name : "name", type : FieldTypes.String, validators : [notBlank]},
    { name : "version", type : FieldTypes.String},
    { name : "description", type : FieldTypes.String},
    { name : "targetDir", type : FieldTypes.String, editable:false, validators : [notBlank] }
  ]

  constructor(private modalService : NgbModal, protected appService : AppService,
              private eSvc : ElectronService,
              private router : Router,
              public alert : AlertService, private snackBar : MatSnackBar,
              public translate : TranslateService, @Inject(CLIENT_CONFIG) public config : ClientConfig) {
    this.entity.name = config.appCode

    this.contextMap = new Map<keyof CreateServerEntity, FieldContext<CreateServerEntity>>()
    this.metadata.forEach( md => this.metaMap.set(md.name, fillColumnMetadata(md)) )
    this.cardData = new CardData<CreateServerEntity>(this.entity, this.metaMap)
    this.metadata.forEach( md => this.contextMap.set(md.name, {data : this.cardData, meta : md}))
  }

  ngOnInit(): void {
    try{
      new Blob()
    }
    catch(error){ this.alert.alertWarning("No Blob-support => can't save generated file")}
  }
  context(fieldName : keyof CreateServerEntity) : FieldContext<CreateServerEntity> {
    return this.contextMap.get(fieldName)
  }

  targetDirAssistObs = {
    next : (field : BaseInputComponent)  => {
      const options : OpenDialogOptions = {
        title : this.translate.instant('CreateServer.SelectFolder'),
        defaultPath : field.value,
        properties : ['openDirectory', 'createDirectory', 'promptToCreate']
      }
      this.eSvc.ipcRenderer.invoke('opendialog', options)
      .then( (result : OpenDialogReturnValue) => {
        if (!result.canceled) 
          field.value = result.filePaths[0]
      })
      .catch( error => {})
    }
  }
 
  async save() : Promise<void> {
    var doCreate : boolean = true
    try{
      if (await this.cardData.validate()){
        var targetFolder = this.cardData.validationRec.targetDir
        var projectFolder= [targetFolder, this.cardData.validationRec.name] 
        if (await this.eSvc.ipcRenderer.invoke("fs-exist", projectFolder)){
          var dirEnt = await this.eSvc.ipcRenderer.invoke('fs-dir', 'list', projectFolder) as any[]
          doCreate = dirEnt.length == 0
        }
        else {
          doCreate = true
          await this.eSvc.ipcRenderer.invoke('fs-dir','mk', projectFolder)
        }
        // get the current serverproject
        const options : CreateServerOptions = {
          name : this.cardData.validationRec.name,
          version : this.cardData.validationRec.version,
          description : this.cardData.validationRec.description,
        }
        var modalRef = this.modalService.open(ModalWaitComponent, {centered : true})
        modalRef.componentInstance.title = 'CreateServer.Title'
        modalRef.componentInstance.action = 'CreateServer.WaitFor'
        modalRef.componentInstance.actionContext = options
        this.appService.createServer(options)
        .subscribe( 
          async base64Encoded => {
            var serverZip = await JSZip.loadAsync(base64Encoded, {base64 : true, createFolders : true})
            const projectZipFolder = serverZip.folder(this.cardData.validationRec.name)
            //create the folderstructure
            var subFolders = projectZipFolder.filter( (path , file) => file.dir )
            subFolders.forEach(async folder => {
              const f = [targetFolder, folder.name]
              await this.eSvc.ipcRenderer.invoke('fs-dir','mk', f)
            })
            if (doCreate){
              var files = projectZipFolder.filter( (path , file) => {
                return !file.dir && (file.name.includes('package.json') || 
                                     file.name.includes('tsconfig.json') ||
                                     file.name.endsWith('.vscode/launch.json') ||
                                     file.name.endsWith('.vscode/settings.json')
                                     )
              })
              files.forEach(async file => {
                const data = await file.async('string')
                await this.eSvc.ipcRenderer.invoke('fs-write', [targetFolder, file.name], data, false)
              })
            }
          },
          error => {
            modalRef.close()
            this.translate.get(`CreateServer.Failed`, options)
            .subscribe( translated => this.alert.alertError(error, translated) )
          },
          () => {
            modalRef.close()  
            this.router.navigate(['object-designer'], {}) 
          }
        )
      }
    }
    catch(error){
      this.alert.alertError(error)
    }
  }

  ngAfterViewInit() {
    const htmlCollection = document.getElementsByClassName('mat-card-header-text')
    if (htmlCollection?.length)
      htmlCollection[0].remove()
  }
}

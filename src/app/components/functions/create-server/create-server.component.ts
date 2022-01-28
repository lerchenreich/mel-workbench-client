
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
/*
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core'
import { OpenDialogOptions, OpenDialogReturnValue } from 'electron/renderer'
import JSZip from 'jszip';
import { ElectronService } from 'ngx-electron';

import { EntityLiteral, notBlank , FieldTypes, MelFieldClasses } from 'mel-common'
import { ClientConfig, CLIENT_CONFIG, fillColumnMetadata, AlertService, AppService ,CardData, 
         FieldContext, BaseInputComponent, ModalWaitComponent,  FieldMetadata } from 'mel-client'
import { CreateServerProjectOptions } from 'mel-workbench-api';
import { WorkbenchService } from 'src/app/services/workbench-service';

class CreateServerEntity extends EntityLiteral{
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
  contextMap = new Map<string, FieldContext<CreateServerEntity>>()
  metaMap = new Map<string, FieldMetadata<CreateServerEntity>>()
  
  cardData : CardData<CreateServerEntity>
  
  entity : CreateServerEntity = {
    version : "1.0.0",
    targetDir : "c:\\Projekte\\mel",
    description : "Beschreibung"
  }
  metadata : FieldMetadata<CreateServerEntity>[] = [
    { name : "name",        type : FieldTypes.String, class : MelFieldClasses.None, validators : [notBlank]},
    { name : "version",     type : FieldTypes.String, class : MelFieldClasses.None},
    { name : "description", type : FieldTypes.String, class : MelFieldClasses.None},
    { name : "targetDir",   type : FieldTypes.String, class : MelFieldClasses.None, validators : [notBlank], editable:false, }
  ]

  constructor(private modalDialog : NgbModal, protected workbenchService : WorkbenchService,
              private eSvc : ElectronService,
              private router : Router,
              public alert : AlertService, private snackBar : MatSnackBar,
              public translate : TranslateService, @Inject(CLIENT_CONFIG) public config : ClientConfig) {
    this.entity.name = config.appCode
    this.metadata.forEach( md => this.metaMap.set(md.name as string, fillColumnMetadata(md)) )
    this.cardData = new CardData<CreateServerEntity>(this.entity, this.metaMap)
    this.metadata.forEach( md => this.contextMap.set(md.name as string, {data : this.cardData, meta : md}))
  }

  ngOnInit(): void {
    try{
      new Blob()
    }
    catch(error){ this.alert.alertWarning("No Blob-support => can't save generated file")}
  }
  context(fieldName : string) : FieldContext<CreateServerEntity> {
    const ctx =  this.contextMap.get(fieldName)
    if (ctx) 
      return ctx
    throw new Error(`Context for "${fieldName}" is undefined`)
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
        const vRec = this.cardData.assertVRec
        var targetFolder = vRec.targetDir
        var projectFolder= [targetFolder, vRec.name] 
        if (await this.eSvc.ipcRenderer.invoke("fs-exist", projectFolder)){
          var dirEnt = await this.eSvc.ipcRenderer.invoke('fs-dir', 'list', projectFolder) as any[]
          doCreate = dirEnt.length == 0
        }
        else {
          doCreate = true
          await this.eSvc.ipcRenderer.invoke('fs-dir','mk', projectFolder)
        }
        // get the current serverproject
        const options : CreateServerProjectOptions = {
          name : vRec.name as string,
          version : vRec.version as string,
          keywords : ['server'],
          author: 'a.berger',
          license : 'MIT',
          serverPort : 4711,
          dbConfig : { host : '192.168.0.108', port : 3345, username : 'root', password : '1', database : '' },
          databaseType : 'mysql',
          description : vRec.description as string,
        }
        var modalRef = this.modalDialog.open(ModalWaitComponent, {centered : true})
        modalRef.componentInstance.title = 'CreateServer.Title'
        modalRef.componentInstance.action = 'CreateServer.WaitFor'
        modalRef.componentInstance.actionContext = options
        this.workbenchService.createServerProject(options)
        .subscribe( {
          next : async base64Encoded => {
            var serverZip = await JSZip.loadAsync(base64Encoded, {base64 : true, createFolders : true})
            const projectZipFolder = serverZip.folder(vRec.name as string)
            if (projectZipFolder) { //create the folderstructure
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
            }
          },
          error : error => {
            modalRef.close()
            this.translate.get(`CreateServer.Failed`, options)
            .subscribe( translated => this.alert.alertError(error, translated) )
          },
          complete: () => {
            modalRef.close()  
            this.router.navigate(['object-designer'], {}) 
          }
        }
        )
      }
    }
    catch(error){
      this.alert.alertError(error as string)
    }
  }

  ngAfterViewInit() {
    const htmlCollection = document.getElementsByClassName('mat-card-header-text')
    if (htmlCollection?.length)
      htmlCollection[0].remove()
  }
}
*/

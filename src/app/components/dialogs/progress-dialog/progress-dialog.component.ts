import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

export interface IProgressDialogData {
  title : string
  max? : number
  current?  : number
  type?     : 'success' | 'info' |'warning' | 'danger' |"primary" | "secondary" |"dark" | "light" | "muted" | "white"
  textType? : 'success' | 'info' |'warning' | 'danger' |"primary" | "secondary" |"dark" | "light" | "muted" | "white"
  animate?  : boolean
  striped?  : boolean
  height?   : string
  label?    : string
}
@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.css']
})
export class ProgressDialogComponent implements OnInit {
  //data : IProgressDialogData
  constructor( @Inject(MAT_DIALOG_DATA) public data: IProgressDialogData,
                private translate : TranslateService, 
                public dialogRef: MatDialogRef<ProgressDialogComponent> ) { 
    if (!data.title) data.title = "Dialog"
    if (data.max  == undefined) data.max = 100
    if (data.animate == undefined) data.animate = false
    if (data.current  == undefined) data.current = 0
    if (!data.label) data.label = ''
    if (!data.type) data.type = 'info'
    //if (!data.textType) data.textType = 'info'
    if (data.striped == undefined) data.striped = false  

  }
  cancelButton : boolean = false
  ngOnInit(): void {
  }
  
}

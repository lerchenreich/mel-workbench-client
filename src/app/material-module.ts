
// kopie von mel-client

import { NgModule } from '@angular/core';
import { MatNativeDateModule, NativeDateModule } from '@angular/material/core';
import { MatButtonModule }          from '@angular/material/button'
import { MatButtonToggleModule }    from '@angular/material/button-toggle'
import { MatCheckboxModule }        from '@angular/material/checkbox'
import { MatMomentDateModule}       from '@angular/material-moment-adapter'
import { MatDatepickerModule }      from '@angular/material/datepicker'
import { MatInputModule }           from '@angular/material/input'
import { MatMenuModule }            from '@angular/material/menu'
import { MatToolbarModule }         from '@angular/material/toolbar'
import { MatTooltipModule }         from '@angular/material/tooltip'
import { MatCardModule }            from '@angular/material/card'
import { MatDialogModule }          from '@angular/material/dialog'
import { MatListModule }            from '@angular/material/list'
import { MatSelectModule }          from '@angular/material/select'
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatIconModule }            from '@angular/material/icon'
import { MatPaginatorModule }       from '@angular/material/paginator'
import { MatProgressBarModule }     from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule }           from '@angular/material/radio'
import { MatSnackBarModule }        from '@angular/material/snack-bar'
import { MatTableModule }           from '@angular/material/table'
import { MatSortModule }            from '@angular/material/sort'
import { MatExpansionModule }       from '@angular/material/expansion'
import { MatTabsModule }            from '@angular/material/tabs'

@NgModule({
  exports: [
  
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,NativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatTabsModule
  ]
})
export class MaterialModule {}
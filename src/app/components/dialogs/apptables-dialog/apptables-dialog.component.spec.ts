import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTablesDialogComponent } from './apptables-dialog.component';

describe('DbTablesDialogComponentComponent', () => {
  let component: AppTablesDialogComponent;
  let fixture: ComponentFixture<AppTablesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppTablesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTablesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

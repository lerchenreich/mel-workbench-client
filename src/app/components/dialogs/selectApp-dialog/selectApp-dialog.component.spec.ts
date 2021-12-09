import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAppDialogComponent } from './selectApp-dialog.component';

describe('SelectAppDialogComponent', () => {
  let component: SelectAppDialogComponent;
  let fixture: ComponentFixture<SelectAppDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectAppDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAppDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

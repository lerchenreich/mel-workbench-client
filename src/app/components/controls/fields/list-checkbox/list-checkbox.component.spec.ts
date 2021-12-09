import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCheckboxComponent } from './list-checkbox.component';

describe('CheckboxComponent', () => {
  let component: ListCheckboxComponent;
  let fixture: ComponentFixture<ListCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListCheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFieldComponent } from './listfield.component';

describe('MelTdComponent', () => {
  let component: ListFieldComponent;
  let fixture: ComponentFixture<ListFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

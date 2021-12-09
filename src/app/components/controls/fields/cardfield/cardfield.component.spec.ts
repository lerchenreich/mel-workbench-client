import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardfieldComponent } from './cardfield.component';

describe('CardfieldComponent', () => {
  let component: CardfieldComponent;
  let fixture: ComponentFixture<CardfieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardfieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardfieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCheckboxComponent } from './card-checkbox.component';

describe('CardCheckboxComponent', () => {
  let component: CardCheckboxComponent;
  let fixture: ComponentFixture<CardCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardCheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

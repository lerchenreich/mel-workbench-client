import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWaitComponent } from './modal-wait.component';

describe('ModalWaitComponent', () => {
  let component: ModalWaitComponent;
  let fixture: ComponentFixture<ModalWaitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalWaitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalWaitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

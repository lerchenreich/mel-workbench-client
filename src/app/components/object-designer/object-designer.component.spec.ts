import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectDesignerComponent } from './object-designer.component';

describe('ObjectDesignerComponent', () => {
  let component: ObjectDesignerComponent;
  let fixture: ComponentFixture<ObjectDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectDesignerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

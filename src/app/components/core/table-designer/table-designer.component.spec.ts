import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDesignerComponent } from './table-designer.component';

describe('TableDesignerComponent', () => {
  let component: TableDesignerComponent;
  let fixture: ComponentFixture<TableDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableDesignerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

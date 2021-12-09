import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MelTableListComponent } from './meltable-list.component';

describe('TableListComponent', () => {
  let component: MelTableListComponent;
  let fixture: ComponentFixture<MelTableListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MelTableListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MelTableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

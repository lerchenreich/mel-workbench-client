import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MelTableCardComponent } from './meltable-card.component';

describe('MeltableDardComponent', () => {
  let component: MelTableCardComponent;
  let fixture: ComponentFixture<MelTableCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MelTableCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MelTableCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

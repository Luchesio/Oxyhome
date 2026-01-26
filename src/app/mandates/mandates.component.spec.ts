import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandatesComponent } from './mandates.component';

describe('MandatesComponent', () => {
  let component: MandatesComponent;
  let fixture: ComponentFixture<MandatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MandatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MandatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

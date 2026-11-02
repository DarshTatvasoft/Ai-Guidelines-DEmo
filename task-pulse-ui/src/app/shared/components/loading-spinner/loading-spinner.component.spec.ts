import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create spinner with role="status"', () => {
    const container = fixture.nativeElement.querySelector('.spinner-container');
    expect(container.getAttribute('role')).toBe('status');
    expect(container.getAttribute('aria-live')).toBe('polite');
  });

  it('should render message when provided', () => {
    fixture.componentRef.setInput('message', 'Loading board data...');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.spinner__label');
    expect(label.textContent.trim()).toBe('Loading board data...');
  });

  it('should apply size and color modifier classes', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('color', 'white');
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner.classList).toContain('spinner--lg');
    expect(spinner.classList).toContain('spinner--white');
  });
});


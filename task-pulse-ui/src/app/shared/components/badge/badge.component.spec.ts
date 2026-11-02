import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create badge with default settings', () => {
    expect(component).toBeTruthy();
    const element = fixture.nativeElement.querySelector('.badge');
    expect(element.classList).toContain('badge--default');
    expect(element.classList).toContain('badge--md');
    expect(element.getAttribute('role')).toBe('status');
  });

  it('should apply priority variants correctly', () => {
    fixture.componentRef.setInput('variant', 'priority-urgent');
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('.badge');
    expect(element.classList).toContain('badge--priority-urgent');
  });

  it('should render dot indicator when dot input is true', () => {
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();

    const dot = fixture.nativeElement.querySelector('.badge__dot');
    expect(dot).toBeTruthy();
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('should calculate custom colors when colorHex is provided', () => {
    fixture.componentRef.setInput('colorHex', '#6366F1');
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement.querySelector('.badge');
    expect(element.style.color).toBe('rgb(99, 102, 241)');
  });
});


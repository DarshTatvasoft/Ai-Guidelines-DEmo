import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render default title and role region', () => {
    const titleEl = fixture.nativeElement.querySelector('.empty-state__title');
    expect(titleEl.textContent.trim()).toBe('No items found');
    const region = fixture.nativeElement.querySelector('.empty-state');
    expect(region.getAttribute('role')).toBe('region');
  });

  it('should render description when provided', () => {
    fixture.componentRef.setInput('description', 'Try adjusting your search criteria.');
    fixture.detectChanges();

    const descEl = fixture.nativeElement.querySelector('.empty-state__desc');
    expect(descEl.textContent.trim()).toBe('Try adjusting your search criteria.');
  });

  it('should render action button and emit action event', () => {
    fixture.componentRef.setInput('actionText', 'Create New Task');
    fixture.detectChanges();

    let emitted = false;
    component.action.subscribe(() => (emitted = true));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn--primary');
    expect(btn.textContent.trim()).toBe('Create New Task');

    btn.click();
    expect(emitted).toBeTrue();
  });
});


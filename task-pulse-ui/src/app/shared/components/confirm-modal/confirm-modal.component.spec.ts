import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not render dialog when isOpen is false', () => {
    const dialog = fixture.nativeElement.querySelector('.modal-dialog');
    expect(dialog).toBeNull();
  });

  it('should render dialog with ARIA attributes when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Delete Task');
    fixture.componentRef.setInput('message', 'Confirm permanent deletion');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.modal-dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const titleEl = fixture.nativeElement.querySelector('.modal-dialog__title');
    expect(titleEl.textContent.trim()).toBe('Delete Task');
  });

  it('should emit confirm event when confirm button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let confirmed = false;
    component.confirm.subscribe(() => (confirmed = true));

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn--primary');
    confirmBtn.click();

    expect(confirmed).toBeTrue();
  });

  it('should emit cancel event when cancel or close button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let cancelled = false;
    component.cancel.subscribe(() => (cancelled = true));

    const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn--secondary');
    cancelBtn.click();

    expect(cancelled).toBeTrue();
  });

  it('should emit cancel event on Escape key press', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let cancelled = false;
    component.cancel.subscribe(() => (cancelled = true));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(cancelled).toBeTrue();
  });
});


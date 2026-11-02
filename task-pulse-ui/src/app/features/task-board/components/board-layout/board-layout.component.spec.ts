import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardLayoutComponent } from './board-layout.component';
import { User } from '../../models';

describe('BoardLayoutComponent', () => {
  let component: BoardLayoutComponent;
  let fixture: ComponentFixture<BoardLayoutComponent>;

  const mockUser: User = {
    id: 'u-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardLayoutComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', mockUser);
    fixture.detectChanges();
  });

  it('should render brand logo and user details', () => {
    const brand = fixture.nativeElement.querySelector('.brand-name');
    expect(brand.textContent.trim()).toBe('TaskPulse');

    const userName = fixture.nativeElement.querySelector('.user-name');
    expect(userName.textContent.trim()).toBe('Jane Doe');
  });

  it('should emit logout event when logout button is clicked', () => {
    let loggedOut = false;
    component.logout.subscribe(() => (loggedOut = true));

    const logoutBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.logout-btn');
    logoutBtn.click();

    expect(loggedOut).toBeTrue();
  });

  it('should toggle mobile menu open on hamburger click and close on close button', () => {
    const hamburger: HTMLButtonElement = fixture.nativeElement.querySelector('.hamburger-btn');
    expect(hamburger).toBeTruthy();

    hamburger.click();
    fixture.detectChanges();

    expect((component as any).mobileMenuOpen()).toBeTrue();
    const sidebar = fixture.nativeElement.querySelector('.layout-sidebar');
    expect(sidebar.classList.contains('layout-sidebar--open')).toBeTrue();
    expect(sidebar.getAttribute('aria-expanded')).toBe('true');

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-close-btn');
    closeBtn.click();
    fixture.detectChanges();

    expect((component as any).mobileMenuOpen()).toBeFalse();
  });

  it('should close mobile menu on Escape key press', () => {
    (component as any).mobileMenuOpen.set(true);
    fixture.detectChanges();
    expect((component as any).mobileMenuOpen()).toBeTrue();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);
    (component as any).onEscape();
    fixture.detectChanges();

    expect((component as any).mobileMenuOpen()).toBeFalse();
  });
});


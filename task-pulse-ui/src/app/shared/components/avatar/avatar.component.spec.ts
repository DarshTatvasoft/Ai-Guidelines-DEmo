import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render initials when image src is absent', () => {
    fixture.componentRef.setInput('name', 'Sarah Connor');
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.avatar__initials');
    expect(initials.textContent.trim()).toBe('SC');
  });

  it('should compute single-word initials correctly', () => {
    fixture.componentRef.setInput('name', 'Admin');
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.avatar__initials');
    expect(initials.textContent.trim()).toBe('AD');
  });

  it('should render image when src is provided', () => {
    fixture.componentRef.setInput('src', 'https://example.com/avatar.jpg');
    fixture.componentRef.setInput('name', 'Sarah Connor');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.avatar__img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('should fall back to initials if image fails to load', () => {
    fixture.componentRef.setInput('src', 'https://example.com/broken.jpg');
    fixture.componentRef.setInput('name', 'Sarah Connor');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.avatar__img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.avatar__initials');
    expect(initials).toBeTruthy();
    expect(initials.textContent.trim()).toBe('SC');
  });

  it('should set accessible aria-label on avatar container', () => {
    fixture.componentRef.setInput('name', 'Sarah Connor');
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('.avatar');
    expect(avatar.getAttribute('aria-label')).toBe('Sarah Connor');
    expect(avatar.getAttribute('role')).toBe('img');
  });
});


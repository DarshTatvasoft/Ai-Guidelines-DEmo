import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LandingPageComponent } from './landing-page.component';
import { AuthStateService } from '../../../../core/services';
import { User } from '../../../../core/models';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let authStateServiceMock: {
    isAuthenticated: any;
    currentUser: any;
  };

  const mockUser: User = {
    id: 'u-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
  };

  beforeEach(async () => {
    authStateServiceMock = {
      isAuthenticated: signal(false),
      currentUser: signal<User | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: authStateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the landing page component', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand name and hero headline', () => {
    const brandEl = fixture.nativeElement.querySelector('.brand-name');
    expect(brandEl.textContent).toContain('TaskPulse');

    const heroTitleEl = fixture.nativeElement.querySelector('.hero-title');
    expect(heroTitleEl.textContent).toContain('Enterprise Task Management');
  });

  it('should display Get Started and Sign In CTAs when unauthenticated', () => {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const registerLinks = links.filter((l) => l.getAttribute('href')?.includes('/register') || l.textContent?.includes('Get Started'));
    const loginLinks = links.filter((l) => l.getAttribute('href')?.includes('/login') || l.textContent?.includes('Sign In'));

    expect(registerLinks.length).toBeGreaterThan(0);
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('should display Open Board / Launch Kanban Board CTA when authenticated', () => {
    authStateServiceMock.isAuthenticated.set(true);
    authStateServiceMock.currentUser.set(mockUser);
    fixture.detectChanges();

    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const boardLinks = links.filter((l) => l.getAttribute('href')?.includes('/boards') || l.textContent?.includes('Open Board') || l.textContent?.includes('Launch Kanban'));

    expect(boardLinks.length).toBeGreaterThan(0);
  });

  it('should render all 4 core feature cards', () => {
    const featureCards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);

    const featureTitles = Array.from(featureCards).map((c: any) =>
      c.querySelector('.feature-title')?.textContent?.trim()
    );

    expect(featureTitles).toContain('Angular Signals Reactive State');
    expect(featureTitles).toContain('.NET 8 Clean Architecture');
    expect(featureTitles).toContain('Figma & Jira MCP Integration');
    expect(featureTitles).toContain('Enterprise Security & Accessibility');
  });

  it('should render tech stack pills', () => {
    const pills = fixture.nativeElement.querySelectorAll('.stack-pill');
    expect(pills.length).toBe(8);

    const pillTexts = Array.from(pills).map((p: any) => p.textContent.trim());
    expect(pillTexts).toContain('Angular 22');
    expect(pillTexts).toContain('.NET 8 Web API');
  });

  it('should include ARIA landmark roles banner, main, and contentinfo', () => {
    const banner = fixture.nativeElement.querySelector('[role="banner"]');
    const main = fixture.nativeElement.querySelector('[role="main"]');
    const footer = fixture.nativeElement.querySelector('[role="contentinfo"]');

    expect(banner).toBeTruthy();
    expect(main).toBeTruthy();
    expect(footer).toBeTruthy();
  });
});


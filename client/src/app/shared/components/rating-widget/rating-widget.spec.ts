import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingWidgetComponent } from './rating-widget.component';

describe('RatingWidgetComponent', () => {
  let fixture: ComponentFixture<RatingWidgetComponent>;
  let component: RatingWidgetComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingWidgetComponent);
    component = fixture.componentInstance;
  });

  it('renders 5 stars', () => {
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelectorAll('span.relative');
    expect(stars.length).toBe(5);
  });

  it('shows full stars based on rating', () => {
    component.rating = 3;
    fixture.detectChanges();
    
    const filledStars = Array.from(fixture.nativeElement.querySelectorAll('span.absolute')) as HTMLElement[];
    expect(filledStars[0].style.width).toBe('100%');
    expect(filledStars[1].style.width).toBe('100%');
    expect(filledStars[2].style.width).toBe('100%');
    expect(filledStars[3].style.width).toBe('0%');
  });

  it('supports half stars in readonly mode', () => {
    component.rating = 3.5;
    component.readonly = true;
    fixture.detectChanges();
    
    const filledStars = Array.from(fixture.nativeElement.querySelectorAll('span.absolute')) as HTMLElement[];
    expect(filledStars[3].style.width).toBe('50%');
  });

  it('emits rate event on click in interactive mode', () => {
    component.readonly = false;
    const rateSpy = vi.fn();
    component.rate.subscribe(rateSpy);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[3].click(); // 4th star

    expect(rateSpy).toHaveBeenCalledWith(4);
  });

  it('does not emit rate event in readonly mode', () => {
    component.readonly = true;
    const rateSpy = vi.fn();
    component.rate.subscribe(rateSpy);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[3].click();

    expect(rateSpy).not.toHaveBeenCalled();
  });

  it('changes fill on hover in interactive mode', () => {
    component.readonly = false;
    component.rating = 1;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[4].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    const filledStars = Array.from(fixture.nativeElement.querySelectorAll('span.absolute')) as HTMLElement[];
    expect(filledStars[4].style.width).toBe('100%');
  });
});

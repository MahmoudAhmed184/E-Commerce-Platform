import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogComponent } from './dialog.component';

describe('dialog.component', () => {
  let fixture: ComponentFixture<DialogHostComponent>;

  afterEach(() => {
    fixture?.destroy();
  });

  it('exports a module surface', () => {
    expect(DialogComponent).toBeTruthy();
  });

  it('moves its host to the document body so it can escape local stacking contexts', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogHost = document.body.querySelector('app-dialog');
    const localDialogHost = (fixture.nativeElement as HTMLElement).querySelector('app-dialog');

    expect(dialogHost).toBeTruthy();
    expect(localDialogHost).toBeNull();
  });
});

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [DialogComponent],
  template: `
    <div class="relative">
      <app-dialog [open]="open()" title="Image preview">Preview content</app-dialog>
    </div>
  `,
})
class DialogHostComponent {
  protected readonly open = signal(true);
}

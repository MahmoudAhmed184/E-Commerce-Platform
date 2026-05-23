import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { fileInputFromEvent, uniqueId } from '../component-utils';

export interface UploadFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  error?: string;
}

interface UploadErrorItem {
  id: string;
  message: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section class="grid gap-md">
      <label class="glass-panel glass-depth-raised grid cursor-pointer gap-xs rounded-md border-dashed p-lg text-center interactive-transition hover:shadow-glass-floating focus-within:border-border-focus focus-within:focus-ring">
        <span class="type-label-md text-text-primary">{{ label() }}</span>
        <span class="type-body-sm text-text-muted">{{ helperText() }}</span>
        <input class="sr-only" type="file" [id]="inputId" [attr.accept]="accept()" [multiple]="multiple()" (change)="handleFiles($event)" />
      </label>

      @if (errors().length) {
        <div class="grid gap-2xs" role="alert">
          @for (error of errorItems(); track error.id) {
            <p class="type-body-sm text-text-error">{{ error.message }}</p>
          }
        </div>
      }

      <div class="grid gap-sm md:grid-cols-2">
        @for (item of files(); track item.id) {
          <article class="glass-panel glass-depth-raised grid gap-xs rounded-md p-sm">
            @if (item.previewUrl) {
              <img class="aspect-square w-full rounded-sm object-cover" [src]="item.previewUrl" [alt]="item.file.name" />
            }
            <div class="flex items-start justify-between gap-sm">
              <div class="min-w-0">
                <p class="truncate type-label-md text-text-primary">{{ item.file.name }}</p>
                <p class="type-body-sm text-text-muted">{{ item.file.size }} bytes</p>
              </div>
              <button class="inline-flex size-control-sm items-center justify-center rounded-full text-icon-default interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring" type="button" [attr.aria-label]="'Remove ' + item.file.name" (click)="remove(item.id)">
                <span aria-hidden="true">x</span>
              </button>
            </div>
            @if (item.error) {
              <p class="type-body-sm text-text-error">{{ item.error }}</p>
            }
            <label class="flex min-h-touch-min items-center gap-xs type-label-sm text-text-primary">
              <input class="size-icon-md accent-iridescent-cyan focus-visible:focus-ring" type="radio" name="primary-upload" [checked]="item.id === primaryId()" (change)="primaryChanged.emit(item.id)" />
              Primary image
            </label>
          </article>
        } @empty {
          <p class="type-body-sm text-text-muted">No files selected.</p>
        }
      </div>
    </section>
  `,
})
export class FileUploadComponent {
  readonly accept = input('image/*');
  readonly multiple = input(true);
  readonly maxFiles = input(8);
  readonly maxSize = input(5_000_000);
  readonly files = input<readonly UploadFileItem[]>([]);
  readonly primaryId = input<string | null>(null);
  readonly label = input('Upload images');

  readonly filesChange = output<readonly UploadFileItem[]>();
  readonly primaryChanged = output<string>();
  readonly rejected = output<readonly string[]>();

  protected readonly inputId = uniqueId('file-upload');
  protected readonly errors = signal<readonly string[]>([]);
  protected readonly errorItems = computed<readonly UploadErrorItem[]>(() =>
    this.errors().map((message, index) => ({ id: `${index}-${message}`, message })),
  );
  protected readonly helperText = computed(() => `Accepted files: ${this.accept()}. Maximum ${this.maxFiles()} files.`);

  protected handleFiles(event: Event): void {
    const input = fileInputFromEvent(event);
    if (!input) {
      return;
    }

    const { files, errors } = buildUploadSelection({
      currentFiles: this.files(),
      selectedFiles: Array.from(input.files ?? []),
      maxFiles: this.maxFiles(),
      maxSize: this.maxSize(),
    });

    this.errors.set(errors);
    if (errors.length) {
      this.rejected.emit(errors);
    }
    this.filesChange.emit(files);
    input.value = '';
  }

  protected remove(id: string): void {
    this.filesChange.emit(this.files().filter((item) => item.id !== id));
  }
}

interface UploadSelectionInput {
  currentFiles: readonly UploadFileItem[];
  selectedFiles: readonly File[];
  maxFiles: number;
  maxSize: number;
}

interface UploadSelectionResult {
  files: readonly UploadFileItem[];
  errors: readonly string[];
}

function buildUploadSelection(input: UploadSelectionInput): UploadSelectionResult {
  const errors: string[] = [];
  const files = [...input.currentFiles];

  for (const file of input.selectedFiles) {
    if (files.length >= input.maxFiles) {
      errors.push(`Maximum ${input.maxFiles} files allowed.`);
      break;
    }

    if (file.size > input.maxSize) {
      errors.push(`${file.name} is too large.`);
      continue;
    }

    files.push(toUploadFileItem(file));
  }

  return { files, errors };
}

function toUploadFileItem(file: File): UploadFileItem {
  const item: UploadFileItem = {
    id: `${file.name}-${file.lastModified}`,
    file,
  };

  if (file.type.startsWith('image/')) {
    item.previewUrl = URL.createObjectURL(file);
  }

  return item;
}

export type UiSize = 'sm' | 'md' | 'lg';
export type UiTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
export type UiActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface UiAction {
  label: string;
  ariaLabel?: string;
  href?: string;
  routerLink?: string | readonly unknown[];
  disabled?: boolean;
  loading?: boolean;
  variant?: UiActionVariant;
}

export interface UiOption<T extends string | number = string> {
  label: string;
  value: T;
  disabled?: boolean;
  helper?: string;
}

export interface UiMenuItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface UiMenuGroup {
  label?: string;
  items: readonly UiMenuItem[];
}

export interface UiTableColumn {
  id: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface UiSortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface UiStepperStep {
  id: string;
  label: string;
  href?: string;
  status?: 'completed' | 'current' | 'upcoming' | 'error' | 'loading';
}

export interface UiGalleryImage {
  id: string;
  src: string;
  alt: string;
  thumbnailSrc?: string;
}

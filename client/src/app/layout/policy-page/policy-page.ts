import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type PolicyKey = 'returns' | 'privacy' | 'terms';

interface PolicyContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly {
    title: string;
    body: string;
  }[];
}

const POLICY_CONTENT: Record<PolicyKey, PolicyContent> = {
  returns: {
    eyebrow: 'Customer care',
    title: 'Returns',
    intro: 'Return windows, eligibility, and refund timing are shown before support confirms a return.',
    sections: [
      { title: 'Return window', body: 'Most unused items can be reviewed for return within 30 days of delivery.' },
      { title: 'Item condition', body: 'Products should include original packaging, accessories, and proof of purchase.' },
      { title: 'Refund timing', body: 'Approved refunds are processed back to the original payment method after inspection.' },
    ],
  },
  privacy: {
    eyebrow: 'Account',
    title: 'Privacy',
    intro: 'Vendra uses customer information to operate checkout, delivery, order support, and account security.',
    sections: [
      { title: 'Data use', body: 'Contact, address, cart, and payment status details are used to complete orders and support customers.' },
      { title: 'Account access', body: 'Customers can review saved profile details and order history after signing in.' },
      { title: 'Support', body: 'Support requests may use order and delivery details to resolve issues.' },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms',
    intro: 'These terms summarize expected shopping, checkout, payment, and account behavior in Vendra.',
    sections: [
      { title: 'Orders', body: 'Orders depend on product availability, valid delivery information, and payment confirmation.' },
      { title: 'Accounts', body: 'Customers are responsible for keeping account access and contact details current.' },
      { title: 'Catalog', body: 'Prices, descriptions, inventory, and promotions can change as the catalog is updated.' },
    ],
  },
};

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <section class="mx-auto grid max-w-[var(--ui-container-lg)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="grid gap-xs">
          <p class="type-label-sm text-text-muted">{{ content.eyebrow }}</p>
          <h1 class="type-heading-xl text-text-primary">{{ content.title }}</h1>
          <p class="max-w-[42rem] type-body-md text-text-secondary">{{ content.intro }}</p>
        </header>

        <div class="surface-panel surface-depth-raised grid gap-md rounded-md p-lg">
          @for (section of content.sections; track section.title) {
            <section class="grid gap-2xs">
              <h2 class="type-heading-sm text-text-primary">{{ section.title }}</h2>
              <p class="type-body-md text-text-secondary">{{ section.body }}</p>
            </section>
          }
        </div>

        <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">Continue shopping</a>
      </section>
    </main>
  `,
})
export class PolicyPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly content = POLICY_CONTENT[policyKeyFromRoute(this.route.snapshot.data['policy'])];
}

function policyKeyFromRoute(value: unknown): PolicyKey {
  return value === 'privacy' || value === 'terms' || value === 'returns' ? value : 'returns';
}

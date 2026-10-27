# SpreadNotes product theme

SpreadNotes uses **Warm Paper** by default and offers **Ink & Plum** as a saved dark-mode preference. The public site, demo request, sign-in, onboarding, staging workspace, and app workspace use the same semantic palette. Shared colors and control tokens live in `app/globals.css`; `features/shell/product-theme.css` applies surface-specific layouts and component details.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--app-background` | `#F6F5F3` | `#17151D` | Page background |
| `--app-surface` | `#FFFFFF` | `#221F29` | Cards, sidebar, top bar |
| `--app-surface-subtle` | `#F1EFF1` | `#2C2833` | Secondary surfaces |
| `--app-field` | `#FBFAFC` | `#1C1922` | Inputs and text areas |
| `--app-text` | `#252131` | `#F5F1F7` | Primary text |
| `--app-text-secondary` | `#4D4655` | `#DDD5E2` | Supporting text |
| `--app-text-muted` | `#625B6A` | `#B9AFBF` | Labels and hints |
| `--app-border` | `#DED8E1` | `#453E4B` | Dividers and control edges |
| `--app-accent` | `#654484` | `#B893DF` | Primary action, focus, selection |
| `--app-accent-hover` | `#51326D` | `#CBA5EA` | Hovered primary action |
| `--app-accent-soft` | `#F2EDF6` | `#33283F` | Selected navigation and chips |
| `--app-accent-foreground` | `#FFFFFF` | `#17151D` | Text on the accent |
| `--app-success` | `#227351` | `#67C9A0` | Connected and completed states |
| `--app-success-soft` | `#E6F5EC` | `#193D31` | Success background |
| `--app-danger` | `#A43745` | `#FF9DAA` | Errors |
| `--app-danger-soft` | `#FCECEF` | `#492830` | Error background |
| `--app-warning` | `#875E19` | `#E3BC77` | Attention states |
| `--app-warning-soft` | `#FCF3E1` | `#3F3220` | Attention background |
| `--app-gold` | `#9B6B28` | `#E3BC77` | Small brand details |

Cards use a 12px radius; controls use 8px. Body text uses DM Sans, while prominent headings and the brand use Newsreader across the public and product screens. Light mode starts independently of device preference. The theme switcher saves the choice in local storage and a shared cookie for `spreadnotes.app` subdomains when available. Local `localhost` hosts may retain their own preference because browsers can reject cross-subdomain cookies there; workspace data still resets on reload.

## Rollout checklist

- [x] Share one palette across public, request-demo, sign-in, onboarding, staging, and app surfaces.
- [x] Apply the palette through shared tokens to workspace navigation, cards, forms, previews, calendar, AI, ads, analytics, and Creator Hub.
- [x] Use a neutral canvas, lighter visual weight, clear fields, and restrained purple accents.
- [x] Start in light mode and persist manual dark-mode selection.
- [x] Review Create post and SpreadNotes AI at desktop and narrow mobile widths in both modes; confirm no horizontal overflow in the mobile view.

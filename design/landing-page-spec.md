# Landing Page Design Specification

## Color Palette

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A0F` | Page background |
| `--bg-secondary` | `#12121A` | Alternating section backgrounds |
| `--bg-card` | `#16161F` | Card backgrounds |
| `--bg-card-hover` | `#1C1C28` | Card hover state |
| `--bg-code` | `#0D0D14` | Code block backgrounds |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F0F0F5` | Headings, primary body text |
| `--text-secondary` | `#9494A8` | Descriptions, secondary content |
| `--text-muted` | `#5C5C72` | Tertiary content, code comments |

### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#7C5CFC` | Primary brand (purple), buttons, links |
| `--accent-primary-light` | `#9B7FFF` | Hover states, highlights |
| `--accent-secondary` | `#22D3EE` | Secondary accent (cyan), reporting pipeline |
| `--accent-tertiary` | `#34D399` | Tertiary accent (green), CLI surface, terminal prompts |
| `--accent-warning` | `#FBBF24` | Warning/gold, sponsor pipeline |
| `--accent-rose` | `#F472B6` | Rose accent, skillkit features |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `#1E1E2A` | Section dividers, nav border |
| `--border-card` | `#24243A` | Card borders |

### Gradients
| Token | Value | Usage |
|-------|-------|-------|
| `--gradient-hero` | `135deg: #7C5CFC -> #22D3EE -> #34D399` | Hero text, logo, primary accent gradient |
| `--gradient-card-border` | `135deg: rgba(124,92,252,0.3) -> rgba(34,211,238,0.1)` | Hover card borders |

---

## Typography

### Font Families
| Token | Font Stack | Usage |
|-------|-----------|-------|
| `--font-sans` | `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif` | All body text, headings, UI elements |
| `--font-mono` | `JetBrains Mono, Fira Code, monospace` | Code blocks, terminal, skill chips, output types |

### Type Scale
| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|----------------|-------------|
| Hero H1 | 72px | 800 | -0.04em | 1.05 |
| Section H2 | 44px | 800 | -0.03em | 1.15 |
| Card H3 | 17-22px | 700 | -0.01em | default |
| Tagline | 22px | 500 | -0.01em | default |
| Subtitle | 17px | 400 | default | 1.7 |
| Body | 14-15px | 400-500 | default | 1.6 |
| Overline | 13px | 600 | 0.1em (uppercase) | default |
| Code | 13.5-14px | 400-500 | default | 1.8-2.0 |
| Badge/Chip | 12-13px | 500-600 | default | default |

---

## Component Breakdown

### 1. Navigation (fixed)
- Fixed top bar with backdrop blur (`rgba(10,10,15,0.85)`, `blur(20px)`)
- Logo mark: 32x32 rounded square with gradient background
- Center nav links: Architecture, Pipelines, Features, Get Started
- Right CTA: GitHub (secondary), Read the Docs (primary)
- Bottom border: `--border-subtle`

### 2. Hero Section
- Full viewport height, centered content
- Animated radial gradient background glow (subtle, 12s cycle)
- Status badge: green dot + "Open Source - agentskills.io Standard"
- Project name in gradient text (72px, 800 weight)
- Tagline and subtitle below
- Two CTA buttons: "View on GitHub" (primary) | "Read the Docs" (secondary)
- Terminal window visual showing a pipeline command execution
- Terminal has macOS window chrome (red/yellow/green dots)

### 3. Architecture Section
- Three-column grid: Surface cards | Connector | Skill Library
- Surface cards: Claude Code (purple), Slack (cyan), CLI (green)
- Each card has colored icon, title, description
- Center connector: vertical lines with animated node
- Right panel: Skill library with chip-style skill names

### 4. Pipelines Section
- Three equal-width pipeline cards
- Each card has colored top border (3px gradient)
- Content Pipeline (purple): Research -> Analysis -> Brief
- Sponsor Pipeline (gold/rose): Analytics -> Proposals -> HubSpot CRM
- Reporting Pipeline (cyan/green): Analytics -> Reports -> Delivery
- Flow steps with dots, arrows, and typed output labels

### 5. Features Grid
- 3x2 grid of feature cards
- Each card: colored icon (48x48), title, description
- Colors rotate through the accent palette
- Hover: border highlight, slight lift, background shift

### 6. Getting Started Section
- Two-column layout: steps (left) + code block (right)
- Three numbered steps with titles and descriptions
- Code block: terminal window with syntax-highlighted commands
- Shows clone, plugin load, pipeline run, and skillkit usage

### 7. Tech Stack Section
- Centered row of badge pills
- Each badge: icon + label
- Technologies: TypeScript, Agent SDK, Slack Bolt, Zod, HubSpot, agentskills.io

### 8. Footer
- Single row: brand attribution (left) + links (right)
- "Built by Levi -- Applied AI Engineering Portfolio"
- Links: MIT License | GitHub | Docs
- Separated by vertical dividers

---

## Responsive Behavior

### Desktop (> 1024px)
- Full three-column architecture layout
- Three-column pipeline grid
- Three-column feature grid
- Two-column getting started layout
- Navigation with all links visible
- Hero H1 at 72px

### Tablet (768px - 1024px)
- Architecture: stacked single column, connector becomes horizontal
- Pipelines: single column, full-width cards
- Features: 2-column grid
- Getting started: single column (steps above code)
- Hero H1 at 56px
- Section H2 at 36px

### Mobile (< 768px)
- Section gap reduced to 80px
- Navigation: links hidden, CTAs only
- Hero: H1 at 40px, tagline at 18px, buttons stack vertically
- Features: single column
- Footer: stacked centered layout
- Tech badges: smaller padding, reduced gap
- Container padding: 16px (below 480px)

### Small Mobile (< 480px)
- Hero H1 at 32px
- Container padding: 16px

---

## Design Tokens for Reuse

```css
:root {
  /* Colors */
  --bg-primary: #0A0A0F;
  --bg-secondary: #12121A;
  --bg-card: #16161F;
  --bg-card-hover: #1C1C28;
  --bg-code: #0D0D14;
  --text-primary: #F0F0F5;
  --text-secondary: #9494A8;
  --text-muted: #5C5C72;
  --accent-primary: #7C5CFC;
  --accent-primary-light: #9B7FFF;
  --accent-secondary: #22D3EE;
  --accent-tertiary: #34D399;
  --accent-warning: #FBBF24;
  --accent-rose: #F472B6;
  --border-subtle: #1E1E2A;
  --border-card: #24243A;

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #7C5CFC 0%, #22D3EE 50%, #34D399 100%);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --section-gap: 120px;
  --card-radius: 16px;
  --btn-radius: 10px;
}
```

---

## Interaction Notes

- **Card hover**: `translateY(-2px to -4px)` lift with border color shift to `--accent-primary`
- **Button hover**: `translateY(-1px)` with box-shadow (`0 8px 24px rgba(124,92,252,0.3)`)
- **Architecture connector node**: Pulsing box-shadow animation (3s cycle)
- **Hero background**: Slow radial gradient drift animation (12s cycle)
- **Hero badge dot**: Pulse opacity animation (2s cycle)
- **Smooth scroll**: `scroll-behavior: smooth` on html
- **Transitions**: All interactive elements use `0.2s-0.3s ease` transitions

---

## Accessibility Notes

- All SVG icons use semantic stroke colors matching their context
- Text contrast ratios meet WCAG AA against dark backgrounds
- Interactive elements have visible hover/focus states
- Font sizes never go below 12px
- Code blocks use monospace fonts for readability

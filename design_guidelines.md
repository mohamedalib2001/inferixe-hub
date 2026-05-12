# Inferixe Enterprise Platform - Design Guidelines

## Design Approach
**System Selected**: Material Design 3 with corporate refinement
**Rationale**: Information-dense enterprise application requiring consistency, scalability, and established interaction patterns. Material Design provides robust component library perfect for complex workflows, data tables, and multi-level navigation.

## Core Design Principles
1. **Corporate Professionalism**: Clean, trustworthy aesthetic befitting enterprise software
2. **Information Clarity**: Dense data presented with clear hierarchy and breathing room
3. **Bilingual Excellence**: Seamless RTL/LTR switching without layout compromises
4. **Workflow Efficiency**: Minimize clicks, maximize context visibility

## Typography System

**Primary Font**: Inter (Google Fonts)
**Secondary Font**: IBM Plex Sans Arabic (for Arabic content)

**Type Scale**:
- Display: 32px/40px (Dashboard headers, page titles)
- H1: 24px/32px (Section headers, module titles)
- H2: 20px/28px (Card headers, subsection titles)
- H3: 16px/24px (Table headers, form section labels)
- Body: 14px/20px (Primary content, table data)
- Small: 12px/16px (Metadata, helper text, timestamps)
- Caption: 11px/14px (Labels, badges)

**Weights**: 400 (Regular), 500 (Medium), 600 (Semibold)

## Layout System

**Spacing Units**: Use Tailwind spacing - primary units are **2, 3, 4, 6, 8, 12, 16**
- Micro spacing: 2, 3, 4 (buttons, form elements, chips)
- Component spacing: 6, 8 (card padding, list items)
- Section spacing: 12, 16 (between major sections, page margins)

**Grid System**: 12-column responsive grid with 24px gutters

**Container Widths**:
- Sidebar: 280px (desktop), collapsible to 64px (icon-only)
- Main content: fluid with max-width constraints per module
- Forms: max-w-3xl for optimal readability
- Full-width tables: 100% within content area

## Component Library

### Navigation
**Primary Navigation**: Fixed sidebar (left for LTR, right for RTL)
- Collapsible with icon + label or icon-only states
- Nested menu support for module categories
- Active state: background treatment + accent indicator
- Badge support for notifications/counts

**Top Bar**: 
- Breadcrumb navigation (left/right based on locale)
- Quick actions: notifications, language toggle, profile menu
- Search bar (expandable on desktop, prominent on mobile)
- Height: 64px

### Data Display
**Tables**: 
- Striped rows for scanability
- Sticky headers on scroll
- Row actions (view, edit, delete) on hover/always visible on mobile
- Inline filters and sorting
- Pagination with page size selector
- Empty states with illustration + action

**Cards**:
- Elevated surfaces (subtle shadow)
- Header with title + optional action menu
- Body with generous padding (p-6)
- Footer for actions when needed
- Status indicators (colored left border or badge)

**Stats/KPIs**:
- Large number display (32px+) with trend indicators
- Icon representation of metric type
- Comparison data (vs previous period)
- Sparkline charts for trends
- 4-column grid on desktop, 2 on tablet, 1 on mobile

### Forms
**Input Fields**:
- Outlined variant (Material Design)
- Floating labels
- Helper text below field
- Error states with icon + message
- Required field indicator (*)
- Consistent height: 48px for text inputs

**Form Layout**:
- Two-column for related fields on desktop
- Single column on mobile
- Grouped sections with clear headers
- Action buttons bottom-right (Submit, Cancel)

**File Upload**:
- Drag-and-drop zone
- Preview thumbnails for images/documents
- Progress indicators
- File type/size validation feedback

### Workflow Components
**Approval Steps**:
- Horizontal stepper for multi-stage workflows
- Status indicators (pending, approved, rejected)
- Comment/feedback sections
- Timestamp + user attribution
- Action buttons contextual to stage

**Status Badges**:
- Rounded, medium size
- Color-coded by state (not specified here)
- Icons when beneficial (checkmark, x, clock)

### Dashboards
**Layout**:
- Widget-based responsive grid
- KPI cards at top (4 columns)
- Charts in 2-column layout below
- Activity feed sidebar (right/left based on locale)

**Charts**:
- Use Chart.js or similar library
- Bar, line, pie, donut charts as appropriate
- Interactive tooltips
- Legends clearly labeled
- Export functionality (PDF, Excel)

## Interaction Patterns

**Loading States**: Skeleton screens for data-heavy views, spinner for quick actions

**Empty States**: Illustration + descriptive message + primary action

**Modals**: 
- Max-width: 640px (small), 896px (medium), 1024px (large)
- Clear header with close button
- Scrollable content area
- Fixed footer with actions

**Notifications**: Toast messages (top-right/top-left), snackbar for confirmations, alert banners for system messages

**Hover States**: Subtle background change on interactive elements, no elaborate transitions

**Animations**: Minimal - smooth transitions (200-300ms) for dropdowns, modals, drawer opening. No decorative animations.

## Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px
- Large Desktop: > 1440px

## Images

**Login/Landing Page**: 
- Hero image showing professional office environment or abstract representation of enterprise management
- Full viewport height on desktop, reduced on mobile
- Gradient overlay for text legibility on hero
- Image position: background, overlaid with login card (centered)

**Dashboard**: 
- No hero images
- Small illustrative graphics for empty states
- Icons throughout navigation and KPIs

**User Profiles/Employee Records**:
- Avatar placeholders (circular, 96px for profile pages, 40px for lists)
- Company logo in header (height: 32px)

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader support with ARIA labels
- Focus indicators clearly visible
- Minimum touch target: 44x44px

## RTL/LTR Considerations
- Mirror layout completely for RTL
- Icons that indicate direction must flip
- Text alignment follows language direction
- Numbers remain LTR in Arabic context
- Test all components in both directions
# Design Guidelines - Zarbitrage Crypto Arbitrage Platform

## Brand Identity

### Primary Color
- **Primary Color**: `#6D00D1` (Purple)
- **Light Variant**: `#8B33FF`
- **Dark Variant**: `#5500A8`
- **Contrast**: `#FFFFFF` (White)

### Color Palette

#### Primary Colors
- **Main**: `#6D00D1` - Primary purple brand color
- **Light**: `#8B33FF` - For hover states and highlights
- **Dark**: `#5500A8` - For active states and depth

#### Status Colors
- **Success**: `#00A569` - For positive states and gains
- **Warning**: `#FFB400` - For caution and pending states
- **Error**: `#E84855` - For errors and negative states
- **Info**: `#428BFF` - For informational content

#### Chart Colors
- **Primary**: `['#6D00D1', '#8B33FF', '#B566FF']`
- **Secondary**: `['#7B61FF', '#9B85FF', '#BDB0FF']`
- **Tertiary**: `['#00A569', '#00C873', '#4CE89F']`
- **Quaternary**: `['#FFB400', '#FFC733', '#FFDB66']`

## Design System

### Theme System
The platform uses a comprehensive dark-ui theme system with:
- **Dark Mode**: Default theme with deep black backgrounds
- **Light Mode**: Clean white backgrounds with proper contrast
- **Responsive Design**: Mobile-first approach with breakpoints
- **Component Library**: Custom dark-ui components following Airbnb visx principles

### Typography
- **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Font Weights**: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Font Sizes**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px), 5xl (48px)

### Spacing System
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px
- **4xl**: 96px

### Border Radius
- **sm**: 4px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px
- **2xl**: 24px
- **full**: 9999px

## Component Guidelines

### Cards
- Use consistent padding and border radius
- Apply theme-aware background colors
- Implement smooth transitions (0.25s ease-in-out)
- Maintain consistent height across states

### Charts & Visualizations
- Follow Airbnb visx principles for data visualization
- Use primary purple color scheme for consistency
- Implement responsive design for mobile devices
- Show clear data hierarchy with proper contrast

### Interactive Elements
- Use primary purple for focus states
- Implement hover and active states
- Provide clear visual feedback for user actions
- Maintain accessibility standards

### Dark Mode Considerations
- Ensure sufficient contrast ratios
- Use elevated backgrounds for layered content
- Apply consistent border colors and opacity
- Test readability in both light and dark modes

## Technical Implementation

### Theme Usage
```typescript
import { useTheme } from '@/components/dark-ui';

const { theme } = useTheme();
// Use theme.colors.primary.main for primary color
```

### Color Application
- Use theme context for all color references
- Avoid hardcoded hex values in components
- Apply consistent opacity for disabled states
- Use rgba() for transparent overlays

### Animation Standards
- **Fast**: 150ms ease-in-out
- **Normal**: 300ms ease-in-out
- **Slow**: 500ms ease-in-out
- **Card Transitions**: 0.25s ease-in-out

## Brand Evolution

### From Airbnb Red to Custom Purple
The platform has evolved from using Airbnb's signature red (`#FF385C`) to a custom purple brand identity (`#6D00D1`). This change reflects:
- **Brand Differentiation**: Unique visual identity
- **Modern Aesthetic**: Purple conveys innovation and technology
- **Better Dark Mode**: Purple provides better contrast in dark themes
- **Professional Appeal**: Sophisticated color choice for financial platform

### Consistency Across Components
All components should now use the purple color scheme:
- Primary buttons and CTAs
- Chart visualizations
- Focus states and highlights
- Loading states and animations
- Status indicators where appropriate

## Future Considerations

### Accessibility
- Maintain WCAG 2.1 AA compliance
- Test with screen readers
- Ensure keyboard navigation
- Provide sufficient color contrast

### Performance
- Optimize color calculations
- Use CSS custom properties where possible
- Minimize component re-renders
- Implement efficient theme switching

### Scalability
- Design for international markets
- Consider color cultural significance
- Plan for additional brand colors
- Maintain design system documentation
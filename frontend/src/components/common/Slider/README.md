# RangeSlider Component

A beautiful, polished range slider component designed specifically for the MPLADS Dashboard. Features smooth animations, accessibility support, and professional government dashboard aesthetics.

## Features

### 🎨 Design & Aesthetics

- **Gradient tracks** with smooth color transitions from primary blue to civic gold
- **Elegant handles** with subtle shadows, hover effects, and micro-animations
- **Value tooltips** that appear on hover/drag with smooth fade animations
- **Professional styling** matching the MPLADS dashboard design system
- **Responsive design** optimized for all screen sizes

### ⚡ Performance & Interactions

- **Hardware-accelerated animations** using CSS transforms only
- **Smooth dragging** with grab/grabbing cursor states
- **Track highlighting** on interaction with scale effects
- **Efficient repaints** for optimal performance
- **Touch-optimized** for mobile devices with proper touch targets

### ♿ Accessibility

- **WCAG 2.1 AA compliant** with proper ARIA labels and roles
- **Keyboard navigation** support with focus indicators
- **Screen reader support** with descriptive labels
- **Reduced motion support** for users with motion sensitivity
- **High contrast mode** compatibility
- **Focus management** with visible focus states

### 🔧 Functionality

- **Dual range mode** for min/max value selection
- **Single value mode** for threshold/single value selection
- **Custom step values** for precise control
- **Value formatting** with custom formatter functions
- **Tick marks** with optional custom tick positions
- **Disabled state** with appropriate visual feedback
- **Controlled/uncontrolled** component patterns

## Usage

### Basic Range Slider

```jsx
import { RangeSlider } from '../Common/Slider'

function BudgetFilter() {
  const [budgetRange, setBudgetRange] = useState([10000, 500000])

  return (
    <RangeSlider
      label="Budget Range"
      min={5000}
      max={1000000}
      step={5000}
      value={budgetRange}
      onChange={setBudgetRange}
      formatValue={value => `₹${(value / 1000).toFixed(0)}K`}
      showTooltips={true}
    />
  )
}
```

### Single Value Slider

```jsx
<RangeSlider
  label="Fund Utilization Threshold"
  min={0}
  max={100}
  step={5}
  value={75}
  onChange={setThreshold}
  range={false}
  formatValue={value => `${value}%`}
  showTooltips={true}
/>
```

### With Tick Marks

```jsx
<RangeSlider
  label="Financial Years"
  min={2009}
  max={2024}
  step={1}
  value={yearRange}
  onChange={setYearRange}
  showTicks={true}
  tickValues={[2009, 2012, 2015, 2018, 2021, 2024]}
/>
```

## Props

| Prop               | Type                         | Default        | Description                   |
| ------------------ | ---------------------------- | -------------- | ----------------------------- |
| `min`              | `number`                     | `0`            | Minimum value                 |
| `max`              | `number`                     | `100`          | Maximum value                 |
| `step`             | `number`                     | `1`            | Step increment                |
| `value`            | `number \| [number, number]` | `[min, max]`   | Current value(s)              |
| `onChange`         | `function`                   | -              | Called when value changes     |
| `onChangeComplete` | `function`                   | -              | Called when dragging ends     |
| `disabled`         | `boolean`                    | `false`        | Disable the slider            |
| `formatValue`      | `function`                   | `(val) => val` | Format display values         |
| `label`            | `string`                     | -              | Accessible label              |
| `id`               | `string`                     | -              | HTML id attribute             |
| `className`        | `string`                     | `''`           | Additional CSS classes        |
| `showTooltips`     | `boolean`                    | `true`         | Show value tooltips           |
| `showTicks`        | `boolean`                    | `false`        | Show tick marks               |
| `tickValues`       | `number[]`                   | `[]`           | Custom tick positions         |
| `range`            | `boolean`                    | `true`         | Enable dual-handle range mode |

## Styling Integration

The component uses CSS variables from the MPLADS design system:

- **Colors**: Primary blue (`--primary-*`) and civic gold (`--civic-gold-*`)
- **Spacing**: Consistent spacing scale (`--spacing-*`)
- **Typography**: Design system fonts and sizes (`--text-*`, `--font-*`)
- **Shadows**: Layered shadow system (`--shadow-*`)
- **Transitions**: Smooth transitions (`--transition-*`)
- **Border radius**: Consistent radius scale (`--radius-*`)

## Mobile Optimization

- **Touch targets**: Minimum 44px touch targets on mobile
- **Larger handles**: Increased handle size for easier interaction
- **Responsive spacing**: Adjusted padding and margins
- **Touch-friendly**: Optimized for coarse pointer devices

## Browser Support

- Modern browsers with CSS Grid and Custom Properties support
- iOS Safari 12+
- Chrome 60+
- Firefox 55+
- Edge 79+

## Performance Notes

- Uses `transform` and `opacity` for animations (GPU accelerated)
- Avoids layout thrashing by using transforms only
- Efficient event handling with proper cleanup
- Minimal repaints during interaction
- Hardware acceleration with `will-change` property

## Accessibility Features

- Proper ARIA roles (`slider`) and labels
- Keyboard navigation support
- Focus management with visible focus indicators
- Screen reader announcements for value changes
- High contrast mode support
- Reduced motion respect for accessibility preferences

## Example Use Cases in MPLADS

1. **Budget filtering**: Set min/max budget ranges for analysis
2. **Year selection**: Choose financial year ranges for comparison
3. **Performance thresholds**: Set minimum performance scores
4. **Allocation ranges**: Filter by fund allocation amounts
5. **Timeline selection**: Select date ranges for reports

## Development

The component follows React best practices:

- Functional component with hooks
- Proper prop validation
- Memory leak prevention
- Performance optimization
- Accessibility compliance

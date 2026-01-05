# Plate Calculator System Documentation

## Overview

The Plate Calculator is a comprehensive feature that helps users determine which weight plates to load on a barbell for any target weight. It includes location-aware plate set management, customizable plate configurations, and seamless integration with the workout logger.

## Features

### 🏋️ Core Plate Calculation

- **Smart Algorithm**: Automatically calculates optimal plate combinations for any target weight
- **Multiple Bar Types**: Supports Olympic (45 lbs), Women's (35 lbs), Training (25 lbs), and metric bars
- **Visual Display**: Shows plates with color coding and visual representation
- **Accuracy Tracking**: Indicates exact matches vs. approximations with remaining weight

### 📍 Location-Based Management

- **Automatic Detection**: Uses browser geolocation API to detect current location
- **Location Matching**: Automatically selects appropriate plate set based on proximity (within 1km)
- **Privacy Friendly**: Location data stored locally, with user permission required
- **Custom Naming**: Name locations (e.g., "Home Gym", "Commercial Gym")

### ⚙️ Customizable Plate Sets

- **Multiple Configurations**: Create unlimited plate sets for different locations
- **Preset Templates**: Quick setup with Olympic or Metric plate standards
- **Custom Plates**: Add any weight, quantity, and color combination
- **Active/Inactive**: Enable/disable specific plates without deleting them
- **Default Selection**: Set preferred plate set for quick access

### 🔧 Workout Logger Integration

- **Inline Buttons**: 🏋️ buttons next to weight inputs for quick access
- **Modal Interface**: Full plate calculator opens in overlay
- **Real-time Updates**: Immediate calculation display
- **Seamless Experience**: Calculate plates without losing workout progress

## Technical Architecture

### Type Definitions (`types/plateCalculator.ts`)

```typescript
interface PlateSet {
  id: string;
  name: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  plates: Plate[];
  barWeight: number;
  isDefault: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

interface Plate {
  id: string;
  weight: number;
  quantity: number;
  color?: string;
  material?: 'iron' | 'rubber' | 'bumper' | 'competition';
  isActive: boolean;
}
```

### Storage Service (`services/plateCalculatorStorage.ts`)

- **Local Storage**: All data persisted in browser localStorage
- **Initialization**: Automatic creation of default Olympic plate set
- **CRUD Operations**: Full create, read, update, delete for plate sets
- **Location Services**: Geolocation API integration with fallback handling
- **Distance Calculation**: Haversine formula for location proximity

### Main Components

#### PlateCalculator (`components/PlateCalculator.tsx`)

- **Dual Mode**: Standalone component or inline integration
- **Weight Input**: Direct weight entry with real-time calculation
- **Plate Set Selection**: Dropdown for quick plate set switching
- **Visual Results**: Color-coded plate display with quantities
- **Location Toggle**: Enable/disable location-based features

#### PlateSetManager (`components/PlateSetManager.tsx`)

- **CRUD Interface**: Complete plate set management
- **Location Assignment**: GPS integration for automatic location setting
- **Preset Loading**: One-click Olympic/Metric plate setup
- **Validation**: Ensures at least one plate set always exists
- **Default Management**: Set/unset default plate configurations

#### WorkoutLogger Integration

- **Weight Input Enhancement**: Added plate calculator buttons to all weight fields
- **Modal Interface**: Full-featured plate calculator in popup
- **Context Preservation**: Maintains workout state during plate calculation
- **Quick Access**: One-click access from any weight input field

## Algorithm Details

### Plate Selection Algorithm

```typescript
calculatePlates(targetWeight: number, plateSet: PlateSet): PlateCalculation {
  // 1. Calculate weight to load (target - bar weight)
  const weightToLoad = targetWeight - plateSet.barWeight;
  const weightPerSide = weightToLoad / 2;

  // 2. Sort plates heaviest first for greedy algorithm
  const availablePlates = plateSet.plates
    .filter(p => p.isActive && p.quantity > 0)
    .sort((a, b) => b.weight - a.weight);

  // 3. Greedy selection: use largest plates first
  const platesPerSide = [];
  let remainingWeight = weightPerSide;
  
  for (const plate of availablePlates) {
    const maxUsable = Math.floor(plate.quantity / 2); // Pairs only
    const needed = Math.floor(remainingWeight / plate.weight);
    const toUse = Math.min(needed, maxUsable);
    
    if (toUse > 0) {
      platesPerSide.push({ plate, quantity: toUse });
      remainingWeight -= toUse * plate.weight;
    }
  }

  return {
    targetWeight,
    totalWeight: barWeight + (2 * totalPlateWeight),
    platesPerSide,
    remainingWeight,
    isExact: Math.abs(remainingWeight) < 0.01
  };
}
```

### Location Matching

- **Proximity Threshold**: 1 kilometer radius for location matching
- **Haversine Distance**: Accurate distance calculation considering Earth's curvature
- **Fallback Behavior**: Uses default plate set if no location match found
- **User Control**: Location features fully optional and user-controlled

## User Interface

### Main Plate Calculator Screen

1. **Header Controls**
   - Location toggle button (📍)
   - Manage plate sets button (⚙️)

2. **Calculator Interface**
   - Target weight input (supports 2.5 lb increments)
   - Plate set selector dropdown
   - Real-time calculation display

3. **Results Display**
   - Target vs. actual weight comparison
   - Bar weight identification
   - Per-side plate breakdown
   - Visual plate representation with colors
   - Warning for inexact matches

### Workout Logger Integration

1. **Enhanced Weight Inputs**
   - Original weight input field
   - 🏋️ plate calculator button
   - Consistent styling and layout

2. **Modal Plate Calculator**
   - Full-featured calculator in overlay
   - Close button and click-outside-to-close
   - Calculation summary display

### Plate Set Management

1. **Overview Screen**
   - Grid layout of existing plate sets
   - Default badge indication
   - Location information display
   - Quick action buttons (Edit, Set Default, Delete)

2. **Editor Interface**
   - Basic information (name, bar weight)
   - Location assignment (manual or GPS)
   - Preset loading buttons
   - Individual plate configuration
   - Add/remove plate functionality

## Default Configurations

### Olympic Plates (Imperial)

- 45 lbs × 8 (Red)
- 35 lbs × 2 (Blue)  
- 25 lbs × 4 (Green)
- 10 lbs × 4 (White)
- 5 lbs × 4 (Black)
- 2.5 lbs × 4 (Silver)
- **Bar Weight**: 45 lbs

### Metric Plates

- 20 kg × 8 (Red)
- 15 kg × 2 (Blue)
- 10 kg × 4 (Green)
- 5 kg × 4 (White)
- 2.5 kg × 4 (Black)
- 1.25 kg × 4 (Silver)
- **Bar Weight**: 20 kg

## Usage Examples

### Basic Usage

1. Open Plate Calculator tab
2. Enter target weight (e.g., 225 lbs)
3. View calculated plate configuration
4. Load plates as displayed

### Location-Based Setup

1. Enable location services
2. Create plate set at gym location
3. Automatic selection when returning to gym
4. Different configurations for home vs. commercial gym

### Workout Integration

1. Start logging workout in Workout Logger
2. Click 🏋️ button next to weight input
3. Calculate plates for working weight
4. Continue with workout logging

### Custom Plate Set

1. Open Plate Calculator
2. Click ⚙️ Manage button
3. Create new plate set
4. Configure custom plates and quantities
5. Assign location if desired
6. Set as default if preferred

## Browser Compatibility

### Required Features

- **localStorage**: For data persistence
- **Geolocation API**: For location features (optional)
- **Modern JavaScript**: ES6+ support
- **CSS Grid/Flexbox**: For responsive layouts

### Supported Browsers

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### Progressive Enhancement

- Core functionality works without location services
- Graceful degradation for older browsers
- Accessibility features throughout

## Performance Considerations

### Storage Efficiency

- Compact JSON storage format
- Minimal data structure overhead
- Efficient plate set indexing

### Calculation Speed

- O(n) plate selection algorithm
- Cached distance calculations
- Optimized React re-renders

### Memory Usage

- Lazy loading of plate set manager
- Component-based code splitting
- Efficient state management

## Accessibility Features

### WCAG 2.1 Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and roles
- **Color Independence**: Information not color-dependent
- **Focus Management**: Logical tab order
- **Alternative Text**: Descriptive labels for all controls

### Specific Features

- Skip links for keyboard users
- Role and aria-label attributes
- High contrast color schemes
- Large touch targets for mobile
- Error message announcement
- Status updates for screen readers

## Future Enhancements

### Planned Features

- **Plate Loading Order**: Visual guide for optimal loading sequence
- **Weight Conversions**: Automatic imperial/metric conversion
- **Sharing**: Export/import plate set configurations
- **Competition Mode**: IPF/USAPL official plate specifications
- **Advanced Algorithms**: Multi-objective optimization (minimize plates, balanced loading)

### Integration Opportunities

- **Progress Tracking**: Historical plate usage analytics
- **Workout Planning**: Suggest warmup plate progressions
- **Social Features**: Share custom plate configurations
- **Equipment Database**: Expand to other gym equipment

This plate calculator system provides a comprehensive solution for weight plate management, combining smart algorithms, location awareness, and seamless workout integration to enhance the strength training experience.

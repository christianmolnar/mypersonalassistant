# 🎯 Mission Control Dashboard Heuristics

## Current Implementation Status ✅

### 1. **Total Fleet Count**
- ✅ **Location**: Integrated into Mission Control header with blue background
- ✅ **Display**: Large 3.85M number prominently displayed
- ✅ **Format**: Clean integration within header design

### 2. **Individual Robot Status Panels**
- ✅ **Layout**: Separate panels for Count (top) and Percentage (bottom)
- ✅ **Positioning**: Visually grouped under each chart
- ✅ **Color Sync**: Both panels use percentage-based thresholds for consistent coloring

## 🎨 Color Heuristics (Percentage-Based)

### **HEALTHY ROBOTS** 🟢
- **99.9% and above**: Green (both count and % panels)
- **98.0% to 99.89%**: Yellow (both count and % panels)
- **95.0% to 97.99%**: Orange (both count and % panels)
- **Below 95.0%**: Red (both count and % panels)

### **DEGRADED, CRITICAL & DOWN ROBOTS** 🟡🟠🔴
- **0% to 0.333%**: Green (both count and % panels)
- **0.334% to 1.000%**: Yellow (both count and % panels)
- **1.001% to 2.000%**: Orange (both count and % panels)
- **Above 2.000%**: Red (both count and % panels)

## 📊 Panel Configuration

### **Count Panels** (Top Row)
- **Purpose**: Show absolute numbers (e.g., "3.85 Mil")
- **Thresholds**: Use percentage calculations but display count values
- **Unit**: `short` (displays with K, M suffixes)
- **Color Source**: Percentage-based thresholds

### **Percentage Panels** (Bottom Row)
- **Purpose**: Show percentage of total fleet (e.g., "99.134%")
- **Thresholds**: Direct percentage-based thresholds
- **Unit**: `percent` with 3 decimal places
- **Format**: Auto-appends % symbol

## 🔧 Technical Implementation

### **Panel Structure**
```
[CHART - White timeseries with colored line]
[COUNT - Number colored by percentage threshold]
[PERCENTAGE - Percentage colored by same threshold]
```

### **Queries Used**
- **Count**: `sum(robot_fleet_healthy)`
- **Percentage**: `sum(robot_fleet_healthy) / sum(robot_fleet_total) * 100`

### **Color Synchronization**
Both count and percentage panels reference the same percentage thresholds to ensure:
1. Visual consistency
2. Proper operational meaning
3. Unified color logic across the dashboard

## 📈 Dashboard Layout
```
🚀 MISSION CONTROL (with Total Fleet Count: 3.85M)

[HEALTHY Chart]  [DEGRADED Chart]  [CRITICAL Chart]  [DOWN Chart]
[Count]          [Count]           [Count]           [Count]
[Percentage]     [Percentage]      [Percentage]      [Percentage]

[Robot Success Rates - Full Width]
[Activity Metrics - Full Width]
```

## 🎯 Current Status
- ✅ Total fleet count integrated into header
- ✅ Separate count and percentage panels
- ✅ Percentage-based color thresholds implemented
- ✅ 3 decimal place precision for percentages
- ✅ Clean visual grouping under charts
- ✅ Consistent color logic across all panels

The dashboard now displays exactly as requested with proper percentage-based heuristics driving the color coding for both count and percentage displays!

import 'expo-router/entry';

// Background tasks (the MARK_DONE notification action, the daily rebuild) are defined at
// NotificationScheduler's module scope. A headless launch — a killed-state notification action,
// a background fetch — never renders the router tree, so route-module imports never run there.
// This import is the only thing that makes TaskManager.defineTask execute in that mode.
import './src/services/NotificationScheduler';

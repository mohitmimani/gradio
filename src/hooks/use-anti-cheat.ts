"use client";

import { useEffect, useState, useCallback } from "react";

export interface CheatingMetrics {
  tabSwitches: number;
  timeAwayFromTab: number; // in seconds
  copyAttempts: number;
  pasteAttempts: number;
  rightClickAttempts: number;
  keyboardShortcuts: string[];
  fullscreenExits: number;
  pageVisibilityChanges: number;
  suspiciousActivity: string[];
  focusLossEvents: { timestamp: Date; duration: number }[];
}

export function useAntiCheat() {
  const [metrics, setMetrics] = useState<CheatingMetrics>({
    tabSwitches: 0,
    timeAwayFromTab: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    rightClickAttempts: 0,
    keyboardShortcuts: [],
    fullscreenExits: 0,
    pageVisibilityChanges: 0,
    suspiciousActivity: [],
    focusLossEvents: [],
  });

  const [isActive, setIsActive] = useState(true);
  const [focusLostTime, setFocusLostTime] = useState<Date | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const logSuspiciousActivity = useCallback((activity: string) => {
    setMetrics(prev => ({
      ...prev,
      suspiciousActivity: [...prev.suspiciousActivity, activity]
    }));
    setWarnings(prev => [...prev, activity]);
  }, []);

  const addWarning = useCallback((warning: string) => {
    setWarnings(prev => [...prev, warning]);
  }, []);

  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setMetrics(prev => ({
        ...prev,
        rightClickAttempts: prev.rightClickAttempts + 1
      }));
      logSuspiciousActivity("Right-click attempted");
      return false;
    };

    // Monitor keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const suspiciousKeys = [
        'F12', // Dev tools
        'F5', // Refresh
        'F11', // Fullscreen toggle
      ];

      const suspiciousShortcuts = [
        { ctrl: true, key: 'c' }, // Copy
        { ctrl: true, key: 'v' }, // Paste
        { ctrl: true, key: 'a' }, // Select all
        { ctrl: true, key: 'f' }, // Find
        { ctrl: true, key: 'u' }, // View source
        { ctrl: true, key: 'i' }, // Dev tools
        { ctrl: true, key: 'j' }, // Console
        { ctrl: true, key: 'k' }, // Console
        { ctrl: true, shift: true, key: 'i' }, // Dev tools
        { ctrl: true, shift: true, key: 'j' }, // Console
        { ctrl: true, shift: true, key: 'c' }, // Inspector
        { alt: true, key: 'Tab' }, // Alt+Tab
      ];

      // Check for suspicious single keys
      if (suspiciousKeys.includes(e.code)) {
        e.preventDefault();
        const activity = `Blocked key: ${e.code}`;
        logSuspiciousActivity(activity);
        setMetrics(prev => ({
          ...prev,
          keyboardShortcuts: [...prev.keyboardShortcuts, e.code]
        }));
        return false;
      }

      // Check for suspicious key combinations
      const isBlockedShortcut = suspiciousShortcuts.some(shortcut => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        return ctrlMatch && shiftMatch && keyMatch;
      });

      if (isBlockedShortcut) {
        e.preventDefault();
        const shortcut = `${e.ctrlKey || e.metaKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
        
        if (e.key.toLowerCase() === 'c') {
          setMetrics(prev => ({ ...prev, copyAttempts: prev.copyAttempts + 1 }));
        } else if (e.key.toLowerCase() === 'v') {
          setMetrics(prev => ({ ...prev, pasteAttempts: prev.pasteAttempts + 1 }));
        }

        logSuspiciousActivity(`Blocked shortcut: ${shortcut}`);
        setMetrics(prev => ({
          ...prev,
          keyboardShortcuts: [...prev.keyboardShortcuts, shortcut]
        }));
        return false;
      }
    };

    // Monitor page visibility changes (tab switching)
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsActive(isVisible);

      if (isVisible) {
        // Tab became active again
        if (focusLostTime) {
          const timeAway = Math.floor((Date.now() - focusLostTime.getTime()) / 1000);
          setMetrics(prev => ({
            ...prev,
            timeAwayFromTab: prev.timeAwayFromTab + timeAway,
            focusLossEvents: [
              ...prev.focusLossEvents,
              { timestamp: focusLostTime, duration: timeAway }
            ]
          }));
          setFocusLostTime(null);
          
          if (timeAway > 5) { // More than 5 seconds away
            addWarning(`You were away from this tab for ${timeAway} seconds`);
          }
        }
      } else {
        // Tab became inactive
        setFocusLostTime(new Date());
        setMetrics(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          pageVisibilityChanges: prev.pageVisibilityChanges + 1
        }));
        logSuspiciousActivity("Tab switch detected");
      }
    };

    // Monitor window focus changes
    const handleWindowBlur = () => {
      if (!focusLostTime) {
        setFocusLostTime(new Date());
        setMetrics(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1
        }));
        logSuspiciousActivity("Window lost focus");
      }
    };

    const handleWindowFocus = () => {
      if (focusLostTime) {
        const timeAway = Math.floor((Date.now() - focusLostTime.getTime()) / 1000);
        setMetrics(prev => ({
          ...prev,
          timeAwayFromTab: prev.timeAwayFromTab + timeAway,
          focusLossEvents: [
            ...prev.focusLossEvents,
            { timestamp: focusLostTime, duration: timeAway }
          ]
        }));
        setFocusLostTime(null);
      }
    };

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setMetrics(prev => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1
        }));
        logSuspiciousActivity("Exited fullscreen mode");
      }
    };

    // Prevent text selection in certain areas
    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Add selection prevention (optional - might hurt UX)
    // document.addEventListener('selectstart', preventSelection);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      // document.removeEventListener('selectstart', preventSelection);
    };
  }, [focusLostTime, logSuspiciousActivity, addWarning]);

  // Calculate cheating risk percentage
  const getCheatingRiskPercentage = useCallback(() => {
    let risk = 0;
    
    // Tab switches (each switch adds 10% risk, cap at 50%)
    risk += Math.min(metrics.tabSwitches * 10, 50);
    
    // Time away from tab (each minute adds 5% risk, cap at 30%)
    risk += Math.min(Math.floor(metrics.timeAwayFromTab / 60) * 5, 30);
    
    // Copy/paste attempts (each adds 15% risk, cap at 45%)
    risk += Math.min((metrics.copyAttempts + metrics.pasteAttempts) * 15, 45);
    
    // Right-click attempts (each adds 5% risk, cap at 20%)
    risk += Math.min(metrics.rightClickAttempts * 5, 20);
    
    // Keyboard shortcuts (each adds 10% risk, cap at 40%)
    risk += Math.min(metrics.keyboardShortcuts.length * 10, 40);
    
    // Fullscreen exits (each adds 20% risk, cap at 60%)
    risk += Math.min(metrics.fullscreenExits * 20, 60);
    
    return Math.min(risk, 100); // Cap at 100%
  }, [metrics]);

  const getRiskLevel = useCallback(() => {
    const risk = getCheatingRiskPercentage();
    if (risk >= 70) return 'high';
    if (risk >= 40) return 'medium';
    if (risk >= 15) return 'low';
    return 'minimal';
  }, [getCheatingRiskPercentage]);

  return {
    metrics,
    warnings,
    isActive,
    cheatingRiskPercentage: getCheatingRiskPercentage(),
    riskLevel: getRiskLevel(),
    clearWarnings: () => setWarnings([]),
  };
}
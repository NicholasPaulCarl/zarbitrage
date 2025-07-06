import { useState, useEffect } from 'react';
import { Label, Input, Switch, Button, useTheme } from '@/components/dark-ui';
import { Save, Check } from 'lucide-react';

interface AlertSettingsProps {
  threshold: number;
  setThreshold: (threshold: number) => void;
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  toggleSoundAlerts: (enabled: boolean) => void;
  toggleBrowserNotifications: (enabled: boolean) => void;
}

export default function AlertSettings({
  threshold,
  setThreshold,
  soundEnabled,
  browserNotificationEnabled,
  toggleSoundAlerts,
  toggleBrowserNotifications
}: AlertSettingsProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState<string>(threshold.toString());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // Track notification setting changes
  const [hasSoundChanged, setHasSoundChanged] = useState<boolean>(false);
  const [hasBrowserNotifChanged, setHasBrowserNotifChanged] = useState<boolean>(false);
  const [notifSaving, setNotifSaving] = useState<boolean>(false);
  const [notifSaved, setNotifSaved] = useState<boolean>(false);

  // Update input value when threshold changes externally
  useEffect(() => {
    setInputValue(threshold.toString());
    setHasChanges(false);
  }, [threshold]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHasChanges(true);
    setSavedSuccess(false);
  };

  // Save changes
  const handleSave = () => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue) && newValue > 0) {
      setIsSaving(true);
      
      // Simulate a brief saving delay for user feedback
      setTimeout(() => {
        setThreshold(newValue);
        setIsSaving(false);
        setSavedSuccess(true);
        setHasChanges(false);
        
        // Reset success indicator after a short delay
        setTimeout(() => {
          setSavedSuccess(false);
        }, 2000);
      }, 500);
    } else {
      // Reset to current threshold if invalid
      setInputValue(threshold.toString());
      setHasChanges(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };
  
  // Handle sound alert toggle change
  const handleSoundToggleChange = (checked: boolean) => {
    setHasSoundChanged(true);
    setNotifSaved(false);
  };
  
  // Handle browser notification toggle change
  const handleBrowserNotifToggleChange = (checked: boolean) => {
    setHasBrowserNotifChanged(true);
    setNotifSaved(false);
  };
  
  // Save notification settings
  const handleSaveNotifications = () => {
    setNotifSaving(true);
    
    // Simulate a brief saving delay for user feedback
    setTimeout(() => {
      setNotifSaving(false);
      setNotifSaved(true);
      setHasSoundChanged(false);
      setHasBrowserNotifChanged(false);
      
      // Reset success indicator after a delay
      setTimeout(() => {
        setNotifSaved(false);
      }, 2000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Threshold Setting Section */}
      <div 
        className="border rounded-lg p-4"
        style={{ 
          backgroundColor: `${theme.colors.background.tertiary}30`,
          borderColor: theme.colors.border.primary
        }}
      >
        <div className="mb-3">
          <h3 
            className="text-sm font-medium flex items-center"
            style={{ color: theme.colors.text.primary }}
          >
            <span 
              className="inline-flex items-center justify-center h-6 w-6 rounded-full mr-2"
              style={{ 
                backgroundColor: `${theme.colors.primary.main}10`,
                color: theme.colors.primary.main
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-percent"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
            </span>
            Spread Threshold
          </h3>
          <p 
            className="text-xs ml-8"
            style={{ color: theme.colors.text.secondary }}
          >
            You will be alerted when opportunities exceed this percentage
          </p>
        </div>
        
        <div className="flex items-center ml-8">
          <div className="relative w-24">
            <Input
              id="threshold-input"
              type="number"
              min="0.1"
              step="0.1"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="pr-6 text-right font-medium"
            />
            <span 
              className="absolute right-3 top-1/2 text-sm pointer-events-none"
              style={{ 
                transform: 'translateY(-50%)',
                color: theme.colors.text.secondary
              }}
            >
              %
            </span>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
            variant={savedSuccess ? "outline" : "primary"}
            className="ml-3 transition-all"
            style={{
              height: '2.25rem',
              ...(savedSuccess ? {
                backgroundColor: `${theme.colors.status.success}10`,
                color: theme.colors.status.success,
                borderColor: theme.colors.status.success
              } : {})
            }}
          >
            {isSaving ? (
              <span className="flex items-center">
                <Save className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                <span className="text-xs">Saving...</span>
              </span>
            ) : savedSuccess ? (
              <span className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Saved</span>
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Save</span>
              </span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Notification Types Section */}
      <div 
        className="border rounded-lg p-4"
        style={{ 
          backgroundColor: `${theme.colors.background.tertiary}30`,
          borderColor: theme.colors.border.primary
        }}
      >
        <div className="mb-3">
          <h3 
            className="text-sm font-medium flex items-center"
            style={{ color: theme.colors.text.primary }}
          >
            <span 
              className="inline-flex items-center justify-center h-6 w-6 rounded-full mr-2"
              style={{ 
                backgroundColor: `${theme.colors.primary.main}10`,
                color: theme.colors.primary.main
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </span>
            Notification Methods
          </h3>
          <p 
            className="text-xs ml-8"
            style={{ color: theme.colors.text.secondary }}
          >
            Choose how you want to be notified about profitable opportunities
          </p>
        </div>
        
        <div className="space-y-3 ml-8">
          <div 
            className="flex items-center justify-between rounded-md p-2.5 pr-3 border"
            style={{
              backgroundColor: theme.colors.background.primary,
              borderColor: theme.colors.border.primary
            }}
          >
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2.5"
                style={{ color: theme.colors.text.secondary }}
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
              <div>
                <Label htmlFor="sound-toggle" className="text-sm font-medium block">
                  Sound Alerts
                </Label>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Play a sound when an opportunity is found
                </p>
              </div>
            </div>
            <Switch 
              checked={soundEnabled} 
              onCheckedChange={(checked: boolean) => {
                handleSoundToggleChange(checked);
                toggleSoundAlerts(checked);
              }}
            />
          </div>
          
          <div 
            className="flex items-center justify-between rounded-md p-2.5 pr-3 border"
            style={{
              backgroundColor: theme.colors.background.primary,
              borderColor: theme.colors.border.primary
            }}
          >
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2.5"
                style={{ color: theme.colors.text.secondary }}
              >
                <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
                <path d="M8 21h8"></path>
                <path d="M12 17v4"></path>
                <path d="m22 3-5 5"></path>
                <path d="m17 3 5 5"></path>
              </svg>
              <div>
                <Label htmlFor="browser-notification-toggle" className="text-sm font-medium block">
                  Browser Notifications
                </Label>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Show browser popups for new opportunities
                </p>
              </div>
            </div>
            <Switch 
              checked={browserNotificationEnabled} 
              onCheckedChange={(checked: boolean) => {
                handleBrowserNotifToggleChange(checked);
                toggleBrowserNotifications(checked);
              }}
            />
          </div>
          
          {/* Save Button for Notification Settings */}
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSaveNotifications}
              disabled={notifSaving || (!hasSoundChanged && !hasBrowserNotifChanged)}
              size="sm"
              variant={notifSaved ? "outline" : "primary"}
              className="transition-all"
              style={{
                ...(notifSaved ? {
                  backgroundColor: `${theme.colors.status.success}10`,
                  color: theme.colors.status.success,
                  borderColor: theme.colors.status.success
                } : {})
              }}
            >
              {notifSaving ? (
                <span className="flex items-center">
                  <Save className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  <span className="text-xs">Saving...</span>
                </span>
              ) : notifSaved ? (
                <span className="flex items-center">
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Saved</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Save Notification Settings</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Info Section */}
      <div 
        className="rounded-lg p-3 text-sm flex items-start"
        style={{
          backgroundColor: `${theme.colors.primary.main}10`,
          color: theme.colors.text.primary
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mr-2 mt-0.5"
          style={{ color: theme.colors.primary.main }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <div>
          <p 
            className="font-medium mb-1"
            style={{ color: theme.colors.text.primary }}
          >
            Alert Tips
          </p>
          <p 
            className="text-xs"
            style={{ color: theme.colors.text.secondary }}
          >
            For browser notifications, you may need to grant permission when prompted.
            Set your threshold conservatively to catch only the most profitable opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}

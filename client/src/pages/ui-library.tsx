import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

// Atomic Design - Atoms (Basic building blocks)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Toggle } from '@/components/ui/toggle';

// Atomic Design - Molecules (Groups of atoms)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Atomic Design - Organisms (Complex UI components)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

// Data Visualization Components
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Treemap, Tooltip as RechartsTooltip } from 'recharts';

// Icons from Lucide React
import { 
  Monitor, 
  Smartphone, 
  Heart, 
  Star, 
  Search, 
  Settings, 
  User, 
  Download, 
  Upload, 
  Calendar as CalendarIcon,
  Mail,
  Phone,
  MapPin,
  Clock,
  Trash2,
  Edit,
  Plus,
  Minus,
  Home,
  Users,
  FileText,
  Image,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Palette,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bitcoin,
  Activity,
  Zap,
  Shield,
  Bell,
  Archive,
  Database,
  RefreshCw,
  X,
  Menu,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UILibraryPage() {
  const { isAdmin, user } = useAuth();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('atoms');
  const [sliderValue, setSliderValue] = useState([50]);
  const [progressValue, setProgressValue] = useState(65);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Redirect non-admin users to dashboard
  React.useEffect(() => {
    if (user && !isAdmin) {
      setLocation('/');
    }
  }, [user, isAdmin, setLocation]);

  // Show loading or redirect for non-admin users
  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">This page is only available to administrators.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Sample data for charts
  const arbitrageData = [
    { name: 'Binance→LUNO', spread: 3.2, volume: 1200000, profit: 4800 },
    { name: 'Kraken→VALR', spread: 2.8, volume: 980000, profit: 3920 },
    { name: 'Bitstamp→ATC', spread: 2.1, volume: 750000, profit: 2250 },
    { name: 'Bitfinex→LUNO', spread: 1.9, volume: 650000, profit: 1950 },
    { name: 'KuCoin→VALR', spread: 1.5, volume: 580000, profit: 1450 },
  ];

  const exchangeData = [
    { name: 'LUNO', value: 35, fill: '#3b82f6' },
    { name: 'VALR', value: 28, fill: '#10b981' },
    { name: 'AltcoinTrader', value: 22, fill: '#f59e0b' },
    { name: 'Binance', value: 15, fill: '#ef4444' },
  ];

  const performanceData = [
    { date: '2025-05-20', spreads: 15, profit: 2400 },
    { date: '2025-05-21', spreads: 18, profit: 2800 },
    { date: '2025-05-22', spreads: 12, profit: 1900 },
    { date: '2025-05-23', spreads: 22, profit: 3500 },
    { date: '2025-05-24', spreads: 20, profit: 3200 },
  ];

  // Atomic Design navigation sections
  const atomicSections = [
    { id: 'atoms', label: 'Atoms', icon: '⚛️', description: 'Basic building blocks' },
    { id: 'molecules', label: 'Molecules', icon: '🔬', description: 'Groups of atoms' },
    { id: 'organisms', label: 'Organisms', icon: '🧬', description: 'Complex components' },
    { id: 'app-components', label: 'App Components', icon: '🚀', description: 'Custom components' },
    { id: 'charts', label: 'Data Visualization', icon: '📊', description: 'Charts & graphs' },
    { id: 'patterns', label: 'Patterns', icon: '🧩', description: 'Common UI patterns' },
    { id: 'templates', label: 'Templates', icon: '📄', description: 'Page layouts' },
    { id: 'pages', label: 'Pages', icon: '🌐', description: 'Complete instances' },
    { id: 'tokens', label: 'Design Tokens', icon: '🎨', description: 'Design system values' },
  ];

  const ComponentDemo = ({ 
    label, 
    description, 
    atomicLevel,
    usage,
    children 
  }: { 
    label: string; 
    description?: string; 
    atomicLevel: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
    usage?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-4 border rounded-lg p-6 bg-card">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-medium text-foreground">{label}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {atomicLevel}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {usage && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Usage:</strong> {usage}
          </div>
        )}
      </div>
      <div className="p-4 border rounded-md bg-background">{children}</div>
    </div>
  );

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                Atomic Design System
              </h1>
              <p className="text-muted-foreground mt-1">
                Complete component library organized by atomic design principles for the crypto arbitrage platform
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="text-sm">View:</Label>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as 'desktop' | 'mobile')}
                className="border rounded-lg"
              >
                <ToggleGroupItem value="desktop" aria-label="Desktop view">
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </ToggleGroupItem>
                <ToggleGroupItem value="mobile" aria-label="Mobile view">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Navigation */}
          <Card className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-2">
            <CardContent className="p-4">
              {/* Desktop Navigation - Hidden on mobile */}
              <div className="hidden lg:block">
                <ScrollArea className="w-full">
                  <div className="flex space-x-2">
                    {atomicSections.map((section) => (
                      <Tooltip key={section.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeSection === section.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => scrollToSection(section.id)}
                            className="flex-shrink-0 flex items-center gap-2"
                          >
                            <span>{section.icon}</span>
                            <span>{section.label}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm font-medium">{section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Mobile/Small Desktop Navigation - Dropdown Menu */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <span>{atomicSections.find(s => s.id === activeSection)?.icon}</span>
                        <span>{atomicSections.find(s => s.id === activeSection)?.label || 'Select Section'}</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    <DropdownMenuLabel>Navigate to Section</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {atomicSections.map((section) => (
                      <DropdownMenuItem
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="flex items-center gap-3 p-3"
                      >
                        <span className="text-lg">{section.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-xs text-muted-foreground">{section.description}</div>
                        </div>
                        {activeSection === section.id && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className={cn(
            "mx-auto space-y-12",
            viewMode === 'mobile' ? 'max-w-sm' : 'max-w-7xl'
          )}>
            
            {/* ATOMS - Basic Building Blocks */}
            <div id="atoms" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  ⚛️ Atoms
                  <Badge variant="secondary">15 components</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  The foundational building blocks of our design system. These are the basic HTML elements and cannot be broken down further.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Buttons" 
                  description="Interactive elements for user actions"
                  atomicLevel="atom"
                  usage="Primary actions, form submissions, navigation triggers"
                >
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button size="sm">Small</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Settings className="h-4 w-4" /></Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Input Fields" 
                  description="Text input elements for data collection"
                  atomicLevel="atom"
                  usage="Forms, search bars, data entry"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="text">Text Input</Label>
                      <Input id="text" type="text" placeholder="Enter text..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Input</Label>
                      <Input id="email" type="email" placeholder="user@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password Input</Label>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Number Input</Label>
                      <Input id="number" type="number" placeholder="1000" />
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Labels & Typography" 
                  description="Text elements and typography system"
                  atomicLevel="atom"
                  usage="Form labels, headings, body text"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-4xl font-bold">Heading 1</h1>
                      <h2 className="text-3xl font-semibold">Heading 2</h2>
                      <h3 className="text-2xl font-medium">Heading 3</h3>
                      <h4 className="text-xl font-medium">Heading 4</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base">Regular paragraph text</p>
                      <p className="text-sm text-muted-foreground">Small muted text</p>
                      <Label>Form label</Label>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Interactive Controls" 
                  description="Switches, checkboxes, and toggles"
                  atomicLevel="atom"
                  usage="Settings, preferences, boolean inputs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h5 className="font-medium">Switches</h5>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="switch1" />
                          <Label htmlFor="switch1">Enable notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="switch2" defaultChecked />
                          <Label htmlFor="switch2">Auto-sync data</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-medium">Checkboxes</h5>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="check1" />
                          <Label htmlFor="check1">Accept terms</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="check2" defaultChecked />
                          <Label htmlFor="check2">Subscribe to updates</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-medium">Radio Buttons</h5>
                      <RadioGroup defaultValue="option1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option1" id="r1" />
                          <Label htmlFor="r1">Option 1</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option2" id="r2" />
                          <Label htmlFor="r2">Option 2</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Progress & Sliders" 
                  description="Progress indicators and range controls"
                  atomicLevel="atom"
                  usage="Loading states, value selection, progress tracking"
                >
                  <div className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <Label>Progress Bar: {progressValue}%</Label>
                      <Progress value={progressValue} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label>Slider Value: {sliderValue[0]}</Label>
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Visual Elements" 
                  description="Badges, avatars, and separators"
                  atomicLevel="atom"
                  usage="Status indicators, user representation, content separation"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h5 className="font-medium">Badges</h5>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Live</Badge>
                        <Badge variant="secondary">Pending</Badge>
                        <Badge variant="destructive">Error</Badge>
                        <Badge variant="outline">Inactive</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">Avatars</h5>
                      <div className="flex gap-4">
                        <Avatar>
                          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar>
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">SM</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">Separators</h5>
                      <div className="space-y-4">
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <span>Left</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>Right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Loading States" 
                  description="Skeleton loaders and loading indicators"
                  atomicLevel="atom"
                  usage="Loading states, placeholder content"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[160px]" />
                      </div>
                    </div>
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* MOLECULES - Groups of Atoms */}
            <div id="molecules" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🔬 Molecules
                  <Badge variant="secondary">12 components</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Groups of atoms bonded together to form more complex UI components with specific functionality.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Select & Dropdowns" 
                  description="Selection controls with multiple options"
                  atomicLevel="molecule"
                  usage="Form selectors, filter controls, option menus"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label>Exchange Selection</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luno">LUNO</SelectItem>
                          <SelectItem value="valr">VALR</SelectItem>
                          <SelectItem value="altcointrader">AltcoinTrader</SelectItem>
                          <SelectItem value="binance">Binance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Trading Pair</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pair" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="btc-zar">BTC/ZAR</SelectItem>
                          <SelectItem value="eth-zar">ETH/ZAR</SelectItem>
                          <SelectItem value="btc-usd">BTC/USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Date & Time Controls" 
                  description="Date selection and calendar components"
                  atomicLevel="molecule"
                  usage="Date filtering, scheduling, time-based data selection"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {calendarDate ? calendarDate.toDateString() : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={calendarDate}
                          onSelect={setCalendarDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Navigation Elements" 
                  description="Breadcrumbs and navigation aids"
                  atomicLevel="molecule"
                  usage="Page navigation, location awareness, hierarchical navigation"
                >
                  <div className="space-y-4">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/arbitrage">Arbitrage</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Live Opportunities</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Toggle Groups" 
                  description="Multiple toggle selection controls"
                  atomicLevel="molecule"
                  usage="View modes, filter selections, grouped options"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Chart Type</Label>
                      <ToggleGroup type="single" defaultValue="bar">
                        <ToggleGroupItem value="bar">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Bar
                        </ToggleGroupItem>
                        <ToggleGroupItem value="line">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Line
                        </ToggleGroupItem>
                        <ToggleGroupItem value="pie">
                          <PieChartIcon className="h-4 w-4 mr-2" />
                          Pie
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Range</Label>
                      <ToggleGroup type="single" defaultValue="1d">
                        <ToggleGroupItem value="1h">1H</ToggleGroupItem>
                        <ToggleGroupItem value="1d">1D</ToggleGroupItem>
                        <ToggleGroupItem value="1w">1W</ToggleGroupItem>
                        <ToggleGroupItem value="1m">1M</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Dropdown Menus" 
                  description="Action menus and context menus"
                  atomicLevel="molecule"
                  usage="Context actions, user menus, bulk operations"
                >
                  <div className="flex gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Actions
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Exchange Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Prices
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <User className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Logout</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Tooltips" 
                  description="Contextual help and information overlays"
                  atomicLevel="molecule"
                  usage="Help text, additional information, feature explanations"
                >
                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">
                          <Info className="h-4 w-4 mr-2" />
                          Hover for info
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This shows additional information</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Arbitrage spread threshold: 2%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* ORGANISMS - Complex Components */}
            <div id="organisms" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🧬 Organisms
                  <Badge variant="secondary">10 components</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Complex UI components made of groups of molecules and atoms working together to form distinct sections.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Cards & Content Containers" 
                  description="Flexible content containers with headers and actions"
                  atomicLevel="organism"
                  usage="Data display, feature highlights, grouped content"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bitcoin className="h-5 w-5 text-orange-500" />
                          BTC Arbitrage
                        </CardTitle>
                        <CardDescription>
                          Live arbitrage opportunities for Bitcoin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Best Spread:</span>
                            <span className="font-medium text-green-600">3.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Profit Potential:</span>
                            <span className="font-medium">R4,800</span>
                          </div>
                          <Button className="w-full mt-4">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-500" />
                          Market Activity
                        </CardTitle>
                        <CardDescription>
                          Real-time market statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Active Opportunities:</span>
                            <span className="font-medium">12</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Average Spread:</span>
                            <span className="font-medium">2.1%</span>
                          </div>
                          <Progress value={75} className="mt-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Data Tables" 
                  description="Structured data display with sorting and actions"
                  atomicLevel="organism"
                  usage="Data listings, reports, structured information"
                >
                  <div className="rounded-md border">
                    <Table>
                      <TableCaption>Live arbitrage opportunities</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Buy Exchange</TableHead>
                          <TableHead>Sell Exchange</TableHead>
                          <TableHead>Spread</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arbitrageData.map((opportunity, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {opportunity.name.split('→')[0]}
                            </TableCell>
                            <TableCell>{opportunity.name.split('→')[1]}</TableCell>
                            <TableCell>
                              <Badge variant={opportunity.spread > 2.5 ? "default" : "secondary"}>
                                {opportunity.spread}%
                              </Badge>
                            </TableCell>
                            <TableCell>R{opportunity.volume.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              R{opportunity.profit.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Alert Systems" 
                  description="User notifications and system alerts"
                  atomicLevel="organism"
                  usage="Status updates, warnings, error messages, success confirmations"
                >
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>New Arbitrage Opportunity</AlertTitle>
                      <AlertDescription>
                        A 3.2% spread opportunity detected between Binance and LUNO.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>
                        Unable to fetch prices from VALR. Retrying in 30 seconds.
                      </AlertDescription>
                    </Alert>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Modal Dialogs" 
                  description="Overlay dialogs for forms and confirmations"
                  atomicLevel="organism"
                  usage="Forms, confirmations, detailed views, settings"
                >
                  <div className="flex gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Open Settings</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Alert Settings</DialogTitle>
                          <DialogDescription>
                            Configure your arbitrage alert preferences.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="threshold" className="text-right">
                              Threshold
                            </Label>
                            <Input
                              id="threshold"
                              defaultValue="2.0"
                              className="col-span-3"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="email-alerts" />
                            <Label htmlFor="email-alerts">Email alerts</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Data</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            arbitrage history data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Sheet Panels" 
                  description="Slide-out panels for secondary content"
                  atomicLevel="organism"
                  usage="Filters, details panels, mobile navigation"
                >
                  <div className="flex gap-4">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">
                          <Menu className="h-4 w-4 mr-2" />
                          Open Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Filter Opportunities</SheetTitle>
                          <SheetDescription>
                            Customize which arbitrage opportunities to display.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label>Minimum Spread</Label>
                            <Slider defaultValue={[2]} max={10} step={0.1} />
                          </div>
                          <div className="space-y-2">
                            <Label>Exchanges</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="luno" defaultChecked />
                                <Label htmlFor="luno">LUNO</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="valr" defaultChecked />
                                <Label htmlFor="valr">VALR</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Tab Navigation" 
                  description="Sectioned content with tab navigation"
                  atomicLevel="organism"
                  usage="Multi-section content, settings panels, data views"
                >
                  <Tabs defaultValue="opportunities" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="opportunities" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Live Opportunities</h3>
                          <Badge>12 active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current arbitrage opportunities across all monitored exchanges.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="history" className="space-y-4">
                      <div className="grid gap-4">
                        <h3 className="text-lg font-medium">Trade History</h3>
                        <p className="text-sm text-muted-foreground">
                          Historical arbitrage data and performance analytics.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="space-y-4">
                      <div className="grid gap-4">
                        <h3 className="text-lg font-medium">Alert Settings</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure notification preferences and thresholds.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </ComponentDemo>

                <ComponentDemo 
                  label="Expandable Sections" 
                  description="Collapsible content sections and FAQ"
                  atomicLevel="organism"
                  usage="FAQ sections, detailed information, progressive disclosure"
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How does arbitrage detection work?</AccordionTrigger>
                      <AccordionContent>
                        Our system continuously monitors Bitcoin prices across multiple South African and international exchanges. When we detect a price difference (spread) that exceeds your threshold, we alert you to the opportunity.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>What exchanges are supported?</AccordionTrigger>
                      <AccordionContent>
                        We support major South African exchanges including LUNO, VALR, and AltcoinTrader, as well as international exchanges like Binance, Kraken, and Bitstamp for comprehensive arbitrage detection.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>How often are prices updated?</AccordionTrigger>
                      <AccordionContent>
                        Prices are updated every 30 seconds to ensure you have access to the most current arbitrage opportunities. Real-time updates help you act quickly on profitable spreads.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </ComponentDemo>
              </div>
            </div>

            {/* CHARTS & DATA VISUALIZATION */}
            <div id="charts" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  📊 Data Visualization
                  <Badge variant="secondary">8 components</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Chart components and data visualization elements using Recharts for displaying arbitrage data and market analytics.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Bar Charts - Arbitrage Spreads" 
                  description="Compare spreads across different exchange pairs"
                  atomicLevel="organism"
                  usage="Spread comparison, opportunity ranking, profit analysis"
                >
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={arbitrageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="name" 
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis className="text-xs" />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--card-foreground))'
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'spread' ? `${value}%` : `R${value.toLocaleString()}`,
                            name === 'spread' ? 'Spread' : 'Profit Potential'
                          ]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="spread" 
                          fill="hsl(var(--primary))" 
                          name="Spread %" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Line Charts - Performance Tracking" 
                  description="Track spread trends and profit over time"
                  atomicLevel="organism"
                  usage="Trend analysis, performance monitoring, historical data"
                >
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="spreads" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Opportunities"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          name="Profit (R)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Pie Charts - Exchange Distribution" 
                  description="Show market share and opportunity distribution"
                  atomicLevel="organism"
                  usage="Market share analysis, opportunity distribution, portfolio breakdown"
                >
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={exchangeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {exchangeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Area Charts - Volume Analysis" 
                  description="Display trading volume and market activity"
                  atomicLevel="organism"
                  usage="Volume tracking, market activity, cumulative data"
                >
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* DESIGN TOKENS */}
            <div id="tokens" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🎨 Design Tokens
                  <Badge variant="secondary">System Values</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Core design system values including colors, typography, spacing, and other foundational design decisions.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Color Palette" 
                  description="Theme colors and semantic color assignments"
                  atomicLevel="atom"
                  usage="Brand consistency, semantic meaning, accessibility"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <div className="h-16 bg-primary rounded-lg shadow-sm"></div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Primary</p>
                        <p className="text-xs text-muted-foreground">Brand color</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-16 bg-secondary rounded-lg shadow-sm"></div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Secondary</p>
                        <p className="text-xs text-muted-foreground">Supporting</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-16 bg-muted rounded-lg shadow-sm"></div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Muted</p>
                        <p className="text-xs text-muted-foreground">Subtle backgrounds</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-16 bg-destructive rounded-lg shadow-sm"></div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Destructive</p>
                        <p className="text-xs text-muted-foreground">Errors, warnings</p>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Typography Scale" 
                  description="Text sizing and hierarchy system"
                  atomicLevel="atom"
                  usage="Content hierarchy, readability, brand consistency"
                >
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-bold">Display Large - 36px</h1>
                      <h2 className="text-3xl font-bold">Heading 1 - 30px</h2>
                      <h3 className="text-2xl font-semibold">Heading 2 - 24px</h3>
                      <h4 className="text-xl font-semibold">Heading 3 - 20px</h4>
                      <h5 className="text-lg font-medium">Heading 4 - 18px</h5>
                      <h6 className="text-base font-medium">Heading 5 - 16px</h6>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-lg">Large text - 18px</p>
                      <p className="text-base">Body text - 16px</p>
                      <p className="text-sm">Small text - 14px</p>
                      <p className="text-xs">Extra small - 12px</p>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Spacing System" 
                  description="Consistent spacing and layout measurements"
                  atomicLevel="atom"
                  usage="Layout consistency, visual rhythm, component spacing"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 4, 8].map((size) => (
                        <div key={size} className="text-center">
                          <div className={`h-4 bg-primary rounded mb-2`} style={{ width: `${size * 4}px` }}></div>
                          <p className="text-xs">{size} ({size * 4}px)</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[12, 16, 20, 24].map((size) => (
                        <div key={size} className="text-center">
                          <div className={`h-4 bg-secondary rounded mb-2`} style={{ width: `${size * 4}px` }}></div>
                          <p className="text-xs">{size} ({size * 4}px)</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Border Radius" 
                  description="Consistent rounded corner values"
                  atomicLevel="atom"
                  usage="Visual consistency, modern design language"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { name: 'None', value: '0px', class: 'rounded-none' },
                      { name: 'Small', value: '2px', class: 'rounded-sm' },
                      { name: 'Default', value: '6px', class: 'rounded' },
                      { name: 'Large', value: '12px', class: 'rounded-lg' },
                    ].map((radius) => (
                      <div key={radius.name} className="text-center space-y-2">
                        <div className={`h-16 bg-primary ${radius.class}`}></div>
                        <div>
                          <p className="text-sm font-medium">{radius.name}</p>
                          <p className="text-xs text-muted-foreground">{radius.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* APPLICATION COMPONENTS */}
            <div id="app-components" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🚀 Application Components
                  <Badge variant="secondary">Custom Components</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Custom components built specifically for the crypto arbitrage platform functionality.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Alert Notification" 
                  description="Real-time popup notifications for arbitrage opportunities"
                  atomicLevel="organism"
                  usage="Live alerts, opportunity notifications, system messages"
                >
                  <div className="relative p-8 bg-muted/30 rounded-lg">
                    <div className="max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="relative">
                        <div className="absolute bottom-0 left-0 h-1 bg-primary w-3/4"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                        <div className="p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                              <div className="bg-green-100 rounded-full p-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="w-0 flex-1 pt-0.5">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">
                                  Arbitrage Opportunity!
                                </p>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 ml-auto -mr-1 -mt-1">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 bg-gray-50 rounded-md p-2">
                                <div className="flex items-center text-sm font-medium">
                                  <span>Binance</span>
                                  <ArrowUpRight className="mx-1 h-3 w-3 text-gray-500" />
                                  <span>LUNO</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="text-green-600 font-mono font-medium">R4,800</div>
                                  <Badge className="bg-green-100 text-green-800 text-xs">3.2%</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Price Heat Map Grid" 
                  description="Visual price comparison across exchanges with color coding"
                  atomicLevel="organism"
                  usage="Price comparison, market overview, exchange monitoring"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg p-4 shadow-sm bg-gradient-to-r from-green-50 to-green-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">LUNO</div>
                        <Badge variant="secondary" className="text-xs">ZAR</Badge>
                      </div>
                      <div className="text-lg font-bold">R1,982,029</div>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <div>≈ $109,890</div>
                        <div className="font-medium text-green-600">+2.1%</div>
                      </div>
                    </div>
                    <div className="rounded-lg p-4 shadow-sm bg-gradient-to-r from-blue-50 to-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">Binance</div>
                        <Badge variant="outline" className="text-xs">USD</Badge>
                      </div>
                      <div className="text-lg font-bold">$109,075</div>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <div></div>
                        <div className="font-medium text-blue-600">-1.8%</div>
                      </div>
                    </div>
                    <div className="rounded-lg p-4 shadow-sm bg-gradient-to-r from-gray-50 to-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">VALR</div>
                        <Badge variant="secondary" className="text-xs">ZAR</Badge>
                      </div>
                      <div className="text-lg font-bold">R1,974,169</div>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <div>≈ $109,450</div>
                        <div className="font-medium text-gray-600">-0.1%</div>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="User Menu Dropdown" 
                  description="User account navigation and profile management"
                  atomicLevel="molecule"
                  usage="User authentication, profile access, account settings"
                >
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="relative flex items-center gap-2 rounded-full h-8 w-8 p-0">
                          <Avatar className="h-8 w-8 border-2 border-primary/10">
                            <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">admin</p>
                            <p className="text-xs text-muted-foreground">admin@example.com</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Notifications</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <ArrowDownRight className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Exchange Rate Summary" 
                  description="Current USD/ZAR exchange rate display with timestamp"
                  atomicLevel="molecule"
                  usage="Currency conversion context, market data display"
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <span className="font-medium">USD/ZAR</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">R17.85</div>
                          <div className="text-xs text-muted-foreground">Updated 2 min ago</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ComponentDemo>

                <ComponentDemo 
                  label="Arbitrage Data Table" 
                  description="Live opportunities table with sorting and real-time updates"
                  atomicLevel="organism"
                  usage="Opportunity listing, data analysis, trading decisions"
                >
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Spread</TableHead>
                          <TableHead>Buy Price</TableHead>
                          <TableHead>Sell Price</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-green-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>Binance</span>
                              <ArrowUpRight className="h-3 w-3 text-gray-500" />
                              <span>LUNO</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">3.2%</Badge>
                          </TableCell>
                          <TableCell className="font-mono">$109,075</TableCell>
                          <TableCell className="font-mono">R1,982,029</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            R4,800
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>Kraken</span>
                              <ArrowUpRight className="h-3 w-3 text-gray-500" />
                              <span>VALR</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">2.8%</Badge>
                          </TableCell>
                          <TableCell className="font-mono">$109,220</TableCell>
                          <TableCell className="font-mono">R1,974,169</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            R3,920
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* PATTERNS */}
            <div id="patterns" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🧩 UI Patterns
                  <Badge variant="secondary">Application Specific</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Common UI patterns and combinations used throughout the crypto arbitrage platform.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Arbitrage Opportunity Card" 
                  description="Standard card layout for displaying arbitrage opportunities"
                  atomicLevel="organism"
                  usage="Opportunity listings, dashboard widgets, quick actions"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Binance → LUNO</CardTitle>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <CardDescription>BTC/ZAR Arbitrage</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Spread</p>
                            <p className="text-2xl font-bold text-green-600">3.2%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Profit</p>
                            <p className="text-2xl font-bold">R4,800</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Buy Price</p>
                            <p className="font-medium">R1,950,000</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sell Price</p>
                            <p className="font-medium">R2,012,400</p>
                          </div>
                        </div>
                        <Button className="w-full">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Execute Trade
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Kraken → VALR</CardTitle>
                          <Badge variant="secondary">Moderate</Badge>
                        </div>
                        <CardDescription>BTC/ZAR Arbitrage</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Spread</p>
                            <p className="text-2xl font-bold text-orange-600">2.8%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Profit</p>
                            <p className="text-2xl font-bold">R3,920</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Buy Price</p>
                            <p className="font-medium">R1,940,000</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sell Price</p>
                            <p className="font-medium">R1,994,320</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Exchange Status Dashboard" 
                  description="Real-time status monitoring for connected exchanges"
                  atomicLevel="organism"
                  usage="System monitoring, exchange health, connection status"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'LUNO', status: 'online', latency: '45ms', price: 'R1,982,029' },
                      { name: 'VALR', status: 'online', latency: '52ms', price: 'R1,974,169' },
                      { name: 'Binance', status: 'warning', latency: '120ms', price: 'R1,950,000' },
                    ].map((exchange) => (
                      <Card key={exchange.name}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{exchange.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                exchange.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                              )}></div>
                              <Badge variant={exchange.status === 'online' ? 'default' : 'secondary'}>
                                {exchange.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">BTC Price</span>
                              <span className="font-medium">{exchange.price}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Latency</span>
                              <span className="font-medium">{exchange.latency}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Refresh
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Filter & Search Panel" 
                  description="Advanced filtering and search interface"
                  atomicLevel="organism"
                  usage="Data filtering, search functionality, user preferences"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filter Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="search">Search</Label>
                          <Input
                            id="search"
                            placeholder="Search exchanges or pairs..."
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Spread</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select threshold" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1.0%</SelectItem>
                              <SelectItem value="2">2.0%</SelectItem>
                              <SelectItem value="3">3.0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Time Range</Label>
                          <ToggleGroup type="single" defaultValue="24h" className="justify-start">
                            <ToggleGroupItem value="1h">1H</ToggleGroupItem>
                            <ToggleGroupItem value="24h">24H</ToggleGroupItem>
                            <ToggleGroupItem value="7d">7D</ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Exchanges</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['LUNO', 'VALR', 'AltcoinTrader', 'Binance'].map((exchange) => (
                            <div key={exchange} className="flex items-center space-x-2">
                              <Checkbox id={exchange.toLowerCase()} defaultChecked />
                              <Label htmlFor={exchange.toLowerCase()} className="text-sm">
                                {exchange}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">Apply Filters</Button>
                        <Button variant="outline">Reset</Button>
                      </div>
                    </CardContent>
                  </Card>
                </ComponentDemo>
              </div>
            </div>

            {/* TEMPLATES */}
            <div id="templates" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  📄 Templates
                  <Badge variant="secondary">Layout Patterns</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Page layout templates and structural patterns used throughout the application.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Dashboard Layout" 
                  description="Main dashboard structure with sidebar and content area"
                  atomicLevel="template"
                  usage="Primary application layout, admin interfaces, user dashboards"
                >
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="grid grid-cols-4 gap-4 h-48">
                      <div className="bg-card border rounded p-3">
                        <div className="space-y-2">
                          <div className="h-3 bg-primary/20 rounded"></div>
                          <div className="h-2 bg-muted rounded w-3/4"></div>
                          <div className="h-2 bg-muted rounded w-1/2"></div>
                          <div className="h-2 bg-muted rounded w-2/3"></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-muted-foreground">Sidebar Nav</p>
                      </div>
                      <div className="col-span-3 bg-card border rounded p-3">
                        <div className="space-y-3">
                          <div className="h-4 bg-primary/20 rounded w-1/3"></div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="h-16 bg-muted rounded"></div>
                            <div className="h-16 bg-muted rounded"></div>
                            <div className="h-16 bg-muted rounded"></div>
                          </div>
                          <div className="h-20 bg-muted rounded"></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-muted-foreground">Main Content</p>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Data Table Page" 
                  description="Full-page data table with filters and actions"
                  atomicLevel="template"
                  usage="Data listing pages, reports, admin tables"
                >
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-4 h-48">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-primary/20 rounded w-1/4"></div>
                        <div className="h-8 bg-primary rounded w-20"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-8 bg-muted rounded flex-1"></div>
                        <div className="h-8 bg-muted rounded w-32"></div>
                        <div className="h-8 bg-muted rounded w-24"></div>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-6 bg-card border rounded"></div>
                        <div className="h-4 bg-muted/50 rounded"></div>
                        <div className="h-4 bg-muted/50 rounded"></div>
                        <div className="h-4 bg-muted/50 rounded"></div>
                      </div>
                    </div>
                    <p className="text-xs text-center mt-2 text-muted-foreground">Table with filters</p>
                  </div>
                </ComponentDemo>

                <ComponentDemo 
                  label="Settings Page" 
                  description="Tabbed settings interface with form sections"
                  atomicLevel="template"
                  usage="User preferences, configuration pages, admin settings"
                >
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-4 h-48">
                      <div className="h-4 bg-primary/20 rounded w-1/3"></div>
                      <div className="flex gap-1">
                        <div className="h-6 bg-primary rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-8 bg-card border rounded"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-8 bg-card border rounded"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-primary rounded w-24 ml-auto"></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-muted-foreground">Tabbed settings form</p>
                  </div>
                </ComponentDemo>
              </div>
            </div>

            {/* PAGES */}
            <div id="pages" className="space-y-8 scroll-mt-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                  🌐 Page Examples
                  <Badge variant="secondary">Complete Instances</Badge>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Complete page examples showing how all atomic design elements work together in the application.
                </p>
              </div>

              <div className="grid gap-8">
                <ComponentDemo 
                  label="Application Pages" 
                  description="Key pages in the crypto arbitrage platform"
                  atomicLevel="page"
                  usage="Complete user experiences, feature demonstrations"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Home className="h-5 w-5" />
                          Dashboard
                        </CardTitle>
                        <CardDescription>Main application dashboard</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>• Live arbitrage opportunities</p>
                          <p>• Market overview widgets</p>
                          <p>• Quick action buttons</p>
                          <p>• Performance charts</p>
                        </div>
                        <Button className="w-full mt-4" onClick={() => setLocation('/')}>
                          View Dashboard
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Admin Panel
                        </CardTitle>
                        <CardDescription>Administrative interface</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>• User management</p>
                          <p>• System monitoring</p>
                          <p>• Configuration settings</p>
                          <p>• Analytics & reports</p>
                        </div>
                        <Button className="w-full mt-4" onClick={() => setLocation('/admin')}>
                          View Admin
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </ComponentDemo>
              </div>
            </div>
          </div>

          {/* Footer Summary */}
          <Card className="mt-16 border-2">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Layers className="h-8 w-8 text-primary" />
                  <h3 className="text-2xl font-bold">Atomic Design System Complete</h3>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  This comprehensive UI library showcases all components organized by atomic design principles. 
                  Each component is properly categorized and documented for consistent usage across the crypto arbitrage platform.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">15</div>
                    <div className="text-sm text-muted-foreground">Atoms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Molecules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10</div>
                    <div className="text-sm text-muted-foreground">Organisms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">5</div>
                    <div className="text-sm text-muted-foreground">App Components</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">8</div>
                    <div className="text-sm text-muted-foreground">Charts</div>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <Badge variant="outline">Total Components: 50+</Badge>
                  <Badge variant="outline">Atomic Design Compliant</Badge>
                  <Badge variant="outline">100% Coverage</Badge>
                  <Badge variant="outline">Fully Responsive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
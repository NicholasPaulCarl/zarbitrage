import React, { useState } from 'react';
import {
  darkTheme,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  Modal,
  ConfirmModal,
  LineChart,
  Sparkline,
  BarChart,
  GroupedBarChart,
  type DataPoint,
  type BarData,
  type GroupedBarData,
  type SelectOption,
} from '../components/dark-ui';

// Sample data for charts
const lineChartData: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1),
  value: Math.sin(i / 5) * 50 + 100 + Math.random() * 20,
}));

const sparklineData = Array.from({ length: 20 }, () => Math.random() * 100);

const barChartData: BarData[] = [
  { label: 'BTC', value: 45000 },
  { label: 'ETH', value: 3200 },
  { label: 'SOL', value: 120 },
  { label: 'ADA', value: 0.45 },
  { label: 'DOT', value: 8.5 },
];

const groupedBarData: GroupedBarData[] = [
  {
    label: 'Q1',
    values: [
      { key: 'Binance', value: 450 },
      { key: 'Coinbase', value: 380 },
      { key: 'Kraken', value: 290 },
    ],
  },
  {
    label: 'Q2',
    values: [
      { key: 'Binance', value: 520 },
      { key: 'Coinbase', value: 420 },
      { key: 'Kraken', value: 310 },
    ],
  },
  {
    label: 'Q3',
    values: [
      { key: 'Binance', value: 480 },
      { key: 'Coinbase', value: 460 },
      { key: 'Kraken', value: 350 },
    ],
  },
  {
    label: 'Q4',
    values: [
      { key: 'Binance', value: 590 },
      { key: 'Coinbase', value: 510 },
      { key: 'Kraken', value: 420 },
    ],
  },
];

const selectOptions: SelectOption[] = [
  { value: 'btc', label: 'Bitcoin (BTC)' },
  { value: 'eth', label: 'Ethereum (ETH)' },
  { value: 'sol', label: 'Solana (SOL)' },
  { value: 'ada', label: 'Cardano (ADA)' },
  { value: 'dot', label: 'Polkadot (DOT)', disabled: true },
];

export function DarkUIShowcase() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleButtonClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{ backgroundColor: darkTheme.colors.background.primary }}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 
            className="text-5xl font-bold"
            style={{ color: darkTheme.colors.text.primary }}
          >
            Dark UI Component Library
          </h1>
          <p 
            className="text-xl"
            style={{ color: darkTheme.colors.text.secondary }}
          >
            Airbnb-inspired minimalist dark mode components with visx visualizations
          </p>
        </div>

        {/* Buttons Section */}
        <Card variant="bordered">
          <CardHeader 
            title="Buttons" 
            subtitle="Various button styles and states"
          />
          <CardContent>
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  Variants
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  Sizes
                </h3>
                <div className="flex items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  States
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button disabled>Disabled</Button>
                  <Button isLoading={isLoading} onClick={handleButtonClick}>
                    {isLoading ? 'Loading...' : 'Click to Load'}
                  </Button>
                  <Button icon={<span>🚀</span>}>With Icon</Button>
                  <Button icon={<span>→</span>} iconPosition="right">Icon Right</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" hoverable>
            <CardHeader title="Default Card" subtitle="With hover effect" />
            <CardContent>
              <p>This is a default card with hover effect. It scales slightly when hovered.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="ghost" fullWidth>Learn More</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated" glowOnHover>
            <CardHeader title="Elevated Card" subtitle="With shadow and glow" />
            <CardContent>
              <p>This card has elevation with shadow effects and glows on hover.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="primary" fullWidth>Get Started</Button>
            </CardFooter>
          </Card>

          <Card variant="glass">
            <CardHeader title="Glass Card" subtitle="Glassmorphic effect" />
            <CardContent>
              <p>This card features a modern glassmorphic design with blur effects.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" fullWidth>Explore</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Input Section */}
        <Card variant="bordered">
          <CardHeader 
            title="Form Inputs" 
            subtitle="Text inputs and textareas with floating labels"
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  hint="We'll never share your email"
                />

                <Input
                  label="Password"
                  type="password"
                  variant="filled"
                  icon={<span>🔒</span>}
                />

                <Input
                  label="Search"
                  placeholder="Type to search..."
                  variant="default"
                  icon={<span>🔍</span>}
                  floatingLabel={false}
                />

                <Input
                  label="Error State"
                  error="This field is required"
                  variant="default"
                />
              </div>

              <div className="space-y-4">
                <Textarea
                  label="Message"
                  rows={4}
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  hint="Maximum 500 characters"
                />

                <Textarea
                  label="Description"
                  variant="filled"
                  rows={4}
                  placeholder="Enter a description..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select & Modal Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="bordered">
            <CardHeader 
              title="Select Dropdown" 
              subtitle="Custom select component with dropdown"
            />
            <CardContent>
              <div className="space-y-4">
                <Select
                  label="Choose Cryptocurrency"
                  options={selectOptions}
                  value={selectedValue}
                  onChange={setSelectedValue}
                  placeholder="Select a cryptocurrency"
                />

                <Select
                  label="Filled Variant"
                  options={selectOptions}
                  variant="filled"
                  hint="Some options may be disabled"
                />

                <Select
                  label="With Error"
                  options={selectOptions}
                  error="Please select a valid option"
                />
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader 
              title="Modals" 
              subtitle="Dialog overlays and confirmations"
            />
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  onClick={() => setIsModalOpen(true)}
                  fullWidth
                >
                  Open Modal
                </Button>

                <Button 
                  variant="danger" 
                  onClick={() => setIsConfirmModalOpen(true)}
                  fullWidth
                >
                  Open Confirmation Modal
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    const modal = document.createElement('div');
                    modal.innerHTML = `
                      <div style="padding: 20px; text-align: center;">
                        <h3 style="color: ${darkTheme.colors.text.primary}; margin-bottom: 10px;">Success!</h3>
                        <p style="color: ${darkTheme.colors.text.secondary};">This is a quick notification modal</p>
                      </div>
                    `;
                    setIsModalOpen(true);
                    setTimeout(() => setIsModalOpen(false), 2000);
                  }}
                  fullWidth
                >
                  Quick Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Line Chart */}
          <Card variant="elevated">
            <CardHeader 
              title="Line Chart" 
              subtitle="Time series visualization with visx"
              action={
                <div className="flex items-center gap-2">
                  <span style={{ color: darkTheme.colors.text.tertiary }}>Sparkline:</span>
                  <Sparkline 
                    data={sparklineData} 
                    width={100} 
                    height={30} 
                    showArea
                  />
                </div>
              }
            />
            <CardContent>
              <div className="w-full" style={{ height: '300px' }}>
                <LineChart
                  data={lineChartData}
                  width={800}
                  height={300}
                  animate
                />
              </div>
            </CardContent>
          </Card>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="bordered">
              <CardHeader 
                title="Bar Chart" 
                subtitle="Vertical bar chart with hover effects"
              />
              <CardContent>
                <div className="w-full" style={{ height: '300px' }}>
                  <BarChart
                    data={barChartData}
                    width={400}
                    height={300}
                    animate
                    onBarClick={(data) => alert(`Clicked: ${data.label} - ${data.value}`)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader 
                title="Horizontal Bar Chart" 
                subtitle="Same data, horizontal layout"
              />
              <CardContent>
                <div className="w-full" style={{ height: '300px' }}>
                  <BarChart
                    data={barChartData}
                    width={400}
                    height={300}
                    horizontal
                    animate
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grouped Bar Chart */}
          <Card variant="glass">
            <CardHeader 
              title="Grouped Bar Chart" 
              subtitle="Multiple series comparison"
            />
            <CardContent>
              <div className="w-full" style={{ height: '350px' }}>
                <GroupedBarChart
                  data={groupedBarData}
                  keys={['Binance', 'Coinbase', 'Kraken']}
                  width={800}
                  height={350}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette */}
        <Card variant="bordered">
          <CardHeader title="Color Palette" subtitle="Theme colors used in the design system" />
          <CardContent>
            <div className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  Primary
                </h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.primary.main }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Main</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.primary.light }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Light</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.primary.dark }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Dark</p>
                  </div>
                </div>
              </div>

              {/* Status Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  Status
                </h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.status.success }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Success</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.status.warning }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Warning</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.status.error }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Error</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.status.info }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Info</p>
                  </div>
                </div>
              </div>

              {/* Background Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: darkTheme.colors.text.secondary }}>
                  Backgrounds
                </h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg border mb-2" 
                      style={{ 
                        backgroundColor: darkTheme.colors.background.primary,
                        borderColor: darkTheme.colors.border.primary 
                      }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Primary</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.background.secondary }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Secondary</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.background.tertiary }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Tertiary</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg mb-2" 
                      style={{ backgroundColor: darkTheme.colors.background.elevated }}
                    />
                    <p className="text-xs" style={{ color: darkTheme.colors.text.tertiary }}>Elevated</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Components */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p style={{ color: darkTheme.colors.text.primary }}>
            This is a beautiful modal component with dark mode styling inspired by Airbnb's design system.
          </p>
          <p style={{ color: darkTheme.colors.text.secondary }}>
            It features smooth animations, backdrop blur, and responsive sizing options. The modal can be closed
            by clicking the X button, pressing Escape, or clicking outside the modal area.
          </p>
          <Card variant="glass">
            <CardContent>
              <p>You can even nest other components inside modals!</p>
            </CardContent>
          </Card>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          alert('Action confirmed!');
          setIsConfirmModalOpen(false);
        }}
        title="Delete Item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 
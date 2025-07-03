import { useState } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Webhook, 
  BookOpen, 
  TrendingUp, 
  Bell, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function PremiumPage() {
  const { user, isAuthenticated } = useAuth();

  // Premium features configuration
  const premiumFeatures = [
    {
      id: 'calculator',
      title: 'Advanced Calculator',
      description: 'Calculate potential profits, fees, and optimal trade amounts for arbitrage opportunities',
      icon: <BarChart3 className="h-6 w-6" />,
      path: '/calculator',
      benefits: [
        'Profit margin calculations',
        'Fee estimation tools',
        'Trade size optimization',
        'Risk assessment metrics'
      ]
    },
    {
      id: 'browser-alerts',
      title: 'Browser Alerts',
      description: 'Get instant browser notifications when profitable arbitrage opportunities are detected',
      icon: <Bell className="h-6 w-6" />,
      path: '/alerts',
      benefits: [
        'Real-time browser notifications',
        'Customizable alert thresholds',
        'Sound notification options',
        'Desktop popup alerts'
      ]
    },
    {
      id: 'webhook-alerts',
      title: 'Webhook Alerts',
      description: 'Get instant notifications via webhooks when arbitrage opportunities exceed your threshold',
      icon: <Webhook className="h-6 w-6" />,
      path: '/webhook-alerts',
      benefits: [
        'Real-time webhook notifications',
        'Custom payload support',
        'Multiple webhook endpoints',
        'HTTP method configuration'
      ]
    },
    {
      id: 'trade-journal',
      title: 'Trade Journal',
      description: 'Track your arbitrage trades, analyze performance, and optimize your strategy',
      icon: <BookOpen className="h-6 w-6" />,
      path: '/trade-journal',
      benefits: [
        'Complete trade tracking',
        'Profit/loss analysis',
        'Performance metrics',
        'Export capabilities'
      ]
    },
    {
      id: 'feature-requests',
      title: 'Feature Requests',
      description: 'Submit and vote on new features to shape the future of the platform',
      icon: <TrendingUp className="h-6 w-6" />,
      path: '/feature-requests',
      benefits: [
        'Submit feature suggestions',
        'Vote on community requests',
        'Track development progress',
        'Direct developer feedback'
      ]
    }
  ];

  const allFeatures = [
    'Real-time arbitrage opportunities',
    'Browser push notifications',
    'Advanced calculator tools',
    'Historical spread data',
    'Multiple exchange monitoring',
    'Customizable alert thresholds'
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Crown className="h-12 w-12 text-amber-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Premium Features
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock advanced tools and notifications to maximize your crypto arbitrage potential
          </p>
        </div>

        {/* Subscription Status */}
        {isAuthenticated && user && (
          <Card className={`border-2 ${user.subscriptionActive ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center ${user.subscriptionActive ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {user.subscriptionActive ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <Crown className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${user.subscriptionActive ? 'text-green-800' : 'text-amber-800'}`}>
                      Welcome {user.username}! 
                      {user.subscriptionActive ? ' Premium Active' : ' Account Created Successfully'}
                    </h3>
                    <p className={`text-sm ${user.subscriptionActive ? 'text-green-700' : 'text-amber-700'}`}>
                      {user.subscriptionActive 
                        ? `You have full access to all premium features below${user.subscriptionExpires ? ` until ${new Date(user.subscriptionExpires).toLocaleDateString()}` : ''}`
                        : 'Complete your payment to activate premium features and start earning more from arbitrage opportunities'
                      }
                    </p>
                  </div>
                </div>
                {!user.subscriptionActive && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/profile">
                      <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Complete Payment
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Progress indicator for non-premium users */}
              {!user.subscriptionActive && (
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-green-700 font-medium">Account Created</span>
                    </div>
                    <div className="flex-1 h-1 bg-amber-200 mx-4 rounded-full">
                      <div className="h-1 bg-green-500 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-amber-700 font-medium">Premium Payment</span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    You're halfway there! Complete your payment to unlock all premium features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Premium Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {premiumFeatures.map((feature) => (
            <Card key={feature.id} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t">
                  <Link href={feature.path}>
                    <Button 
                      variant="outline" 
                      className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      disabled={!isAuthenticated || !user?.subscriptionActive}
                    >
                      {!isAuthenticated || !user?.subscriptionActive ? (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Premium Required
                        </>
                      ) : (
                        <>
                          Access {feature.title}
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              Free Features Included
            </CardTitle>
            <CardDescription>
              All users get access to these powerful arbitrage tools at no cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allFeatures.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        {!isAuthenticated && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 text-center">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
              <p className="text-muted-foreground">
                Create an account to access premium features and maximize your arbitrage profits
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    Sign Up Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">
                    Already have an account? Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
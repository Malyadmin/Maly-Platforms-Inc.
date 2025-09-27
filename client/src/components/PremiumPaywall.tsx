import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Filter, MapPin, Heart, Mail } from "lucide-react";

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'filtering' | 'messaging';
}

export default function PremiumPaywall({ isOpen, onClose, feature = 'filtering' }: PremiumPaywallProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const featureConfig = {
    filtering: {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Filter by gender and location to find exactly who you\'re looking for',
      features: [
        { icon: Heart, color: 'text-pink-500', text: 'Filter by gender preferences' },
        { icon: MapPin, color: 'text-blue-500', text: 'Search by specific locations' },
        { icon: Crown, color: 'text-yellow-500', text: 'Unlimited premium features' }
      ]
    },
    messaging: {
      icon: Mail,
      title: 'Direct Messaging',
      description: 'Send private messages to your connections and start meaningful conversations',
      features: [
        { icon: Mail, color: 'text-blue-500', text: 'Send unlimited messages' },
        { icon: Heart, color: 'text-pink-500', text: 'Connect with verified users' },
        { icon: Crown, color: 'text-yellow-500', text: 'Access all premium features' }
      ]
    }
  };

  const config = featureConfig[feature];
  const FeatureIcon = config.icon;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/premium/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionType: 'monthly' })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black text-white border-gray-800 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold text-center flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Premium Feature
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Feature explanation */}
          <div className="text-center">
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <FeatureIcon className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">{config.title}</h3>
              <p className="text-gray-400 text-sm">
                {config.description}
              </p>
            </div>
          </div>

          {/* Premium features list */}
          <div className="space-y-3">
            {config.features.map((featureItem, index) => {
              const IconComponent = featureItem.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <IconComponent className={`h-5 w-5 ${featureItem.color} flex-shrink-0`} />
                  <span className="text-sm">{featureItem.text}</span>
                </div>
              );
            })}
          </div>

          {/* Pricing */}
          <div className="bg-purple-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">$29<span className="text-lg font-normal text-gray-400">/month</span></div>
            <p className="text-sm text-gray-400 mt-1">Cancel anytime</p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              data-testid="upgrade-to-premium-button"
            >
              {isUpgrading ? "Redirecting..." : "Upgrade to Premium"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
              onClick={onClose}
              data-testid="maybe-later-button"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
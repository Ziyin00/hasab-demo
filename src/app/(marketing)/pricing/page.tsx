import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for trying out our services",
    features: ["60 minutes transcription/mo", "Basic translation", "Standard TTS voices", "Email support"],
    buttonText: "Start for Free",
    premium: false,
  },
  {
    name: "Professional",
    price: "$29",
    description: "Best for individual creators and small teams",
    features: ["600 minutes transcription/mo", "Advanced translation models", "Premium TTS voices", "Smart Meeting Minutes", "Priority support"],
    buttonText: "Get Started",
    premium: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom needs",
    features: ["Unlimited transcription", "API access", "Custom model training", "Dedicated account manager", "SLA guarantee"],
    buttonText: "Contact Sales",
    premium: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that matches your production needs. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative flex flex-col ${plan.premium ? "border-primary shadow-lg scale-105" : ""}`}>
            {plan.premium && (
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.premium ? "default" : "outline"}>
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

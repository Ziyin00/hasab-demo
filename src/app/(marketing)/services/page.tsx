import { FileText, Languages, Mic2, Subtitles, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    title: "AI Transcription",
    description: "Convert audio and video to text with 99%+ accuracy and speaker diarization.",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    title: "Global Translation",
    description: "Translate your content into over 120 languages instantly while preserving context.",
    icon: Languages,
    color: "text-purple-500",
  },
  {
    title: "Neural Text to Speech",
    description: "Generate human-like speech from any text with our library of emotional voices.",
    icon: Mic2,
    color: "text-orange-500",
  },
  {
    title: "Meeting Intelligence",
    description: "Automatically generate summaries, highlights, and action items from your meetings.",
    icon: Users,
    color: "text-green-500",
  },
  {
    title: "Smart Subtitles",
    description: "Generate and burn stylish captions into your videos for social media success.",
    icon: Subtitles,
    color: "text-pink-500",
  },
  {
    title: "Real-time API",
    description: "Integrate our AI capabilities directly into your own applications and workflows.",
    icon: Zap,
    color: "text-yellow-500",
  },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Our Services</h1>
        <p className="text-xl text-muted-foreground">
          Cutting-edge AI tools designed to multiply your productivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 ${service.color}`}>
                <service.icon className="w-6 h-6" />
              </div>
              <CardTitle>{service.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

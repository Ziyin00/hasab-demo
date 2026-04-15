import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
            <p className="text-xl text-muted-foreground mb-12">
              Have questions about Hasab AI? Our team is here to help you amplify your content production.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-muted-foreground">support@hasab.ai</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-muted-foreground">+1 (555) 000-0000</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-8 rounded-2xl border">
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="m@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="How can we help?" className="min-h-[150px]" />
              </div>
              <Button className="w-full py-6 text-lg font-semibold">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">About Hasab AI</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We are on a mission to break language barriers and amplify human productivity using the world&apos;s most advanced neural networks.
          </p>
        </div>

        <div className="aspect-video bg-muted rounded-3xl flex items-center justify-center">
           <p className="text-muted-foreground italic text-lg">[ Brand Video Placeholder ]</p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Our Vision</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Founded in 2024, Hasab AI started with a simple belief: that high-quality AI tools should be accessible to everyone, from solo creators to global enterprises. We focus on speed, accuracy, and intuitive design to help you get more done in less time.
          </p>
        </section>
      </div>
    </div>
  );
}

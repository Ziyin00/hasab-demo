export const Footer = () => {
  return (
    <footer className="py-12 border-t mt-auto">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Hasab AI</h3>
          <p className="text-sm text-muted-foreground">
            The intelligent audio and video platform for the modern creator.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Product</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li><a href="/services">Services</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Company</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Legal</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

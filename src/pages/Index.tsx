import LoginCard from "@/components/LoginCard";

const Index = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Gradient background */}
      <div className="absolute inset-0">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

        {/* Subtle radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/5 blur-3xl animate-pulse-subtle" />
        <div
          className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-primary/5 blur-3xl animate-pulse-subtle"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-primary/3 blur-2xl animate-pulse-subtle"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-8">
        <LoginCard />
      </div>
    </div>
  );
};

export default Index;

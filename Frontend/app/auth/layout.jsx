export default function AuthLayout({ children, }) {
    return (<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo and Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">IronVault</h1>
        <p className="text-muted-foreground text-sm">
          Secure Transaction Banking with ACID Guarantees
        </p>
      </div>

      {/* Auth Form Container */}
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by industry-standard encryption and ACID-compliant transactions
        </p>
      </div>
    </div>);
}

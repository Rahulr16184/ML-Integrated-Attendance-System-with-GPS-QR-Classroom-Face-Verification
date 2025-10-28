
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, QrCode, UserCheck } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';

const features = [
  {
    icon: <UserCheck className="w-8 h-8 text-primary animate-blink-soft" />,
    title: 'Facial Recognition',
    description: 'Log attendance seamlessly with our cutting-edge facial recognition technology. Fast, secure, and touch-free.',
  },
  {
    icon: <MapPin className="w-8 h-8 text-primary animate-blink-soft [animation-delay:0.2s]" />,
    title: 'GPS Geofencing',
    description: 'Ensure attendance is marked only within designated areas like your campus or office using precise GPS geofencing.',
  },
  {
    icon: <QrCode className="w-8 h-8 text-primary animate-blink-soft [animation-delay:0.4s]" />,
    title: 'QR Code Scanning',
    description: 'A quick and reliable backup for attendance verification. Generate dynamic QR codes for secure check-ins.',
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary animate-blink-soft [animation-delay:0.6s]" />,
    title: 'Automated Records',
    description: 'All attendance data is automatically logged and organized, making reporting and management effortless for administrators.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Intelligent Attendance, Simplified.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  TRACEIN integrates facial recognition, GPS, and QR codes into one seamless platform for effortless and accurate attendance management.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-12 md:py-24 lg:py-32">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for Modern Attendance</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be flexible, secure, and easy to use for students, teachers, and administrators alike.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardHeader className="flex flex-col items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-muted/20">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 py-12 md:py-24 lg:py-32">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Modernize Your Attendance System?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Create an account or log in to explore the features and see how TRACEIN can transform your institution.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-x-2">
              <Button asChild>
                <Link href="/register">Sign Up Now</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} TRACEIN. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

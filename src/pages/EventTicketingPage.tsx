import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Ticket, TrendingUp, Users, Mail, Share2, BarChart3, 
  Smartphone, Calendar, Lock, Zap, Globe, CheckCircle2,
  ArrowRight, Download, Play
} from "lucide-react";
import { Link } from "react-router-dom";
import Layout from '@/components/layout/Layout';

const EventTicketingPage = () => {
  const features = [
    {
      icon: Ticket,
      title: "Easy Event Creation & Ticketing",
      description: "Create and publish your event in seconds. Sell tickets for in-person and virtual events with our intuitive platform."
    },
    {
      icon: Globe,
      title: "Attendee Discovery",
      description: "Get discovered by millions of active event-goers searching for unique experiences in our marketplace."
    },
    {
      icon: Share2,
      title: "Social Media Integration",
      description: "Share your events directly to Facebook, LinkedIn, and other platforms to maximize your reach."
    },
    {
      icon: Mail,
      title: "Email Marketing Tools",
      description: "Send unlimited emails to your community with open rates 59% higher than industry average."
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track sales, understand your audience, and make data-driven decisions with detailed insights."
    },
    {
      icon: Zap,
      title: "Flexible Payouts",
      description: "Get paid on your schedule with customizable payout options via Mobile Money or bank transfer."
    }
  ];

  const stats = [
    { number: "90M+", label: "Active Ticket-Buyers" },
    { number: "30%", label: "Tickets Driven by Platform" },
    { number: "6X", label: "Average ROI on Ads" },
    { number: "59%", label: "Higher Email Open Rates" }
  ];

  const benefits = [
    "Free event creation and publishing",
    "Customizable event pages",
    "Secure payment processing",
    "Mobile check-in app",
    "Promo codes and discounts",
    "Automated attendee notifications",
    "Real-time sales tracking",
    "7-day secure fund holding"
  ];

  const faqs = [
    {
      question: "Is it free to use SkillPulse Event Ticketing?",
      answer: "Yes! Creating and publishing events is completely free. We only charge a small service fee of 8% on paid tickets, plus standard payment processing fees (2.9% + taxes)."
    },
    {
      question: "How do payouts work?",
      answer: "Funds are held securely for 7 days after purchase, then moved to your available balance. You can withdraw anytime via Mobile Money (19 African countries) or bank transfer."
    },
    {
      question: "What's included with the platform?",
      answer: "Event creation tools, customizable pages, ticket sales, email marketing, social sharing, analytics, mobile check-in app, attendee management, and secure payment processing."
    },
    {
      question: "How can I maximize ticket sales?",
      answer: "Use our built-in marketing tools: email campaigns, social media sharing, early bird discounts, and leverage our marketplace where millions discover events daily."
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-purple-50">
  {/* Hero Section with New Image */}
  <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-purple-600 text-white">
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: 'url("https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/rsz_couples-celebrating-birthday_1.jpg")'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 to-purple-600/80 mix-blend-multiply"></div>
    </div>
    
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6TTE0IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMzIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
    
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
          <Ticket className="h-5 w-5 text-orange-400" />
          <span className="text-sm font-medium">Leading Event Ticketing Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
          Sell Tickets Now on{" "}
          <span className="bg-gradient-to-r from-orange-200 to-purple-200 bg-clip-text text-transparent">
            SkillPulse Events
          </span>
        </h1>
        
        <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto animate-fade-in">
          An all-in-one ticketing and marketing platform that offers great value for your money. 
          Create events and sell tickets for free, and reach the right audience across Africa.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Link to="/auth">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              Contact Sales
            </Button>
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-200 to-purple-200 bg-clip-text text-transparent">
                {stat.number}
              </div>
              <div className="text-sm text-white/80 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Tools to Get Your Tickets Selling Faster
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                SkillPulse powers thousands of events across Africa with industry-leading tools 
                and technology to create, manage, and promote unforgettable experiences.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-purple-200 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Everything You Need to Host Standout Events
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Create, promote, and manage successful events with our comprehensive toolkit. 
                  From ticket sales to attendee engagement, we've got you covered.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="mt-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg">
                  Create Your Event
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
                <Card className="relative p-8 bg-white/80 backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-100 to-purple-100 rounded-xl">
                      <Lock className="h-8 w-8 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Secure Transactions</h4>
                        <p className="text-sm text-gray-600">7-day fund holding for security</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">92% Creator Earnings</h4>
                        <p className="text-sm text-gray-600">Only 8% platform fee</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-100 to-purple-100 rounded-xl">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Reach Millions</h4>
                        <p className="text-sm text-gray-600">90M+ active event-goers</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

       {/* Mobile App Section */}
<section className="py-20 bg-gradient-to-r from-orange-500 to-purple-600 text-white relative overflow-hidden">
  {/* Background Image with Overlay */}
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: 'url("https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/pexels-olly-3769021.jpg")'
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-purple-600/90"></div>
  </div>
  
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6TTE0IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
  
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
        <Smartphone className="h-5 w-5 text-white" />
        <span className="text-sm font-medium">Manage Events On-The-Go</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        Download the SkillPulse Mobile App
      </h2>
      <p className="text-xl text-white/90 max-w-2xl mx-auto">
        Create events, sell tickets, check-in attendees, and track sales in real-time from anywhere.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Create & Manage Events</h3>
              <p className="text-white/80">Set up your event, manage tickets, and update details on the go.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Instant Check-Ins</h3>
              <p className="text-white/80">Scan QR codes and check in attendees seamlessly at the door.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Analytics</h3>
              <p className="text-white/80">Monitor ticket sales and attendance data as it happens.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* App Download CTA */}
      <div className="text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold mb-4">Get the App Today</h3>
          <p className="text-white/80 mb-6">
            Available on both iOS and Android platforms. Start managing your events from anywhere.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/download-ios">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" />
                Download on iOS
              </Button>
            </Link>
            <Link to="/download-android">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                Get it on Android
              </Button>
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-white/80">
            Available for iOS and Android • Free Download
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* CTA Section */}
<section className="py-20 bg-gradient-to-r from-orange-500 to-purple-600 text-white">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="text-4xl md:text-5xl font-bold mb-6">
      Ready to Start Selling Tickets?
    </h2>
    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
      Join thousands of event creators across Africa who trust SkillPulse to power their events.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/auth">
        <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl">
          Get Started for Free
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
      <Link to="/contact">
        <Button size="lg" variant="secondary" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
          Contact Sales Team
        </Button>
      </Link>
    </div>

    <p className="mt-6 text-sm text-white/80">
      No credit card required • Free to start • Cancel anytime
    </p>
  </div>
</section>
      </div>
    </Layout>
  );
};

export default EventTicketingPage;

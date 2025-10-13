import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Ticket, TrendingUp, Users, Mail, Share2, BarChart3, 
  Smartphone, Calendar, Lock, Zap, Globe, CheckCircle2,
  ArrowRight, Download, Play
} from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-purple-900 to-orange-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6TTE0IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Ticket className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-medium">Leading Event Ticketing Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Sell Tickets Now on{" "}
              <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                SkillPulse Events
              </span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto animate-fade-in">
              An all-in-one ticketing and marketing platform that offers great value for your money. 
              Create events and sell tickets for free, and reach the right audience across Africa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Contact Sales
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-300 mt-2">{stat.label}</div>
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
      <section className="py-20 bg-gradient-to-br from-[#1e1b4b] via-purple-900 to-orange-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6TTE0IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMCA0MGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Smartphone className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-medium">Manage Events On-The-Go</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-4">
              Download the SkillPulse Mobile App
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Create events, sell tickets, check-in attendees, and track sales in real-time from anywhere.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Create & Manage Events</h3>
                    <p className="text-gray-300">Set up your event, manage tickets, and update details on the go.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Instant Check-Ins</h3>
                    <p className="text-gray-300">Scan QR codes and check in attendees seamlessly at the door.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Real-Time Analytics</h3>
                    <p className="text-gray-300">Monitor ticket sales and attendance data as it happens.</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-64 h-64 rounded-3xl bg-gradient-to-br from-orange-500/20 to-purple-600/20 backdrop-blur-sm border-2 border-white/20 mb-8 mx-auto">
                <Smartphone className="h-32 w-32 text-white/80" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 shadow-xl">
                  <Download className="mr-2 h-5 w-5" />
                  Download on iOS
                </Button>
                <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 shadow-xl">
                  <Play className="mr-2 h-5 w-5" />
                  Get it on Android
                </Button>
              </div>

              <p className="mt-6 text-sm text-gray-300">
                Available for iOS and Android • Free Download
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Transparent & Fair Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            No hidden fees. Only pay when you earn. Free events stay free.
          </p>

          <Card className="p-8 md:p-12 bg-gradient-to-br from-purple-50 to-orange-50 border-2 border-purple-200">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-3">
                  8%
                </div>
                <div className="text-sm text-gray-600 font-medium">Platform Fee</div>
                <p className="text-xs text-gray-500 mt-2">On paid tickets only</p>
              </div>
              
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-orange-600 bg-clip-text text-transparent mb-3">
                  92%
                </div>
                <div className="text-sm text-gray-600 font-medium">You Keep</div>
                <p className="text-xs text-gray-500 mt-2">Creator earnings</p>
              </div>
              
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-3">
                  2.9%
                </div>
                <div className="text-sm text-gray-600 font-medium">Processing Fee</div>
                <p className="text-xs text-gray-500 mt-2">+ taxes per order</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white/60 rounded-xl border border-purple-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Lock className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">7-Day Secure Holding</h3>
              </div>
              <p className="text-gray-600">
                Funds are securely held for 7 days after purchase, then moved to your available balance. 
                Withdraw anytime via Mobile Money (19 African countries) or bank transfer.
              </p>
            </div>
          </Card>

          <Link to="/pricing">
            <Button size="lg" className="mt-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              Learn More About Pricing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#1e1b4b] via-purple-900 to-orange-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Selling Tickets?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of event creators across Africa who trust SkillPulse to power their events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              Contact Sales Team
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-300">
            No credit card required • Free to start • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default EventTicketingPage;

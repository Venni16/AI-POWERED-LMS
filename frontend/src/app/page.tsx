'use client';

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { ParticleTextEffect } from '../../components/Ui/particle-text-effect';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Brain, Users, Shield, TrendingUp, Video, Sparkles, ArrowRight, Play, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'student': return '/student';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements - Reduced size/blur for mobile performance/aesthetic */}
      

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 md:py-0">
        {/* Floating Elements - Adjusted positioning for responsiveness */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-10 left-5 w-10 h-10 md:w-16 md:h-16 bg-gray-200 rounded-xl opacity-30 blur-sm"
        />
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-20 right-5 w-8 h-8 md:w-12 md:h-12 bg-gray-300 rounded-full opacity-40 blur-sm"
        />
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 left-1/4 w-6 h-6 md:w-8 md:h-8 bg-gray-400 rounded-lg opacity-35 blur-sm"
        />

        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >

            <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl md:rounded-3xl mt-8 p-6 md:p-12 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center justify-center gap-2 mb-4 md:mb-6"
              >
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-gray-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Next-Gen Learning Platform</span>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-gray-600 animate-pulse" />
              </motion.div>
              
              <ParticleTextEffect
                words={["AI-POWERED-LMS","AI-Powered", "Learning","Management System","With","Video Summarization","Course Recommendations","Real-Time Chat"]}
                className="mx-auto mb-4 md:mb-6"
              />
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light"
              >
                Experience the future of education with{" "}
                <span className="font-semibold text-black">
                  AI-driven video summarization
                </span>
                , personalized course recommendations, and intelligent learning analytics.
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pt-4 md:pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group w-full sm:w-auto"
            >
              <Link
                href={getDashboardLink()}
                className="relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-semibold text-white bg-black hover:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  {user ? 'Go to Dashboard' : 'Get Started'}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-16 max-w-4xl mx-auto"
          >
            {[
              { number: "10K+", label: "Active Students", icon: Users },
              { number: "500+", label: "Expert Instructors", icon: Brain },
              { number: "95%", label: "Success Rate", icon: TrendingUp }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                className="text-center group bg-white/70 p-4 rounded-xl shadow-md"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gray-100 hover:bg-gray-200 rounded-xl md:rounded-2xl mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-black" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-black mb-1">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 md:px-6 md:py-3 rounded-full mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black" />
              <span className="text-sm md:text-base text-black font-semibold">Advanced AI Features</span>
            </motion.div>
            <h2 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 text-black">
              Powered by Intelligence
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Enhance your learning experience with cutting-edge AI technology that adapts to your unique learning style
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { 
                icon: Brain, 
                title: "AI Video Summarization", 
                desc: "Automatically generate concise summaries and key points from course videos using advanced NLP"
              },
              { 
                icon: TrendingUp, 
                title: "Personalized Recommendations", 
                desc: "Get course suggestions tailored to your interests and learning history"
              },
              { 
                icon: Shield, 
                title: "Role-Based Access", 
                desc: "Secure dashboards for Students, Instructors, and Admins with specific permissions"
              },
              { 
                icon: Users, 
                title: "Real-Time Collaboration", 
                desc: "Connect with instructors and fellow students through integrated chat"
              },
              { 
                icon: BookOpen, 
                title: "Course Management", 
                desc: "Easy-to-use tools for creating, organizing, and tracking course progress"
              },
              { 
                icon: Video, 
                title: "Analytics Dashboard", 
                desc: "Track engagement, monitor progress, and analyze learning patterns"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="h-full transition-all duration-500 hover:shadow-2xl border border-gray-200 shadow-lg bg-white hover:bg-gray-50 overflow-hidden relative">
                  <CardHeader className="text-center relative z-10 pb-6">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="mx-auto mb-4 md:mb-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 shadow-lg transition-colors duration-300"
                    >
                      <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-black group-hover:text-gray-900 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base leading-relaxed text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-black transition-all duration-500"></div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 md:px-6 md:py-3 rounded-full mb-4 md:mb-6 shadow-lg"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5 text-black" />
              <span className="text-sm md:text-base text-black font-semibold">Built for Everyone</span>
            </motion.div>
            <h2 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 text-black">
              Tailored Experiences
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Designed with specific workflows and features for every type of user in the learning ecosystem
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Students",
                icon: BookOpen,
                features: [
                  "Access AI-generated course summaries",
                  "Receive personalized recommendations",
                  "Track your learning progress",
                  "Chat with instructors"
                ]
              },
              {
                title: "Instructors",
                icon: Brain,
                features: [
                  "Upload and manage course videos",
                  "View AI-generated summaries",
                  "Monitor student engagement",
                  "Manage course content"
                ]
              },
              {
                title: "Administrators",
                icon: Shield,
                features: [
                  "Verify instructor accounts",
                  "Manage users and permissions",
                  "Monitor system logs",
                  "Access platform analytics"
                ]
              }
            ].map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full transition-all duration-500 hover:shadow-2xl border border-gray-200 shadow-xl bg-white hover:bg-gray-50 relative overflow-hidden">
                  <CardHeader className="text-center relative z-10 pb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="mx-auto mb-4 md:mb-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 shadow-lg transition-colors duration-300"
                    >
                      <role.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-black mb-4 md:mb-6">
                      {role.title}
                    </CardTitle>
                  </CardHeader>
                  <div className="p-4 md:p-6 space-y-3 relative z-10">
                    {role.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: (index * 0.2) + (i * 0.1) }}
                        viewport={{ once: true }}
                        className="flex items-center group-hover:translate-x-1 transition-transform duration-300"
                      >
                        <div className="w-2 h-2 bg-black rounded-full mr-3 flex-shrink-0 shadow-sm"></div>
                        <span className="text-sm md:text-base text-gray-700 font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black text-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-white" />
                <span className="text-xl font-bold">AI-POWERED-LMS</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                Revolutionizing education with AI-driven video summarization, personalized learning paths, and intelligent analytics for the future of online learning.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <BookOpen className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Brain className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Users className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/courses" className="text-gray-400 hover:text-white transition-colors duration-300">Courses</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors duration-300">Support</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-300">Help Center</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-300">FAQ</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-8 md:mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 AI-POWERED-LMS. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span className="text-gray-400 text-sm">for education</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

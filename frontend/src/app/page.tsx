'use client';

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { ParticleTextEffect } from '../../components/Ui/particle-text-effect';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Brain, Users, Shield, TrendingUp, Video } from "lucide-react";
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
        <div className="container mx-auto w-full text-center space-y-6 overflow-hidden py-15">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/90 backdrop-blur-sm pt-4 pb-4 px-4 md:px-8 rounded-2xl shadow-xl mt-13 border border-gray-200"
          >
            <ParticleTextEffect
              words={["AI-POWERED-LMS","AI-Powered", "Learning","Management System","With","Video Summarization","Course Recommendations"]}
              className="mx-auto"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Experience the future of education with AI-driven video summarization,
            personalized course recommendations, and intelligent learning analytics.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl shadow-lg overflow-hidden"
            >
              <Link
                href={getDashboardLink()}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-black hover:bg-gray-800 transition-all duration-300 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Advanced AI Features
            </h2>
            <p className="text-muted-foreground text-lg">
              Enhance your learning experience with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Video Summarization", desc: "Automatically generate concise summaries and key points from course videos using advanced NLP" },
              { icon: TrendingUp, title: "Personalized Recommendations", desc: "Get course suggestions tailored to your interests and learning history" },
              { icon: Shield, title: "Role-Based Access", desc: "Secure dashboards for Students, Instructors, and Admins with specific permissions" },
              { icon: Users, title: "Real-Time Collaboration", desc: "Connect with instructors and fellow students through integrated chat" },
              { icon: BookOpen, title: "Course Management", desc: "Easy-to-use tools for creating, organizing, and tracking course progress" },
              { icon: Video, title: "Analytics Dashboard", desc: "Track engagement, monitor progress, and analyze learning patterns" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300"
                    >
                      <feature.icon className="h-8 w-8 text-primary" />
                    </motion.div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground text-lg">
              Tailored experiences for different user roles
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Students",
                features: [
                  "Access AI-generated course summaries",
                  "Receive personalized recommendations",
                  "Track your learning progress",
                  "Chat with instructors"
                ]
              },
              {
                title: "Instructors",
                features: [
                  "Upload and manage course videos",
                  "View AI-generated summaries",
                  "Monitor student engagement",
                  "Manage course content"
                ]
              },
              {
                title: "Administrators",
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl text-black">
                      {role.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {role.features.map((feature, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: (index * 0.2) + (i * 0.1) }}
                        viewport={{ once: true }}
                        className="flex items-center"
                      >
                        <span className="w-2 h-2 bg-black rounded-full mr-3 flex-shrink-0"></span>
                        {feature}
                      </motion.p>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900"></div>
        <div className="container mx-auto max-w-4xl text-center space-y-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold"
          >
            Ready to Transform Your Learning?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-300"
          >
            Join thousands of students and instructors already using AI-Learn LMS
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-200 shadow-lg" asChild>
                <Link href="/register">Create Free Account</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black shadow-lg" asChild>
                <Link href="/login">Login to Continue</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaTint,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaBell,
  FaUserFriends,
  FaHospitalSymbol,
  FaHandsHelping,
  FaPaperPlane,
} from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const Home = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [faqOpen, setFaqOpen] = useState({});

  // Scroll to section when navigated from other pages
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getRequestLink = () => {
    if (!user) return '/login?redirect=patient';
    if (user.role === 'donor') return '/donor/dashboard';
    return `/${user.role}/dashboard`;
  };

  const getBecomeDonorLink = () => {
    if (user) {
      if (user.role === 'donor') return '/donor/dashboard';
      return `/${user.role}/dashboard`;
    }
    return '/register-donor';
  };

  const faqs = [
    {
      q: 'Is LifeDrop a blood bank?',
      a: 'No. LifeDrop is a real-time emergency network. We do not store blood. Instead, we match hospitals and patients with nearby registered donors instantly during critical shortages.',
    },
    {
      q: 'How does geolocation help in finding donors?',
      a: 'We use the browser Geolocation API to find available donors nearest to the requesting hospital. By utilizing the Haversine formula, we calculate distances and prioritize dispatch notifications to the closest matches.',
    },
    {
      q: 'Who can register as a donor?',
      a: 'Anyone aged between 18 and 65, weighing more than 45kg, and in good health can register. You can toggle your availability at any time from your dashboard.',
    },
    {
      q: 'Are hospital details verified?',
      a: 'Yes. Every hospital registration requires a license number. The system admin must manually review and approve the hospital account before they are allowed to create emergency requests.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-900 via-primary-800 to-red-950 py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(229,62,62,0.15),transparent)]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8 text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-primary-700/50 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-200 border border-primary-600/30">
                🔴 Real-Time Emergency Network
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                Every Second Counts. <br />
                <span className="bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
                  Get Blood Instantly.
                </span>
              </h1>
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-primary-100">
                LifeDrop connects hospitals and patients with the nearest eligible blood donors automatically. No middleman. No delay.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  to={getRequestLink()}
                  className="rounded-full bg-white px-8 py-4 text-base font-bold text-primary-700 hover:bg-primary-50 shadow-lg shadow-black/10 hover:shadow-xl transition-all"
                >
                  Emergency Blood Request
                </Link>
                <Link
                  to={getBecomeDonorLink()}
                  className="rounded-full bg-primary-600 px-8 py-4 text-base font-bold text-white hover:bg-primary-700 border border-primary-500 shadow-md shadow-primary-900/30 hover:shadow-lg transition-all"
                >
                  Become a Donor
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center relative">
              <div className="h-96 w-96 rounded-full bg-gradient-to-tr from-primary-600 to-red-500 flex items-center justify-center shadow-2xl relative animate-pulse duration-3000">
                <FaTint className="h-44 w-44 text-white" />
                <span className="absolute -top-4 -left-4 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm border border-white/20">
                  ⚡ Match in Seconds
                </span>
                <span className="absolute -bottom-4 -right-4 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm border border-white/20">
                  📍 GPS Tracked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About LifeDrop */}
      <section id="about" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              About LifeDrop
            </h2>
            <div className="mx-auto h-1 w-12 bg-primary-500 rounded-full"></div>
            <p className="max-w-2xl mx-auto text-lg text-gray-500">
              Traditional blood donation sites focus on blood drives. LifeDrop is different. We focus exclusively on the **immediate emergency request**.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <FaMapMarkerAlt className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">Geographic Proximity</h3>
              <p className="mt-2 text-sm text-gray-500">
                Using browser geolocation and the Haversine formula, we select and sort donors closest to the hospital first, reducing critical transit delays.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">Medical Eligibility</h3>
              <p className="mt-2 text-sm text-gray-500">
                Our system enforces donor rules, confirming availability toggles, age, weight, and the minimum required 3-month gap between donations.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <FaBell className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">Instant Alerting</h3>
              <p className="mt-2 text-sm text-gray-500">
                WebSockets push notifications immediately to the screens of matching available donors, prompting action in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <div className="mx-auto h-1 w-12 bg-primary-500 rounded-full"></div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4 relative">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white text-xl font-extrabold shadow-md shadow-primary-500/10">
                1
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">Create Request</h3>
              <p className="mt-2 text-sm text-gray-500 px-4">
                A patient or hospital creates an emergency request detailing blood group and location.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white text-xl font-extrabold shadow-md shadow-primary-500/10">
                2
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">Matching & Routing</h3>
              <p className="mt-2 text-sm text-gray-500 px-4">
                System matches eligible, available blood groups and calculates the nearest donors.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white text-xl font-extrabold shadow-md shadow-primary-500/10">
                3
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">Instant Alert</h3>
              <p className="mt-2 text-sm text-gray-500 px-4">
                Matching donors receive real-time web alerts. The first donor to accept is locked-in.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white text-xl font-extrabold shadow-md shadow-primary-500/10">
                4
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">Life Saved</h3>
              <p className="mt-2 text-sm text-gray-500 px-4">
                The donor arrives at the hospital, coordinates details on the map, and saves a life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center space-y-2 border-r border-gray-100 last:border-0">
              <div className="flex justify-center text-primary-500">
                <FaUserFriends className="h-10 w-10" />
              </div>
              <p className="text-4xl font-extrabold text-gray-900">5,420+</p>
              <p className="text-sm font-semibold text-gray-500">Registered Donors</p>
            </div>

            <div className="text-center space-y-2 border-r border-gray-100 last:border-0">
              <div className="flex justify-center text-primary-500">
                <FaHandsHelping className="h-10 w-10" />
              </div>
              <p className="text-4xl font-extrabold text-gray-900">3,120+</p>
              <p className="text-sm font-semibold text-gray-500">Lives Impacted</p>
            </div>

            <div className="text-center space-y-2 border-r border-gray-100 last:border-0">
              <div className="flex justify-center text-primary-500">
                <FaHospitalSymbol className="h-10 w-10" />
              </div>
              <p className="text-4xl font-extrabold text-gray-900">180+</p>
              <p className="text-sm font-semibold text-gray-500">Partnered Hospitals</p>
            </div>

            <div className="text-center space-y-2 last:border-0">
              <div className="flex justify-center text-primary-500">
                <FaTint className="h-10 w-10" />
              </div>
              <p className="text-4xl font-extrabold text-gray-900">&lt; 15m</p>
              <p className="text-sm font-semibold text-gray-500">Avg. Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Success Stories
            </h2>
            <div className="mx-auto h-1 w-12 bg-primary-500 rounded-full"></div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 border border-gray-100 shadow-sm">
              <p className="text-gray-600 italic">
                "Our hospital faced a critical shortage of O- negative blood during a trauma surgery. Within 4 minutes of dispatching the request on LifeDrop, a donor accepted the task and arrived in under 12 minutes. The patient was saved."
              </p>
              <div className="mt-6 flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                  H
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Dr. Rajesh Patel</h4>
                  <p className="text-xs text-gray-400">Chief Officer, City Care Hospital</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 border border-gray-100 shadow-sm">
              <p className="text-gray-600 italic">
                "As an active donor, I always wanted to help but rarely knew when or where blood was needed immediately. The LifeDrop map alerted me when a patient was just 2km away. Being able to accept the request and drive there instantly felt amazing."
              </p>
              <div className="mt-6 flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                  D
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Amit Sharma</h4>
                  <p className="text-xs text-gray-400">Registered O+ Donor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto h-1 w-12 bg-primary-500 rounded-full"></div>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between text-left font-bold text-gray-900 py-3 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className="ml-6 text-primary-500 text-lg">{faqOpen[index] ? '−' : '+'}</span>
                </button>
                {faqOpen[index] && (
                  <div className="mt-2 text-sm text-gray-500 leading-relaxed pr-8 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Contact Our Team
            </h2>
            <div className="mx-auto h-1 w-12 bg-primary-500 rounded-full"></div>
            <p className="text-gray-500">
              Have questions or want to partner your hospital with our network? Send us a message.
            </p>
          </div>

          <div className="mx-auto max-w-xl mt-12 rounded-2xl bg-white p-8 border border-gray-100 shadow-sm">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Message</label>
                <textarea
                  rows={4}
                  placeholder="Write your message here..."
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none transition-colors"
              >
                <FaPaperPlane className="mr-2" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

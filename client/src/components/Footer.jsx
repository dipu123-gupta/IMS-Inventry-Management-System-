import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  Linkedin, 
  Twitter, 
  Github, 
  ExternalLink,
  Store
} from 'lucide-react';
import { footerNavigation, quickActions } from '../config/routes.config';

const Footer = () => {
  const [openSections, setOpenSections] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (category) => {
    setOpenSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <footer className="bg-base-100 border-t border-base-300 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          {/* Company Info - Column 1 & 2 */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-base-content">
                IMS <span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-sm text-base-content/60 mb-6 leading-relaxed">
              Premium Inventory & Warehouse Management for modern enterprises. Streamline your operations with real-time insights.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-base-content/40 hover:text-primary transition-colors duration-200" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-base-content/40 hover:text-primary transition-colors duration-200" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-base-content/40 hover:text-primary transition-colors duration-200" aria-label="Github">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Dynamic Navigation Columns */}
          {footerNavigation.map((section) => (
            <div key={section.category} className="lg:col-span-1">
              {/* Desktop Header */}
              <h3 className="hidden md:block text-sm font-semibold text-base-content uppercase tracking-wider mb-4">
                {section.category}
              </h3>

              {/* Mobile Header (Accordion) */}
              <button 
                onClick={() => toggleSection(section.category)}
                className="md:hidden flex items-center justify-between w-full py-4 text-left font-semibold text-base-content border-b border-base-200"
              >
                {section.category}
                {openSections[section.category] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Links */}
              <ul className={`mt-2 md:mt-0 space-y-2 md:block ${openSections[section.category] ? 'block' : 'hidden'}`}>
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path}
                      className={`flex items-center gap-2 text-sm transition-all duration-200 py-1 hover:translate-x-1 ${
                        isActive(link.path) 
                          ? 'text-primary font-medium' 
                          : 'text-base-content/60 hover:text-primary'
                      }`}
                    >
                      <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'text-primary' : 'text-base-content/40'}`} />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick Actions / Shortcuts */}
          <div className="lg:col-span-1">
             <h3 className="hidden md:block text-sm font-semibold text-base-content uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                {quickActions.map(action => (
                  <li key={action.name}>
                    <Link to={action.path} className="text-sm text-base-content/60 hover:text-primary transition-all flex items-center gap-2 group">
                      <action.icon className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
                      {action.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="#" className="text-sm text-base-content/60 hover:text-primary transition-all flex items-center gap-2 group">
                    <ExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary" />
                    Support Docs
                  </a>
                </li>
              </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-base-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-base-content/50">
            © 2026 IMS Pro Workspace. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-base-content/40 hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-base-content/40 hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-base-content/40 hover:text-primary transition-colors">Clock Speed</a>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-content rounded-full shadow-lg hover:bg-primary-focus transition-all duration-300 z-50 animate-in fade-in zoom-in"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
};

export default Footer;

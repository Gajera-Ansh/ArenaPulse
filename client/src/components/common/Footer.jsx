import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border py-6 glass-panel mt-auto">
      <div className="container">
        <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
          <div className="text-[0.85rem] text-text-secondary">
            © {new Date().getFullYear()} ArenaPulse. Built for competitive gamers.
          </div>
          <ul className="flex gap-6 list-none">
            <li><Link to="#" className="text-[0.85rem] text-text-secondary hover:text-primary transition-colors">About</Link></li>
            <li><Link to="#" className="text-[0.85rem] text-text-secondary hover:text-primary transition-colors">Terms</Link></li>
            <li><Link to="#" className="text-[0.85rem] text-text-secondary hover:text-primary transition-colors">Privacy</Link></li>
            <li><Link to="#" className="text-[0.85rem] text-text-secondary hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

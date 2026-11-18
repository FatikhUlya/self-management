'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { slideUp } from '@/lib/animations';

export function MobileNav() {
 const pathname = usePathname();
 const { t } = useI18n();
 const [isOpen, setIsOpen] = useState(false);

 const mainBarItems = [
 NAV_ITEMS.find(item => item.id === 'dashboard'),
 NAV_ITEMS.find(item => item.id === 'planning'),
 NAV_ITEMS.find(item => item.id === 'health'),
 NAV_ITEMS.find(item => item.id === 'journal'),
 ].filter(Boolean) as typeof NAV_ITEMS[number][];

 return (
 <>
 <nav 
 className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-1 bg-card/90 backdrop-blur-md border-t border-border h-14"
 aria-label="Navigasi bawah mobile"
 >
 {mainBarItems.map((item) => {
 const isActive = pathname === item.path;
 return (
 <Link
 key={item.id}
 href={item.path}
 className={cn(
 "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
 isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
 )}
 >
 <Icon 
 name={item.icon} 
 size={18} 
 className={isActive ? "text-primary" : "text-muted-foreground"}
 />
 <span className="mt-1 tracking-tight text-[9px]">{t(item.labelKey)}</span>
 </Link>
 );
 })}

 {/* More Menu Button */}
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
 isOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
 )}
 >
 <Icon 
 name={isOpen ? 'x' : 'menu'} 
 size={18} 
 className={isOpen ? "text-primary" : "text-muted-foreground"}
 />
 <span className="mt-1 tracking-tight text-[9px]">{isOpen ? 'Tutup' : 'Lainnya'}</span>
 </button>
 </nav>

 <AnimatePresence>
 {isOpen && (
 <>
 {/* Backdrop */}
 <motion.div
 key="mobile-backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-xs"
 onClick={() => setIsOpen(false)}
 />

 {/* Bottom Sheet Panel */}
 <motion.div
 key="mobile-sheet"
 variants={slideUp}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="md:hidden fixed bottom-0 left-0 right-0 z-30 rounded-t-2xl px-6 pb-20 pt-4 max-h-[75vh] overflow-y-auto bg-card border-t border-border shadow-xl"
 >
 {/* Grab Handle */}
 <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-muted-foreground/30" />

 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-5">
 Semua Fitur Life OS
 </h3>

 {/* Grid of all items */}
 <div className="grid grid-cols-3 gap-2.5 pb-6">
 {NAV_ITEMS.map((item, index) => {
 const isActive = pathname === item.path;
 return (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.03, duration: 0.2 }}
 >
 <Link
 href={item.path}
 onClick={() => setIsOpen(false)}
 className={cn(
 "flex flex-col items-center p-3 rounded-lg border text-center transition-all active:scale-95",
 isActive
 ? "bg-primary/10 text-primary border-primary/20 font-semibold"
 : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
 )}
 >
 <Icon 
 name={item.icon} 
 size={18} 
 className={isActive ? "text-primary" : "text-muted-foreground"}
 />
 <span className="mt-1.5 text-[10px] font-medium leading-tight">{t(item.labelKey)}</span>
 </Link>
 </motion.div>
 );
 })}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </>
 );
}

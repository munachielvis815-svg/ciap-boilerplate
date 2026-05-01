'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlass, Bell } from '@phosphor-icons/react';
import { useMeProfile } from '@/lib/api/hooks';
import { toast } from 'sonner';

export default function Header() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data } = useMeProfile();
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  return (
    <header className="h-20 md:h-16 bg-white border-b-2 border-black flex items-center justify-between px-6 md:px-8 fixed top-0 left-0 right-0 z-[60] md:left-20 transition-all">
      <div className="flex items-center gap-4 md:gap-8">
        <span 
          className="text-lg md:text-xl font-black tracking-tighter text-black cursor-pointer whitespace-nowrap" 
          onClick={() => setActiveTab('dashboard')}
        >
          domi<span className="text-zinc-400">ron</span>
        </span>
        
        <div className={`flex items-center gap-3 relative transition-all duration-300 ease-in-out ${isFocused || search ? 'w-[200px] sm:w-[350px]' : 'w-[140px] sm:w-[220px]'}`}>
          <MagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-black' : 'text-zinc-400'}`} size={16} weight="bold" />
          <input 
            type="text" 
            value={search}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && toast.info(`Searching for "${search}"...`)}
            placeholder="Search..." 
            className="w-full pl-12 pr-5 py-3 bg-white border-2 border-black rounded-full text-xs font-bold outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-zinc-300" 
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button 
          onClick={() => setActiveTab('notifications')} 
          className="p-2.5 transition-all relative text-zinc-300 hover:text-black group"
        >
          <Bell size={24} weight="bold" className="group-hover:scale-110 transition-transform text-black" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
        </button>

        <div 
          className="flex items-center gap-3 cursor-pointer group bg-white border-2 border-black px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-zinc-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
          onClick={() => setActiveTab('profile')}
        >
          <div className="text-right hidden sm:block">
             <p className="text-[10px] font-black leading-none tracking-tight text-black truncate max-w-[80px]">{data?.profile?.name || 'Account'}</p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-zinc-100 border border-black flex-shrink-0">
            <img src={`https://i.pravatar.cc/100?u=${data?.profile?.id || 'demo'}`} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}

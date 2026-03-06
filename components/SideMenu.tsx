import React, { FC } from "react";
import Logo from "./Logo";
import { X } from "lucide-react";
import { headerData } from "@/constants/data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SocialMedia from "./SocialMedia";
import { useOutsideClick } from "@/hooks";
import { cn } from "@/lib/utils";

interface SidebarProps{
    isOpen: boolean;
    onClose: () => void;
}

const SideMenu:FC<SidebarProps> = ({isOpen, onClose}) => {
    const pathname = usePathname();
    const sidebarRef = useOutsideClick<HTMLDivElement>(onClose);

  return (
    <div className={cn(
      "fixed inset-0 left-0 z-50 w-full bg-shop_dark_green/10 backdrop-blur-[1.5px] transition-transform duration-300 ease-out",
      isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
    )}>
        <div
          ref={sidebarRef}
          className="flex h-screen min-w-72 max-w-96 flex-col gap-6 border-r border-r-shop_light_green/30 bg-white/95 p-8 text-darkColor shadow-2xl"
        >
            <div className='flex items-center justify-between gap-5'>
                <Logo />
                <button
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/35 text-lightColor hover:border-shop_light_green hover:text-shop_dark_green hoverEffect"
                >
                    <X className="h-4.5 w-4.5" />
                </button>
            </div>

            <div className='flex flex-col space-y-1.5 font-semibold tracking-wide'>
                {headerData?.map((item)=>(
                    <Link
                      href={item?.href}
                      key={item?.title}
                      onClick={onClose}
                      className={cn(
                        "rounded-xl px-3 py-2 capitalize text-[15px] text-lightColor transition-all duration-300 ease-out hover:bg-shop_light_bg hover:text-shop_dark_green",
                        pathname === item?.href && "bg-shop_light_bg text-shop_dark_green"
                      )}
                    >
                        {item?.title}
                    </Link>
                ))}
            </div>
            <div className="mt-auto border-t border-shop_light_green/20 pt-5">
              <SocialMedia
                iconClassName="border-shop_light_green/40 text-lightColor hover:bg-shop_dark_green hover:border-shop_dark_green"
                tooltipClassName="bg-shop_dark_green text-white"
              />
            </div>
        </div> 
    </div>
  )
}

export default SideMenu

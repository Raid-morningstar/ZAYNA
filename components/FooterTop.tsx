import { Clock, Mail, Phone } from 'lucide-react';
import React from 'react'

interface ContactItemData {
    title: string;
    description: string;
    icon: React.ReactNode;
}
const data: ContactItemData[] = [
    {
        title: "Appelez-nous",
        description: "+212 6 12 34 56 78",
        icon: (
            <Phone className='h-6 w-6 text-gray-600 group-hover:text-primary transition-colors' />
        ),
    },
    {
        title: "Horaires",
        description: "Lun-Ven : 9h - 18h",
        icon: (
            <Clock className='h-6 w-6 text-gray-600 group-hover:text-primary transition-colors' />
        ),
    },
    {
        title: "Ecrivez-nous",
        description: "contact@heypara.ma",
        icon: (
            <Mail className='h-6 w-6 text-gray-600 group-hover:text-primary transition-colors' />
        ),
    },
]

const FooterTop = () => {
  return (
    <div
      id="contact"
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-shop_light_green/20 py-6 scroll-mt-28'
    >
        {data?.map((item, index)=>
            <div key={index} className='flex items-center gap-3 group rounded-xl border border-shop_light_green/20 bg-white p-4 hover:border-shop_light_green/40 hover:shadow-sm transition-all hoverEffect'>
                {item?.icon}
                <div>
                    <h3 className='font-semibold text-gray-900 group-hover:text-black hoverEffect'>{item?.title}</h3>
                    <p className='text-gray-600 text-sm mt-1 group-hover:text-gray-900 hoverEffect'>{item?.description}</p>
                </div>
            </div>
        )}
    </div>
  )
}


export default FooterTop

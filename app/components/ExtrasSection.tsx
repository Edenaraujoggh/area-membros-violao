'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Headphones, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Extra {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  link_url: string;
}

export default function ExtrasSection() {
  const router = useRouter();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('type', 'support')
      .order('order_num', { ascending: true });

    if (data) setExtras(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Headphones className="w-6 h-6 text-orange-500" />
          Aulas de Suporte
        </h2>
        <div className="animate-pulse bg-gray-800 h-64 rounded-xl"></div>
      </section>
    );
  }

  if (extras.length === 0) return null;

  return (
    <section className="mt-12 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Headphones className="w-6 h-6 text-orange-500" />
          Aulas de Suporte
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extras.map((extra) => (
          <div
            key={extra.id}
            onClick={() => router.push(`/suporte/${extra.id}`)}
            className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-all duration-300 hover:transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden">
              {extra.thumbnail_url ? (
                <Image
                  src={extra.thumbnail_url}
                  alt={extra.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center">
                  <Headphones className="w-16 h-16 text-orange-500" />
                </div>
              )}
              
              {/* Badge */}
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Suporte
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-orange-500 rounded-full p-3">
                  <Play className="w-8 h-8 text-white fill-current" />
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition">
                {extra.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2">
                {extra.description}
              </p>
              
              <button className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white font-medium py-2 rounded-lg transition-colors">
                Ver aulas
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
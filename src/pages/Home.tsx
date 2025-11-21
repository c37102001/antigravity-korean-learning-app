import React from 'react';
import { Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { ChevronRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-slate-900 tracking-tight">
          韓文文法 <span className="text-indigo-600">4 週速通</span>計畫
        </h1>
        <p className="text-lg text-slate-600">
          紮實但不鑽牛角尖，短時間打好整套基礎。
        </p>
      </div>

      <div className="space-y-12">
        {curriculum.weeks.map((week) => (
          <div key={week.id} className="relative">
            <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{week.title}</h2>
                <p className="mt-1 text-slate-600">{week.description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
              {week.days.map((day) => (
                <Link
                  key={day.id}
                  to={`/week/${week.id}/day/${day.id}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:translate-x-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {day.id.split('-')[1].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {day.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {day.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

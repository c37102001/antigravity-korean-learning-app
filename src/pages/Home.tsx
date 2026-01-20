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

      <div className="mb-8">
        <Link
          to="/personal"
          className="group relative block overflow-hidden rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-6 transition-all hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">
                個人字卡學習區
              </h2>
              <p className="mt-2 text-lg text-indigo-700">
                建立你的專屬字卡，隨時複習新單字與句子。
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-1">
        {curriculum.folders.map((folder) => (
          <Link
            key={folder.id}
            to={`/folder/${folder.id}`}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {folder.title}
                </h2>
                <p className="mt-2 text-lg text-slate-600">
                  {folder.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-800">
                    {folder.lessons.length} 堂課
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ChevronRight className="h-6 w-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

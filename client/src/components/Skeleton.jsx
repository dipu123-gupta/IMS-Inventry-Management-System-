import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-base-300 rounded-md ${className}`}></div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="w-full space-y-4">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="overflow-x-auto border border-base-300 rounded-lg">
      <table className="table">
        <thead className="bg-base-200">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton className="h-4 w-20" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><Skeleton className={`h-4 ${j === 0 ? 'w-40' : 'w-24'}`} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const CardSkeleton = ({ count = 1 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card bg-base-100 shadow-md border border-base-300 p-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 pb-12">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <CardSkeleton count={4} />
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Skeleton className="xl:col-span-2 h-[400px] rounded-2xl" />
      <Skeleton className="h-[400px] rounded-2xl" />
    </div>
  </div>
);

export default Skeleton;

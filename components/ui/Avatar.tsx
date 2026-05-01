import React from 'react';

function initialsFromName(name?: string) {
  if (!name) return 'D';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

export default function Avatar({ name }: { name?: string }) {
  const initials = initialsFromName(name);
  const hue = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % 360;
  const bg = `hsl(${hue} 70% 75%)`;
  const color = `hsl(${hue} 40% 25%)`;

  return (
    <div style={{ background: bg, color }} className="w-10 h-10 rounded-full flex items-center justify-center font-bold">
      {initials}
    </div>
  );
}
